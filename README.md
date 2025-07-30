# LiveKit Project

LiveKit 서버와 백엔드 API를 포함한 실시간 통신 프로젝트입니다.

## 환경 설정

### 1. .env 파일 생성

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# LiveKit API Configuration
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here

# Backend Configuration
BACKEND_PORT=8080

# Redis Configuration
REDIS_PORT=6379
```

### 2. LiveKit API 키 설정

LiveKit 클라우드 대시보드에서 API 키와 시크릿을 가져와서 `.env` 파일에 설정하세요.

## 실행 방법

### Docker Compose로 실행

```bash
# 모든 서비스 시작
docker-compose up --build

# 백그라운드에서 실행
docker-compose up -d --build

# 서비스 중지
docker-compose down
```

### 개별 서비스 실행

```bash
# 백엔드만 실행
docker-compose up backend

# LiveKit 서버만 실행
docker-compose up livekit

# Redis만 실행
docker-compose up redis
```

## 서비스 포트

- **Backend API**: http://localhost:8080
- **LiveKit Server**: 
  - Main TCP: 7880
  - WebRTC TCP: 7881
  - UDP ports: 50000-50010
- **Redis**: 6379

## API 엔드포인트

### 토큰 생성
```
GET /getToken
```

LiveKit 방에 참여할 수 있는 JWT 토큰을 생성합니다.

## 개발 환경

- Go 1.24.5
- Docker & Docker Compose
- Redis 7-alpine
- LiveKit Server

## 문제 해결

### 환경 변수가 제대로 로드되지 않는 경우

1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 이름이 정확한지 확인
3. Docker Compose를 다시 시작

### 포트 충돌이 발생하는 경우

`docker-compose.yml`에서 포트 매핑을 수정하거나, 사용 중인 포트를 해제하세요. "# livekit-echosystem" 
