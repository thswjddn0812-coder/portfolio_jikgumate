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

      // 1. URL 정제 (불필요한 트래킹 파라미터 제거)
      const cleanUrl = url.split('?')[0];

      await page.setViewport({ width: 1920, height: 1080 });

      // 2. 헤더 추가 (Referer 및 Accept-Language)
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        Referer: 'https://www.google.com/',
      });
      await page.setUserAgent(this.USER_AGENT);

      // 3. 쿠키 설정 (한국/원화) - 더욱 강력하게 설정
      // aep_usuc_f: region=KR, site=kor, c_tp=KRW
      // intl_locale: ko_KR
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
        {
          name: 'intl_locale',
          value: 'ko_KR',
          domain: '.aliexpress.com',
        },
      );

      // 4. 리소스 차단 (속도 최적화)
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // 5. 메인 페이지 먼저 방문 (봇 탐지 우회 시도)
      // 메인 페이지는 빠르게 로드만 하고 넘어감
      try {
        await page.goto('https://ko.aliexpress.com/', {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
      } catch (e) {
        // 메인 페이지 로드 실패해도 상품 페이지 시도
        console.log('Main page load skipped or failed', e.message);
      }

      // 짧은 랜덤 대기
      await new Promise((r) => setTimeout(r, Math.random() * 1000 + 500));

      // 6. 상품 페이지 이동
      // 6. 상품 페이지 이동
      // networkidle2는 타임아웃 발생 가능성이 높으므로 domcontentloaded로 변경
      const response = await page.goto(cleanUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // 주요 컨텐츠 로딩 대기
      try {
        await page
          .waitForSelector('script[type="application/ld+json"]', {
            timeout: 5000,
          })
          .catch(() => {});
        await page.waitForSelector('body', { timeout: 5000 }).catch(() => {});
      } catch (e) {}

      // 404 및 차단 확인
      const status = response?.status();
      const pageTitle = await page.title();

      console.log(
        `[Crawling Debug] Status: ${status}, Title: "${pageTitle}", URL: ${cleanUrl}`,
      );

      if (
        status === 404 ||
        pageTitle.includes('404') ||
        pageTitle.includes('Page Not Found')
      ) {
        // 디버깅을 위해 에러 메시지에 타이틀 포함
        throw new Error(`AliExpress returned 404. Page Title: ${pageTitle}`);
      }

      // 봇 탐지 우회를 위한 약간의 랜덤 대기
      await new Promise((r) => setTimeout(r, Math.random() * 2000 + 1000));

      const data = await this.extractAliExpressData(page);

      return { ...data, url: cleanUrl };
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
          .$eval(selector, (el) => el.innerText)
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

    return { title: title?.trim(), price, image, desc: description?.trim() };
  }

  private async crawlWithAxios(url: string) {
    try {
      const { data } = await axios.get(decodeURIComponent(url), {
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          Referer: 'https://www.google.com/',
          // 아마존 등에서 한국/원화 설정을 강제하기 위한 쿠키
          Cookie: 'i18n-prefs=KRW; lc-main=ko_KR; sp-cdn="L5Z9:KR";',
        },
      });

      const $ = cheerio.load(data);

      const title =
        $('meta[property="og:title"]').attr('content') || $('title').text();
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
        priceText =
          $('input[name="priceValue"]').val() ||
          $('#priceblock_ourprice').text() ||
          $('#priceblock_dealprice').text() ||
          $('.a-price .a-offscreen').first().text() ||
          priceText;
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
      return {
        error: '정보를 가져오는데 실패했습니다.',
        detail: error.message,
      };
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
