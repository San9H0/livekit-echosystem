package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/livekit/protocol/auth"
	"github.com/livekit/protocol/livekit"
	lksdk "github.com/livekit/server-sdk-go/v2"
)

// LiveKit Ingress API 요청/응답 구조체
type CreateIngressRequest struct {
	RoomName    string                 `json:"room_name"`
	IngressType string                 `json:"ingress_type"`
	Metadata    map[string]interface{} `json:"metadata"`
}

type CreateIngressResponse struct {
	Ingress struct {
		URL       string `json:"url"`
		StreamKey string `json:"streamKey"`
		RoomName  string `json:"roomName"`
	} `json:"ingress"`
	AuthToken         string `json:"auth_token"`
	ConnectionDetails struct {
		WSURL string `json:"ws_url"`
		Token string `json:"token"`
	} `json:"connection_details"`
}

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

// IngressHandler 구조체
type IngressHandler struct {
	hostURL   string
	apiKey    string
	apiSecret string
}

// NewIngressHandler 생성자
func NewIngressHandler(hostURL, apiKey, apiSecret string) *IngressHandler {
	return &IngressHandler{
		hostURL:   hostURL,
		apiKey:    apiKey,
		apiSecret: apiSecret,
	}
}

// CreateIngress 핸들러
func (h *IngressHandler) CreateIngress(c echo.Context) error {
	fmt.Println("CreateIngress")
	var req CreateIngressRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	// 1. LiveKit Room Service 클라이언트 생성
	roomClient := lksdk.NewRoomServiceClient(h.hostURL, h.apiKey, h.apiSecret)
	// 3. Ingress 생성
	ingressClient := lksdk.NewIngressClient(h.hostURL, h.apiKey, h.apiSecret)

	// 2. 방 생성
	roomName := req.RoomName
	if roomName == "" {
		roomName = fmt.Sprintf("room-%d", time.Now().Unix())
	}

	metadata, _ := json.Marshal(req.Metadata)
	room, err := roomClient.CreateRoom(context.Background(), &livekit.CreateRoomRequest{
		Name:     roomName,
		Metadata: string(metadata),
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create room")
	}

	ingressOptions := &livekit.CreateIngressRequest{
		Name:                roomName,
		RoomName:            roomName,
		ParticipantName:     req.Metadata["creator_identity"].(string) + " (via OBS)",
		ParticipantIdentity: req.Metadata["creator_identity"].(string) + " (via OBS)",
	}

	fmt.Println("[TEST DEBUG] room: ", room)

	if req.IngressType == "whip" {
		ingressOptions.BypassTranscoding = true
	} else {
		// RTMP 기본 설정
		ingressOptions.Video = &livekit.IngressVideoOptions{
			Source: livekit.TrackSource_CAMERA,
			// Preset: livekit.IngressVideoEncodingPreset_H264_1080P_30FPS_3_LAYERS,
		}
		ingressOptions.Audio = &livekit.IngressAudioOptions{
			Source: livekit.TrackSource_MICROPHONE,
			// Preset: livekit.IngressAudioEncodingPreset_OPUS_STEREO_96KBPS,
		}
	}

	ingress, err := ingressClient.CreateIngress(context.Background(), ingressOptions)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create ingress")
	}

	fmt.Println("[TEST DEBUG] ingress: ", ingress)

	// 4. 시청자용 토큰 생성
	viewerToken := auth.NewAccessToken(h.apiKey, h.apiSecret)
	viewerToken.SetVideoGrant(&auth.VideoGrant{
		Room:           roomName,
		RoomJoin:       true,
		CanPublish:     &[]bool{false}[0],
		CanSubscribe:   &[]bool{true}[0],
		CanPublishData: &[]bool{true}[0],
	})
	viewerToken.SetIdentity(req.Metadata["creator_identity"].(string))
	viewerToken.SetValidFor(time.Hour)

	// 5. 응답 생성
	response := CreateIngressResponse{}
	response.Ingress.URL = ingress.Url
	response.Ingress.StreamKey = ingress.StreamKey
	response.Ingress.RoomName = roomName
	response.AuthToken = h.createAuthToken(roomName, req.Metadata["creator_identity"].(string))
	response.ConnectionDetails.WSURL = "wss://localhost:7880"

	token, _ := viewerToken.ToJWT()
	response.ConnectionDetails.Token = token

	fmt.Printf("Created ingress for room: %s, URL: %s\n", roomName, ingress.Url)

	return c.JSON(http.StatusOK, response)
}

// createAuthToken 헬퍼 함수
func (h *IngressHandler) createAuthToken(room, identity string) string {
	at := auth.NewAccessToken(h.apiKey, h.apiSecret)
	grant := &auth.VideoGrant{
		RoomJoin: true,
		Room:     room,
	}
	at.SetVideoGrant(grant).
		SetIdentity(identity).
		SetValidFor(time.Hour)

	token, _ := at.ToJWT()
	return token
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
