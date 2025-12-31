import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ProductsService {
  private readonly USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  async getProductInfo(url: string) {
    if (url.includes('aliexpress.com')) {
      return this.crawlWithPuppeteer(url);
    }
    return this.crawlWithAxios(url);
  }

  // ==========================================
  // Puppeteer Logic (AliExpress)
  // ==========================================
  private async crawlWithPuppeteer(url: string) {
    let browser;
    try {
      browser = await this.launchBrowser();
      const page = await browser.newPage();
      const cleanUrl = url.split('?')[0];

      await this.configurePage(page);

      // Navigate
      // 타임아웃 방지를 위해 domcontentloaded 사용
      const response = await page.goto(cleanUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // Simple Wait for critical data
      try {
        await page
          .waitForSelector('script[type="application/ld+json"]', {
            timeout: 1000,
          })
          .catch(() => {});
      } catch (e) {}

      // Check 404
      const status = response?.status();
      const pageTitle = await page.title();
      if (
        status === 404 ||
        pageTitle.includes('404') ||
        pageTitle.includes('Page Not Found')
      ) {
        throw new Error(`AliExpress returned 404. Page Title: ${pageTitle}`);
      }

      // Random wait for evasion
      await new Promise((r) => setTimeout(r, Math.random() * 1000 + 500));

      const data = await this.extractFromPuppeteer(page);
      return data;
    } catch (error) {
      console.error('Puppeteer Crawling Error:', error);
      return { title: 'Error', price: 0, image: '' };
    } finally {
      if (browser) await browser.close();
    }
  }

  private async launchBrowser() {
    const puppeteer = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    puppeteer.use(StealthPlugin());

    return await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--window-size=1920,1080',
      ],
      ignoreHTTPSErrors: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });
  }

  private async configurePage(page: any) {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      Referer: 'https://www.google.com/',
    });
    await page.setUserAgent(this.USER_AGENT);
    await page.setCookie(
      {
        name: 'aep_usuc_f',
        value: 'site=kor&c_tp=KRW&region=KR&b_locale=ko_KR',
        domain: '.aliexpress.com',
      },
      {
        name: 'xman_us_f',
        value: 'x_l=0&x_locale=ko_KR',
        domain: '.aliexpress.com',
      },
      { name: 'intl_locale', value: 'ko_KR', domain: '.aliexpress.com' },
    );
  }

  private async extractFromPuppeteer(page: any) {
    let title = '';
    let price = 0;
    let image = '';

    // 1. LD-JSON (Primary)
    try {
      const jsonLd = await page
        .$eval('script[type="application/ld+json"]', (el) => el.textContent)
        .catch(() => null);
      if (jsonLd) {
        const parsed = JSON.parse(jsonLd);
        const data = Array.isArray(parsed) ? parsed[0] : parsed;
        title = data.name || '';
        image = Array.isArray(data.image) ? data.image[0] : data.image || '';
        if (data.offers) {
          const offers = Array.isArray(data.offers)
            ? data.offers[0]
            : data.offers;
          price = parseInt(offers.price, 10) || 0;
        }
      }
    } catch (e) {}

    // 2. RunParams (Secondary)
    if (!price) {
      try {
        const data = await page.evaluate(() => {
          // @ts-ignore
          const p = window.runParams?.data;
          if (!p) return null;
          return {
            title: p.productInfoComponent?.subject || p.titleModule?.subject,
            image:
              p.imageModule?.imagePathList?.[0] ||
              p.productInfoComponent?.imagePathList?.[0],
            price:
              p.priceComponent?.discountPrice?.minActivityAmount?.value ||
              p.priceComponent?.origPrice?.minAmount?.value,
          };
        });
        if (data) {
          if (!title) title = data.title;
          if (!image) image = data.image;
          if (!price) price = this.parsePrice(String(data.price));
        }
      } catch (e) {}
    }

    // 3. Meta Tags & Fallback Selectors
    if (!title) {
      title =
        (await page
          .$eval('meta[property="og:title"]', (el) => el.content)
          .catch(() => '')) || (await page.title());
    }
    if (!image) {
      image = await page
        .$eval('meta[property="og:image"]', (el) => el.content)
        .catch(() => '');
    }

    // 4. Regex Fallback (Last Resort for Price)
    if (!price) {
      try {
        const body = await page.$eval('body', (el) => el.innerText);
        const matches =
          body.match(/₩\s*([\d,]+)/) ||
          body.match(/KRW\s*([\d,]+)/) ||
          body.match(/([\d,]+)\s*원/);
        if (matches) price = this.parsePrice(matches[1]);
      } catch (e) {}
    }

    console.log(
      `[Puppeteer Extracted] Title: ${title?.substring(0, 20)}..., Price: ${price}, Image Found: ${!!image}`,
    );
    return { title: title?.trim(), price, image };
  }

  // ==========================================
  // Axios Logic (Amazon / Others)
  // ==========================================
  private async crawlWithAxios(url: string) {
    try {
      const { data } = await axios.get(decodeURIComponent(url), {
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          Referer: 'https://www.google.com/',
          Cookie: 'i18n-prefs=KRW; lc-main=ko_KR; sp-cdn="L5Z9:KR";',
        },
      });

      const $ = cheerio.load(data);
      const title =
        $('meta[property="og:title"]').attr('content') || $('title').text();
      let image = $('meta[property="og:image"]').attr('content');

      // Amazon Image Fallback
      if ((!image || image.includes('captcha')) && url.includes('amazon')) {
        image =
          $('#landingImage').attr('data-old-hires') ||
          $('#landingImage').attr('src') ||
          $('#imgBlkFront').attr('src') ||
          $('.a-dynamic-image').first().attr('src');
      }

      let priceText =
        $('.product-detail__price-value').first().text() ||
        $('.total_price').text() ||
        $('.price_sect').text() ||
        $('.price').first().text() ||
        $('.amount').first().text() ||
        $('input[name="priceValue"]').val() ||
        $('#priceblock_ourprice').text() ||
        $('#priceblock_dealprice').text() ||
        $('.a-price .a-offscreen').first().text();

      return {
        title: title?.trim(),
        price: this.parsePrice(String(priceText)),
        image,
      };
    } catch (error) {
      console.error('Axios Crawling Error:', error);
      return { title: 'Error', price: 0, image: '' };
    }
  }

  private parsePrice(text: string): number {
    if (!text) return 0;
    const match = text.match(/[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''), 10) || 0;
    }
    return 0;
  }

  // ... generated CRUD methods ...
  create(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
  }
  findAll() {
    return `This action returns all products`;
  }
  findOne(id: number) {
    return `This action returns a #${id} product`;
  }
  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }
  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
