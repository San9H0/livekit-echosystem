package main

import (
	"fmt"
	"log"
	"os"

	"backend/handlers"
	"backend/routes"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	fmt.Println("backend start")
	// Echo 인스턴스 생성
	e := echo.New()

	// 미들웨어 설정
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.DELETE, echo.OPTIONS},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
	}))

	// 환경 변수 가져오기
	hostURL := os.Getenv("LIVEKIT_WS_URL")
	apiKey := os.Getenv("LIVEKIT_API_KEY")
	apiSecret := os.Getenv("LIVEKIT_API_SECRET")

	fmt.Println("hostURL", hostURL)
	fmt.Println("apiKey", apiKey)
	fmt.Println("apiSecret", apiSecret)

	// 환경 변수 검증
	if hostURL == "" || apiKey == "" || apiSecret == "" {
		log.Fatal("LiveKit environment variables not configured")
	}

	// 핸들러 생성
	ingressHandler := handlers.NewIngressHandler(hostURL, apiKey, apiSecret)
	tokenHandler := handlers.NewTokenHandler(apiKey, apiSecret)
	streamHandler := handlers.NewStreamHandler(hostURL, apiKey, apiSecret)

	// 라우트 설정
	routes.SetupRoutes(e, ingressHandler, tokenHandler, streamHandler)

	// 서버 시작
	log.Println("Server starting on :8080")
	e.Logger.Fatal(e.Start(":8080"))
}
