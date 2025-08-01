# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Docker Environment
```bash
# Start all services (recommended for development)
docker-compose up

# Start specific services
docker-compose up backend livekit redis

# Stop all services
docker-compose down
```

### Go Backend (backend/)
```bash
# Run backend locally
cd backend && go run main.go

# Run tests
cd backend && go test ./tests/

# Build backend
cd backend && go build -o backend main.go
```

### React Web Client (web/)
```bash
# Development server
cd web && npm run dev

# Build for production
cd web && npm run build

# Lint code
cd web && npm run lint
```

### Next.js Livestream App (livestream-example/)
```bash
# Development server
cd livestream-example && npm run dev

# Build for production
cd livestream-example && npm run build

# Lint code
cd livestream-example && npm run lint
```

### Go Publisher (publisher/)
```bash
# Run publisher (publishes test media to LiveKit room)
cd publisher && go run main.go
```

## Architecture Overview

This is a **distributed real-time streaming platform** built around **LiveKit** as the core media infrastructure. The system uses a microservices architecture with the following components:

### Core Services
- **LiveKit Server** (`/livekit/` submodule): Core media infrastructure handling WebRTC, room management, and ingress
- **Go Backend API** (`/backend/`): Token generation and ingress management API built with Echo v4
- **Redis** (Docker service): Distributed state management for LiveKit server

### Applications  
- **Next.js Livestream App** (`/livestream-example/` submodule): Full-featured streaming platform with OBS integration, viewer participation, and chat
- **React Web Client** (`/web/`): Minimal LiveKit testing interface built with React 19 + Vite
- **Go Publisher** (`/publisher/`): Programmatic media publishing tool for testing

### Key Integration Patterns

#### Authentication Flow
1. Backend generates JWT tokens using LiveKit API credentials
2. Tokens include room permissions (publish, subscribe, data) and participant identity
3. Frontend applications use tokens to connect to LiveKit server
4. Role-based permissions control creator/viewer/participant access

#### Media Ingress Support
- **RTMP ingress** for OBS Studio integration via `/api/create_ingress`
- **WHIP ingress** for browser-based publishing
- **Transcoding options** with quality presets
- **Participant mapping** from ingress streams to room participants

## Environment Setup

Create `.env` file with:
```bash
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
BACKEND_PORT=8080
REDIS_PORT=6379
LIVEKIT_KEYS=api_key:api_secret_format
```

## Submodules Management

```bash
# Clone with submodules
git clone --recursive <repository-url>

# Initialize existing clone
git submodule init && git submodule update
```

## Backend API Endpoints

- `GET /getToken` - Generate LiveKit JWT tokens with room permissions
- `POST /api/create_ingress` - Create RTMP/WHIP ingress endpoints for OBS integration
- `GET /api/ingress` - List all active ingress endpoints
- `DELETE /api/ingress/:id` - Delete specific ingress endpoint

## Development Notes

### Technology Stack
- **Backend**: Go 1.24.5, Echo v4, LiveKit Server SDK Go v2
- **Frontend**: Next.js 14, React 18/19, TypeScript, Tailwind CSS
- **Media**: LiveKit Server, WebRTC, FFmpeg 6.1.2
- **Infrastructure**: Docker Compose, Redis 7

### Port Configuration
- Backend API: 8080
- LiveKit Server: 7880 (main), 7881 (WebRTC TCP), 50000-50010 (UDP range)
- Redis: 6379

### LiveKit Server Configuration
Server configuration is defined in `livekit.config.docker.yaml` with room management, participant handling, and ingress support configured for the Docker environment.

### Testing Infrastructure
- HTTP files in `/tests/` for REST Client extension API testing
- Go integration tests in `backend/tests/` for LiveKit API validation
- Publisher tool provides programmatic media testing with IVF video and OGG audio files