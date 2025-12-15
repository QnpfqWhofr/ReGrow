# 새로 추가된 기능

## 1. 제품 리뷰 시스템

### 백엔드
- **Review 모델** (`server/src/models/Review.ts`)
  - 제품별 리뷰 저장
  - 평점 (1-5점)
  - 리뷰 내용
  - 작성자 정보
  - 한 사용자당 제품 하나에 하나의 리뷰만 작성 가능

- **Review API** (`server/src/routes/reviews.ts`)
  - `GET /api/reviews/product/:productId` - 제품의 모든 리뷰 조회
  - `POST /api/reviews` - 리뷰 작성
  - `DELETE /api/reviews/:id` - 리뷰 삭제 (본인만)

### 프론트엔드
- **ReviewSection 컴포넌트** (`client/src/components/ReviewSection.tsx`)
  - 평균 평점 및 리뷰 개수 표시
  - 별점 시각화
  - 리뷰 작성 폼 (로그인 필요)
  - 리뷰 목록 표시
  - 본인 리뷰 삭제 기능

- **ListingDetail 페이지 업데이트**
  - 제품 상세 페이지 하단에 리뷰 섹션 추가
  - 비슷한 상품 위에 배치

### 기능 특징
- 로그인한 사용자만 리뷰 작성 가능
- 한 제품에 한 번만 리뷰 작성 가능
- 별점 1-5점 선택
- 최대 500자 리뷰 작성
- 본인 리뷰만 삭제 가능
- 실시간 평균 평점 계산

## 2. 채팅 사용자 목록

### 백엔드
- 기존 채팅 API 활용
- `GET /api/chat/rooms?productId=xxx` - 제품별 채팅방 목록 조회

### 프론트엔드
- **Chat 페이지 업데이트** (`client/src/pages/Chat.tsx`)
  - 왼쪽에 채팅 사용자 목록 표시 (판매자이고 여러 채팅이 있을 때만)
  - 사용자 프로필 이미지 및 이름 표시
  - 마지막 메시지 미리보기
  - 현재 활성화된 채팅방 하이라이트
  - 사용자 클릭 시 해당 채팅방으로 전환

### 기능 특징
- 판매자만 여러 구매자와의 채팅 목록 확인 가능
- 구매자는 판매자와의 1:1 채팅만 표시
- 채팅방 전환 시 자동으로 메시지 로드
- 반응형 레이아웃 (모바일에서는 목록 숨김)

## 사용 방법

### 리뷰 작성
1. 제품 상세 페이지로 이동
2. 하단의 "리뷰" 섹션으로 스크롤
3. "리뷰 작성" 버튼 클릭
4. 별점 선택 및 리뷰 내용 입력
5. "리뷰 등록" 버튼 클릭

### 채팅 사용자 목록 (판매자)
1. 자신이 등록한 제품의 채팅 페이지로 이동
2. 여러 구매자가 문의한 경우 왼쪽에 사용자 목록 표시
3. 사용자를 클릭하여 해당 채팅방으로 전환
4. 각 채팅방에서 독립적으로 대화 가능

## 데이터베이스 스키마

### Review Collection
```typescript
{
  product: ObjectId,      // 제품 ID
  author: ObjectId,       // 작성자 ID
  rating: Number,         // 평점 (1-5)
  comment: String,        // 리뷰 내용
  createdAt: Date,        // 작성 시간
  updatedAt: Date         // 수정 시간
}
```

## API 엔드포인트

### 리뷰 API
- `GET /api/reviews/product/:productId` - 제품 리뷰 목록
- `POST /api/reviews` - 리뷰 작성
  ```json
  {
    "productId": "string",
    "rating": 1-5,
    "comment": "string"
  }
  ```
- `DELETE /api/reviews/:id` - 리뷰 삭제

### 채팅 API (기존)
- `GET /api/chat/rooms?productId=xxx` - 채팅방 목록
- `POST /api/chat/open` - 채팅방 열기
- `GET /api/chat/room/:roomId` - 채팅방 조회
- `POST /api/chat/room/:roomId/messages` - 메시지 전송
