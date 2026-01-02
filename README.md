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

## 7. API 엔드포인트 주요 로직 (API Logic & Examples)

이 프로젝트에서 구현된 주요 API와 핵심 로직입니다.

### 🔐 Auth (인증)

- **POST `/auth/signup`**
  - 회원가입 시 `bcrypt`를 사용하여 비밀번호를 암호화 저장합니다.
- **GET `/users/check-email`**
  - 이메일 중복 여부를 확인합니다.
  - **Logic**: DB에서 이메일 조회를 수행하고, 결과가 없으면 `available: true`를 반환합니다.

### 📦 Products (상품)

- **GET `/products/all`**
  - 전체 상품의 핵심 정보만 경량화하여 조회합니다.
  - **Logic**: DB의 컬럼(`priceUsd`, `nameKo`)을 프론트엔드 요구사항에 맞춰 `price`, `ko_name`으로 매핑하여 반환합니다.
- **GET `/products/:id`**
  - 상품 상세 정보를 조회합니다.
  - **Logic**: `productId`로 조회하며, 없는 상품일 경우 `NotFoundException`을 발생시킵니다. 상세 정보 역시 `ko_name` 등으로 필드 매핑이 적용됩니다.
- **POST `/products/analyze`**
  - 외부 쇼핑몰(AliExpress 등) URL을 입력받아 크롤링하고 DB에 저장합니다.
  - **Logic**: `Puppeteer`와 `Cheerio`를 활용하여 메타 태그 및 JSON-LD 데이터를 분석합니다.

### 🧾 Orders (주문)

- **POST `/orders`**
  - 주문을 생성합니다. 트랜잭션(`QueryRunner`)을 사용하여 `Order`, `OrderItems`, `ShippingInfo`가 모두 성공적으로 저장될 때만 커밋됩니다.
- **GET `/orders/my`**
  - **내 주문 내역 조회**
  - **Logic**: URL 파라미터로 유저 ID를 받지 않고, **JWT 토큰**(`req.user.userId`)을 통해 현재 로그인한 사용자의 주문만 안전하게 조회합니다.
- **DELETE `/orders/:id`**
  - 주문을 취소(삭제)합니다.
  - **Logic**: `Cascade` 옵션이 설정되어 있어, 주문 삭제 시 연관된 `OrderItems`와 `ShippingInfo`도 함께 삭제됩니다.
- **PATCH `/orders/:id/status`**
  - 주문 상태를 변경합니다.
  - **Logic**: `PENDING`, `SHIPPING`, `DELIVERED` 세 가지 상태로만 변경 가능하도록 Enum 유효성 검사가 적용되어 있습니다.

### 🛒 Carts (장바구니)

- **POST `/carts/items`**
  - 상품을 장바구니에 담습니다. 이미 존재하는 상품이면 수량만 업데이트합니다.
- **GET `/carts`**
  - 로그인한 유저의 장바구니 목록을 조회합니다. `Cart`와 `CartItems`를 조인하여 상품 정보와 함께 반환합니다.

---

## 8. 테스트 (Tests)

Jest를 사용한 유닛 테스트 및 E2E 테스트를 지원합니다.

```bash
# 유닛 테스트 실행
npm run test

# 테스트 커버리지 확인
npm run test:cov
```
