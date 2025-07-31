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
