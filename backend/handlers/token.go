package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/livekit/protocol/auth"
)

// TokenHandler 구조체
type TokenHandler struct {
	apiKey    string
	apiSecret string
}

// NewTokenHandler 생성자
func NewTokenHandler(apiKey, apiSecret string) *TokenHandler {
	return &TokenHandler{
		apiKey:    apiKey,
		apiSecret: apiSecret,
	}
}

// GetToken 핸들러
func (h *TokenHandler) GetToken(c echo.Context) error {
	room := c.QueryParam("room")
	identity := c.QueryParam("identity")

	if room == "" {
		room = "my-room"
	}
	if identity == "" {
		identity = "identity"
	}

	token := h.createJoinToken(room, identity)
	return c.String(http.StatusOK, token)
}

// createJoinToken 헬퍼 함수
func (h *TokenHandler) createJoinToken(room, identity string) string {
	at := auth.NewAccessToken(h.apiKey, h.apiSecret)
	grant := &auth.VideoGrant{
		RoomJoin: true,
		Room:     room,
	}
	at.AddGrant(grant).
		SetIdentity(identity).
		SetValidFor(time.Hour)

	token, _ := at.ToJWT()
	return token
}
