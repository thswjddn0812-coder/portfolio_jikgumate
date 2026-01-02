# JikguMate Backend (직구메이트)

**JikguMate** for Global Direct Purchase Platform.
이 프로젝트는 해외 직구 상품을 크롤링하고, 장바구니 및 주문을 관리할 수 있는 이커머스 백엔드 서버입니다.

## 1. 프로젝트 소개

**JikguMate**는 사용자가 복잡한 해외 직구 과정을 간편하게 경험할 수 있도록 돕는 플랫폼입니다.
백엔드 서버는 상품 정보 수집(크롤링), 사용자 인증, 장바구니, 주문 처리 등 핵심 비즈니스 로직을 담당합니다.

### 주요 목표

- **확장성**: NestJS의 모듈 패턴을 활용하여 기능 확장 용이
- **안정성**: TypeORM을 통한 데이터 무결성 보장 및 트랜잭션 처리
- **편의성**: Swagger API 문서를 통한 프론트엔드 협업 효율화

---

## 2. 주요 기능 (Key Features)

### 🔐 인증 (Authentication)

- **회원가입/로그인**: 이메일 기반 인증
- **JWT 인증**: Access Token & Refresh Token 기반의 보안 인증 시스템
- **Guard**: 인증된 사용자만 접근 가능한 보호된 라우트 (`AuthGuard`)

### 📦 상품 (Products)

- **크롤링 (Crawling)**: AliExpress, Amazon 등 해외 쇼핑몰 URL을 입력받아 상품 정보(가격, 이미지, 이름) 자동 분석 및 저장 (`Puppeteer`, `Cheerio`)
- **상품 목록**: 전체 상품 조회 및 상세 조회

### 🛒 장바구니 (Carts)

- **담기/수정/삭제**: 상품을 장바구니에 추가하고 수량 변경 가능
- **실시간 연동**: 유저별 장바구니 데이터 영구 저장 (DB)

### 🧾 주문 (Orders)

- **주문 생성**: 장바구니 상품 또는 단일 상품 주문
- **주문 내역**: 내 주문 내역 조회 (`/orders/my`)
- **주문 관리**: 주문 상태 변경 (`PENDING` -> `SHIPPING` -> `DELIVERED`), 주문 취소

---

## 3. 기술 스택 (Tech Stack)

| 구분          | 기술                                                                                                     | 설명                                          |
| ------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Framework** | ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)             | 모듈식 아키텍처를 제공하는 Node.js 프레임워크 |
| **Language**  | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) | 정적 타입을 지원하는 JavaScript 상위 집합     |
| **Database**  | ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)                | 관계형 데이터베이스 관리 시스템               |
| **ORM**       | ![TypeORM](https://img.shields.io/badge/TypeORM-FE0704?style=flat&logo=typeorm&logoColor=white)          | TypeScript용 ORM 판                           |
| **Docs**      | ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat&logo=swagger&logoColor=black)          | API 문서 자동화 도구                          |
| **Crawling**  | Puppeteer, Cheerio                                                                                       | 웹 스크래핑 및 크롤링 라이브러리              |

---

## 4. 빠른 시작 (Quick Start)

### 4-1. 의존성 설치

```bash
npm install
```

### 4-2. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수를 설정하세요.

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=jikgumate

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Optional (Crawling)
PUPPETEER_EXECUTABLE_PATH= # Chrome 경로 (필요 시)
```

### 4-3. 개발 서버 실행

```bash
# 개발 모드 실행 (Watch 모드)
npm run start:dev
```

### 4-4. 브라우저에서 확인 (Swagger)

서버가 정상적으로 실행되었다면, 아래 주소에서 API 문서를 확인할 수 있습니다.

- **API Docs**: [http://localhost:3000/api](http://localhost:3000/api)

---

## 5. 폴더 구조 (Folder Structure)

```
src/
├── app.module.ts          # 메인 앱 모듈 (모듈 통합)
├── main.ts                # 앱 진입점 (Swagger, Pipe 설정)
├── auth/                  # 인증 모듈 (Login, Signup)
├── users/                 # 사용자 모듈 (User CRUD)
├── products/              # 상품 모듈 (Crawling, Product CRUD)
├── orders/                # 주문 모듈 (Order, Transaction)
├── carts/                 # 장바구니 모듈
├── common/                # 공통 가드, 데코레이터, 유틸
└── configs/               # 설정 파일 (CORS 등)
```

---

## 6. 아키텍처 개요 (Architecture)

본 프로젝트는 **NestJS**의 표준 Layered Architecture를 따릅니다.

1.  **Controller**: 클라이언트의 요청(Request)을 받아 유효성 검사를 수행하고, 적절한 Service로 전달합니다. (`@Controller`, DTO)
2.  **Service**: 비즈니스 로직을 수행합니다. 데이터 가공, 트랜잭션 처리 등을 담당합니다. (`@Injectable`)
3.  **Repository**: 데이터베이스와의 직접적인 통신을 담당합니다. (TypeORM Repository Pattern)
4.  **Database**: 영속적인 데이터를 저장합니다. (MySQL)

---

## 7. API 엔드포인트 예제

### ✅ 회원가입

- **POST** `/auth/signup`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123!",
    "name": "홍길동"
  }
  ```

### ✅ 상품 목록 조회 (간략 정보)

- **GET** `/products/all`
- **Response**:
  ```json
  [
    {
      "productId": 1,
      "imageUrl": "https://...",
      "price": 25000,
      "ko_name": "무선 이어폰"
    }
  ]
  ```

### ✅ 내 주문 내역 조회

- **GET** `/orders/my`
- **Headers**: `Authorization: Bearer <Access Token>`
- **Response**:
  ```json
  [
    {
      "orderId": 10,
      "status": "PENDING",
      "totalAmount": "50000.00",
      "orderItems": [...]
    }
  ]
  ```

---

## 8. 테스트 (Tests)

Jest를 사용한 유닛 테스트 및 E2E 테스트를 지원합니다.

```bash
# 유닛 테스트 실행
npm run test

# 테스트 커버리지 확인
npm run test:cov
```
