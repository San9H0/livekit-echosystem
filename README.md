# LiveKit Echosystem

## Submodule

```bash
# 서브모듈 포함하여 클론
git clone --recursive <repository-url>

# 또는 이미 클론된 경우
git submodule init
git submodule update
```

## Environment Variables Setup

Create a `.env` file in the project root directory with the following content:

```bash
# LiveKit API Configuration
LIVEKIT_API_KEY=APISSfcCBvtoqGE          # API key provided by LiveKit server
LIVEKIT_API_SECRET=sJEpsUb5ETzRcvihadjeSUJMb9fN6j9b4fumAktL6fKB  # API secret provided by LiveKit server

# Backend Configuration
BACKEND_PORT=8080                         # Port number for backend server

# Redis Configuration
REDIS_PORT=6379                           # Port number for Redis server

# LiveKit Keys (API_KEY:API_SECRET format)
LIVEKIT_KEYS=APISSfcCBvtoqGE: sJEpsUb5ETzRcvihadjeSUJMb9fN6j9b4fumAktL6fKB  # API_KEY:API_SECRET format
```





docker pull jrottenberg/ffmpeg:6.1.2-ubuntu2404