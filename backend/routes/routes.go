package routes

import (
	"backend/handlers"

	"github.com/labstack/echo/v4"
)

// SetupRoutes 라우터 설정
func SetupRoutes(e *echo.Echo, ingressHandler *handlers.IngressHandler, tokenHandler *handlers.TokenHandler, streamHandler *handlers.StreamHandler) {
	// API 그룹
	api := e.Group("/api")

	// Ingress 관련 라우트
	api.POST("/create_ingress", ingressHandler.CreateIngress)
	api.GET("/ingress", ingressHandler.ListIngress)                 // 모든 Ingress 조회
	api.GET("/ingress/:ingressId", ingressHandler.GetIngress)       // 특정 Ingress 조회
	api.DELETE("/ingress/:ingressId", ingressHandler.DeleteIngress) // Ingress 삭제

	// 토큰 관련 라우트
	e.GET("/getToken", tokenHandler.GetToken)

	// 스트림 관련 라우트
	api.POST("/create_stream", streamHandler.CreateStream)     // 스트림 생성
	api.POST("/join_stream", streamHandler.JoinStream)         // 스트림 참여
	api.GET("/streams", streamHandler.ListStreams)             // 모든 스트림 조회
	api.GET("/streams/:roomName", streamHandler.GetStream)     // 특정 스트림 조회
	api.DELETE("/streams/:roomName", streamHandler.DeleteStream) // 스트림 삭제
}
