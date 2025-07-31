package handlers

import (
	"context"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/livekit/protocol/livekit"
	lksdk "github.com/livekit/server-sdk-go/v2"
)

// Ingress 목록 조회 응답
type ListIngressResponse struct {
	Ingresses []IngressInfo `json:"ingresses"`
	Total     int           `json:"total"`
}

type IngressInfo struct {
	IngressId           string `json:"ingressId"`
	Name                string `json:"name"`
	RoomName            string `json:"roomName"`
	ParticipantIdentity string `json:"participantIdentity"`
	ParticipantName     string `json:"participantName"`
	URL                 string `json:"url"`
	StreamKey           string `json:"streamKey"`
	Status              string `json:"status"`
	CreatedAt           string `json:"createdAt"`
}

// ListIngress 핸들러 - 모든 Ingress 조회
func (h *IngressHandler) ListIngress(c echo.Context) error {
	ingressClient := lksdk.NewIngressClient(h.hostURL, h.apiKey, h.apiSecret)

	// 모든 Ingress 조회
	ingresses, err := ingressClient.ListIngress(context.Background(), &livekit.ListIngressRequest{})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to list ingress")
	}

	// 응답 데이터 변환
	var ingressList []IngressInfo
	for _, ingress := range ingresses.Items {
		ingressInfo := IngressInfo{
			IngressId:           ingress.IngressId,
			Name:                ingress.Name,
			RoomName:            ingress.RoomName,
			ParticipantIdentity: ingress.ParticipantIdentity,
			ParticipantName:     ingress.ParticipantName,
			URL:                 ingress.Url,
			StreamKey:           ingress.StreamKey,
			Status:              ingress.State.String(),
			CreatedAt:           "",
		}
		ingressList = append(ingressList, ingressInfo)
	}

	response := ListIngressResponse{
		Ingresses: ingressList,
		Total:     len(ingressList),
	}

	return c.JSON(http.StatusOK, response)
}

// GetIngress 핸들러 - 특정 Ingress 조회 (ListIngress에서 ID로 필터링)
func (h *IngressHandler) GetIngress(c echo.Context) error {
	ingressId := c.Param("ingressId")
	if ingressId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Ingress ID is required")
	}

	ingressClient := lksdk.NewIngressClient(h.hostURL, h.apiKey, h.apiSecret)

	// 모든 Ingress 조회 후 ID로 필터링
	ingresses, err := ingressClient.ListIngress(context.Background(), &livekit.ListIngressRequest{})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to list ingress")
	}

	// 특정 ID의 Ingress 찾기
	for _, ingress := range ingresses.Items {
		if ingress.IngressId == ingressId {
			// 응답 데이터 변환
			ingressInfo := IngressInfo{
				IngressId:           ingress.IngressId,
				Name:                ingress.Name,
				RoomName:            ingress.RoomName,
				ParticipantIdentity: ingress.ParticipantIdentity,
				ParticipantName:     ingress.ParticipantName,
				URL:                 ingress.Url,
				StreamKey:           ingress.StreamKey,
				Status:              ingress.State.String(),
				CreatedAt:           "",
			}
			return c.JSON(http.StatusOK, ingressInfo)
		}
	}

	return echo.NewHTTPError(http.StatusNotFound, "Ingress not found")
}

// DeleteIngress 핸들러 - Ingress 삭제
func (h *IngressHandler) DeleteIngress(c echo.Context) error {
	ingressId := c.Param("ingressId")
	if ingressId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Ingress ID is required")
	}

	ingressClient := lksdk.NewIngressClient(h.hostURL, h.apiKey, h.apiSecret)

	// Ingress 삭제
	_, err := ingressClient.DeleteIngress(context.Background(), &livekit.DeleteIngressRequest{
		IngressId: ingressId,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to delete ingress")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":   "Ingress deleted successfully",
		"ingressId": ingressId,
	})
}
