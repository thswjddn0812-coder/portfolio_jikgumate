import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import axios from 'axios';
import * as cheerio from 'cheerio';
@Injectable()
export class ProductsService {
  private readonly USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

  async getProductInfo(url: string) {
    if (url.includes('aliexpress.com')) {
      return this.crawlWithPuppeteer(url);
    }
    return this.crawlWithAxios(url);
  }

  private async crawlWithPuppeteer(url: string) {
    const puppeteer = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    puppeteer.use(StealthPlugin());

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent(this.USER_AGENT);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const data = await this.extractAliExpressData(page);
      
      return { ...data, url };
    } catch (error) {
      console.error('Puppeteer Crawling Error:', error);
      return { error: '정보를 가져오는데 실패했습니다.', detail: error.message };
    } finally {
      await browser.close();
    }
  }

  private async extractAliExpressData(page: any) {
    let title = '';
    let price = 0;
    let image = '';
    let description = '';

    // 1. Try LD-JSON (Best for AliExpress)
    const jsonLd = await page.$eval('script[type="application/ld+json"]', (el) => el.textContent).catch(() => null);
    if (jsonLd) {
      try {
        const parsed = JSON.parse(jsonLd);
        const data = Array.isArray(parsed) ? parsed[0] : parsed;
        title = data.name;
        image = Array.isArray(data.image) ? data.image[0] : data.image;
        price = parseInt(data.offers?.price, 10) || 0;
        description = data.description;
      } catch (e) {
        console.log('AliExpress JSON parse error', e);
      }
    }

    // 2. Fallback Selectors
    if (!title) {
        title = await page.$eval('.product-title-text', (el) => el.textContent).catch(() => '');
    }
    if (!price) {
        const priceText = await page.$eval('.product-price-current', (el) => el.textContent).catch(() => '0');
        price = this.parsePrice(priceText);
    }
    if (!image) {
        image = await page.$eval('.product-image-current', (el) => el.getAttribute('src')).catch(() => '');
    }

    // 3. Common Meta Tags (Last Resort for Description/Image)
    if (!description) {
        description = await page.$eval('meta[property="og:description"]', (el) => el.content).catch(() => '');
    }
    
    return { title: title?.trim(), price, image, desc: description?.trim() };
  }

  private async crawlWithAxios(url: string) {
    try {
      const { data } = await axios.get(decodeURIComponent(url), {
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          Referer: 'https://www.google.com/',
        },
      });

      const $ = cheerio.load(data);
      
      const title = $('meta[property="og:title"]').attr('content') || $('title').text();
      const image = $('meta[property="og:image"]').attr('content');
      const description = $('meta[property="og:description"]').attr('content');

      // Price Extraction Strategies
      let priceText = 
        $('.product-detail__price-value').first().text() || 
        $('.total_price').text() || 
        $('.price_sect').text() || 
        $('.price').first().text() || 
        $('.amount').first().text();
      
      // Amazon specific selectors
      if (url.includes('amazon')) {
          priceText = $('input[name="priceValue"]').val() || $('#priceblock_ourprice').text() || $('#priceblock_dealprice').text() || $('.a-price .a-offscreen').first().text() || priceText;
      }
      
      // Fallback: finding price in description if not found in specific tags
      if (!priceText && description) {
        const matches = description.match(/[\d,]+/g);
        if (matches && matches.length > 0) {
          priceText = matches[matches.length - 1];
        }
      }

      return {
        title: title?.trim(),
        image,
        price: this.parsePrice(priceText),
        desc: description?.trim(),
        url,
      };
    } catch (error) {
      console.error('Axios Crawling Error:', error);
      return { error: '정보를 가져오는데 실패했습니다.', detail: error.message };
    }
  }

  private parsePrice(text: string): number {
    if (!text) return 0;
    
    // 숫자와 콤마가 포함된 첫 번째 패턴을 찾음 (예: "229,000" -> "229,000")
    // 기존방식: "229,000원... 010-1234" -> "2290000101234" (문제 발생)
    // 변경방식: "229,000원... 010-1234" -> "229,000" -> 229000
    const match = text.match(/[\d,]+/);
    if (match) {
        return parseInt(match[0].replace(/,/g, ''), 10) || 0;
    }
    
    return 0;
  }
 
  // ... generated CRUD methods ...
  create(createProductDto: CreateProductDto) { return 'This action adds a new product'; }
  findAll() { return `This action returns all products`; }
  findOne(id: number) { return `This action returns a #${id} product`; }
  update(id: number, updateProductDto: UpdateProductDto) { return `This action updates a #${id} product`; }
  remove(id: number) { return `This action removes a #${id} product`; }
}
