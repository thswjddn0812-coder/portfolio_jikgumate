import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Products } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
  ) {}
  private readonly USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  async getProductInfo(rawUrl: string) {
    let url = rawUrl.trim();
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    // 모든 사이트를 Puppeteer로 크롤링 (Axios 차단 우회)
    return this.crawlWithPuppeteer(url);
  }

  // ... (analyzeAndCreate method remains unchanged)

  async analyzeAndCreate(url: string) {
    const info = await this.getProductInfo(url);

    if (!info.title || info.title === 'Error') {
      throw new Error(
        `Product crawling failed: ${info.error || 'Title not found'}`,
      );
    }

    const existingProduct = await this.productsRepository.findOne({
      where: { nameKo: info.title },
    });
    if (existingProduct) {
      return { ...info, productId: existingProduct.productId };
    }

    const newProduct = this.productsRepository.create({
      originalUrl: url,
      nameKo: info.title,
      nameEn: 'Product Name', // Default value to prevent DB error
      priceUsd: String(info.price),
      imageUrl: info.image || '', // Default to empty string if missing
      category: 'UNCATEGORIZED',
    });
    const saved = await this.productsRepository.save(newProduct);
    return { ...info, productId: saved.productId };
  }

  private async crawlWithPuppeteer(url: string) {
    const puppeteer = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    puppeteer.use(StealthPlugin());

    const browser = await puppeteer.launch({
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

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      // 1. 헤더 추가 (Referer 및 Accept-Language)
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        Referer: 'https://www.google.com/',
      });
      await page.setUserAgent(this.USER_AGENT);

      // 2. 쿠키 설정 (알리익스프레스 및 아마존용)
      if (url.includes('aliexpress.com')) {
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
      } else if (url.includes('amazon')) {
        await page.setCookie(
          { name: 'i18n-prefs', value: 'KRW', domain: '.amazon.com' },
          { name: 'lc-main', value: 'ko_KR', domain: '.amazon.com' },
        );
      }

      // 짧은 랜덤 대기
      await new Promise((r) => setTimeout(r, Math.random() * 1000 + 500));

      // 3. 페이지 이동
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // 주요 컨텐츠 로딩 대기
      try {
        if (url.includes('amazon')) {
          await page
            .waitForSelector('#productTitle', { timeout: 2000 })
            .catch(() => {});
        } else {
          await page
            .waitForSelector('script[type="application/ld+json"]', {
              timeout: 1000,
            })
            .catch(() => {});
        }
      } catch (e) {}

      // 404 및 차단 확인
      const status = response?.status();
      const pageTitle = await page.title();

      console.log(
        `[Crawling Debug] Status: ${status}, Title: "${pageTitle}", URL: ${url}`,
      );

      if (
        status === 404 ||
        pageTitle.includes('404') ||
        pageTitle.includes('Page Not Found')
      ) {
        throw new Error(`Page returned 404. Title: ${pageTitle}`);
      }

      // Amazon 캡차/봇 탐지 페이지 확인
      if (pageTitle.includes('Robot Check') || pageTitle.includes('Captcha')) {
        throw new Error('Blocked by Bot Detection (Captcha)');
      }

      // 봇 탐지 우회를 위한 약간의 랜덤 대기
      await new Promise((r) => setTimeout(r, Math.random() * 2000 + 1000));

      let data;
      if (url.includes('aliexpress.com')) {
        data = await this.extractAliExpressData(page);
      } else {
        data = await this.extractGeneralData(page);
      }

      return { ...data, url };
    } catch (error) {
      console.error('Puppeteer Crawling Error:', error);
      return {
        title: 'Error',
        price: 0,
        image: '',
        desc: '',
        url,
        error: '정보를 가져오는데 실패했습니다.',
        detail: error.message,
      };
    } finally {
      await browser.close();
    }
  }

  private async extractAliExpressData(page: any) {
    let title = '';
    let price = 0;
    let image = '';
    let description = '';

    // 1. Try LD-JSON (Most Reliable and Standard)
    try {
      const jsonLd = await page
        .$eval('script[type="application/ld+json"]', (el) => el.textContent)
        .catch(() => null);

      if (jsonLd) {
        const parsed = JSON.parse(jsonLd);
        const data = Array.isArray(parsed) ? parsed[0] : parsed;

        title = data.name || '';
        image = Array.isArray(data.image) ? data.image[0] : data.image || '';
        description = data.description || '';

        // Price Extraction
        if (data.offers) {
          const offers = Array.isArray(data.offers)
            ? data.offers[0]
            : data.offers;
          // 지원하는 통화(KRW)인지 확인하거나 그냥 숫자만 추출
          price = parseInt(offers.price, 10) || 0;
        }

        if (title && price > 0) {
          return {
            title: title.trim(),
            price,
            image,
            desc: description.trim(),
          };
        }
      }
    } catch (e) {
      console.log('AliExpress JSON parse error', e);
    }

    // 2. Global Variable Extraction (Fallback)
    try {
      const runParams = await page.evaluate(() => {
        // @ts-ignore
        const params = window.runParams;
        if (!params) return null;

        // 데이터 구조가 변할 수 있으므로 여러 경로 탐색
        const data = params.data;
        if (!data) return null;

        return {
          title:
            data.productInfoComponent?.subject || data.titleModule?.subject,
          image:
            data.imageModule?.imagePathList?.[0] ||
            data.productInfoComponent?.imagePathList?.[0],
          price:
            data.priceComponent?.discountPrice?.minActivityAmount?.value ||
            data.priceComponent?.origPrice?.minAmount?.value,
          description: data.productDescComponent?.descriptionUrl,
        };
      });

      if (runParams && runParams.title) {
        return {
          title: runParams.title,
          price: this.parsePrice(String(runParams.price || 0)),
          image: runParams.image,
          desc: '',
        };
      }
    } catch (e) {
      console.log('RunParams extraction failed', e);
    }

    // 3. OpenGraph Meta Tags (Standard Fallback)
    if (!title) {
      title = await page
        .$eval('meta[property="og:title"]', (el) => el.content)
        .catch(() => '');
    }
    if (!image) {
      image = await page
        .$eval('meta[property="og:image"]', (el) => el.content)
        .catch(() => '');
    }
    if (!description) {
      description = await page
        .$eval('meta[property="og:description"]', (el) => el.content)
        .catch(() => '');
    }

    // 4. CSS Selectors (Last Resort - Updated Selectors)
    if (!title) {
      title = await page
        .$eval(
          'h1[class*="title"], .product-title-text',
          (el) => el.textContent,
        )
        .catch(() => '');
    }
    if (!price) {
      // 다양한 가격 선택자 시도
      const priceSelectors = [
        '.product-price-current',
        '.product-price-value',
        '[class*="price"]',
        '[class*="Price"]',
      ];

      for (const selector of priceSelectors) {
        const priceText = await page
          .$eval(selector, (el) => el.textContent)
          .catch(() => '');
        const extractedPrice = this.parsePrice(priceText);
        if (extractedPrice > 0) {
          price = extractedPrice;
          break;
        }
      }
    }

    // Fallback: title if nothing else works (document title)
    if (!title) {
      title = await page.title();
    }

    // 5. Regex Search (Last Resort for Price)
    if (!price) {
      try {
        const bodyText = await page.$eval('body', (el) => el.textContent);
        // "100,000원", "₩100,000", "KRW 100,000" 패턴 검색
        const pricePatterns = [
          /₩\s*([\d,]+)/,
          /KRW\s*([\d,]+)/,
          /([\d,]+)\s*원/,
        ];

        for (const pattern of pricePatterns) {
          const match = bodyText.match(pattern);
          if (match) {
            const extracted = this.parsePrice(match[1]);
            if (extracted > 0) {
              price = extracted;
              console.log(`[Price Fallback] Found price via regex: ${price}`);
              break;
            }
          }
        }
      } catch (e) {
        console.log('Regex price search failed', e);
      }
    }

    console.log(
      `[Extracted Data] Title: ${title?.substring(0, 30)}..., Price: ${price}, Image Found: ${!!image}`,
    );

    return { title: title?.trim(), price, image, desc: description?.trim() };
  }

  private async extractGeneralData(page: any) {
    let title = '';
    let price = 0;
    let image = '';
    let description = '';

    // 1. Meta Tags (OG)
    title = await page
      .$eval('meta[property="og:title"]', (el) => el.content)
      .catch(() => '');
    image = await page
      .$eval('meta[property="og:image"]', (el) => el.content)
      .catch(() => '');
    description = await page
      .$eval('meta[property="og:description"]', (el) => el.content)
      .catch(() => '');

    if (!title) title = await page.title();

    // 2. Amazon Specifics
    if (page.url().includes('amazon')) {
      const amzTitle = await page
        .$eval('#productTitle', (el) => el.textContent)
        .catch(() => '');
      if (amzTitle) title = amzTitle;

      const amzPriceText = await page.evaluate(() => {
        return (
          (document.querySelector('.a-price .a-offscreen') as HTMLElement)
            ?.innerText ||
          (document.querySelector('#priceblock_ourprice') as HTMLElement)
            ?.innerText ||
          (document.querySelector('#priceblock_dealprice') as HTMLElement)
            ?.innerText ||
          ''
        );
      });
      const amzPrice = this.parsePrice(amzPriceText);
      if (amzPrice > 0) price = amzPrice;

      if (!image) {
        image = await page.evaluate(() => {
          return (
            document.querySelector('#landingImage')?.getAttribute('src') ||
            document.querySelector('#imgBlkFront')?.getAttribute('src') ||
            document.querySelector('.a-dynamic-image')?.getAttribute('src') ||
            ''
          );
        });
      }
    }

    // 3. General Price Fallback (if not found specifically)
    if (price === 0) {
      const bodyText = await page.$eval('body', (el) => el.textContent);
      // Simple regex for likely price patterns
      const pricePatterns = [/₩\s*([\d,]+)/, /KRW\s*([\d,]+)/, /([\d,]+)\s*원/];
      for (const pattern of pricePatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          const p = this.parsePrice(match[1]);
          if (p > 0) {
            price = p;
            break;
          }
        }
      }
    }

    return { title: title?.trim(), price, image, desc: description?.trim() };
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
