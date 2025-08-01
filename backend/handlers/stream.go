package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"backend/utils"

	"github.com/labstack/echo/v4"
	"github.com/livekit/protocol/auth"
	"github.com/livekit/protocol/livekit"
	lksdk "github.com/livekit/server-sdk-go/v2"
)

// CreateStream 요청/응답 구조체
type CreateStreamRequest struct {
	Metadata map[string]interface{} `json:"metadata"`
	RoomName string                 `json:"room_name,omitempty"`
}

type CreateStreamResponse struct {
	AuthToken         string            `json:"auth_token"`
	ConnectionDetails ConnectionDetails `json:"connection_details"`
}

// JoinStream 요청/응답 구조체
type JoinStreamRequest struct {
	Identity string `json:"identity"`
	RoomName string `json:"room_name"`
}

type JoinStreamResponse struct {
	AuthToken         string            `json:"auth_token"`
	ConnectionDetails ConnectionDetails `json:"connection_details"`
}

type ConnectionDetails struct {
	WSURL string `json:"ws_url"`
	Token string `json:"token"`
}

// ListStreams 응답 구조체
type ListStreamsResponse struct {
	Rooms []RoomInfo `json:"rooms"`
	Total int        `json:"total"`
}

type RoomInfo struct {
	Name            string                 `json:"name"`
	Metadata        map[string]interface{} `json:"metadata"`
	NumParticipants uint32                 `json:"num_participants"`
	CreationTime    int64                  `json:"creation_time"`
	EmptyTimeout    uint32                 `json:"empty_timeout"`
	MaxParticipants uint32                 `json:"max_participants"`
}

// GetStream 응답 구조체
type GetStreamResponse struct {
	Room         RoomInfo          `json:"room"`
	Participants []ParticipantInfo `json:"participants"`
}

type ParticipantInfo struct {
	Identity    string `json:"identity"`
	Name        string `json:"name"`
	State       string `json:"state"`
	JoinedAt    int64  `json:"joined_at"`
	IsPublisher bool   `json:"is_publisher"`
}

// StreamHandler 구조체
type StreamHandler struct {
	hostURL   string
	apiKey    string
	apiSecret string
}

// NewStreamHandler 생성자
func NewStreamHandler(hostURL, apiKey, apiSecret string) *StreamHandler {
	return &StreamHandler{
		hostURL:   hostURL,
		apiKey:    apiKey,
		apiSecret: apiSecret,
	}
}

// generateRoomId 헬퍼 함수
func generateRoomId() string {
	return fmt.Sprintf("room-%d", time.Now().Unix())
}

// CreateStream 핸들러 - 스트림 생성 (호스트용)
func (h *StreamHandler) CreateStream(c echo.Context) error {
	var req CreateStreamRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	// metadata에서 creator_identity 확인
	creatorIdentity, ok := req.Metadata["creator_identity"].(string)
	if !ok || creatorIdentity == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "creator_identity is required in metadata")
	}

	// 룸 이름 생성 (없으면 자동 생성)
	roomName := req.RoomName
	if roomName == "" {
		roomName = generateRoomId()
	}

	// 호스트용 LiveKit 토큰 생성
	at := auth.NewAccessToken(h.apiKey, h.apiSecret)
	at.SetIdentity(creatorIdentity)
	at.SetVideoGrant(&auth.VideoGrant{
		Room:         roomName,
		RoomJoin:     true,
		CanPublish:   utils.GetBool(true), // 호스트는 발행 가능
		CanSubscribe: utils.GetBool(true), // 구독 가능
	})
	at.SetValidFor(time.Hour)

	// 룸 생성
	roomClient := lksdk.NewRoomServiceClient(h.hostURL, h.apiKey, h.apiSecret)
	metadataJSON, err := json.Marshal(req.Metadata)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to marshal metadata")
	}

	_, err = roomClient.CreateRoom(context.Background(), &livekit.CreateRoomRequest{
		Name:     roomName,
		Metadata: string(metadataJSON),
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create room")
	}

	// 응답 생성
	livekitToken, err := at.ToJWT()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to generate LiveKit token")
	}

	authToken := h.createAuthToken(roomName, creatorIdentity)

	response := CreateStreamResponse{
		AuthToken: authToken,
		ConnectionDetails: ConnectionDetails{
			WSURL: h.hostURL,
			Token: livekitToken,
		},
	}

	return c.JSON(http.StatusOK, response)
}

// JoinStream 핸들러 - 시청자가 스트림에 참여
func (h *StreamHandler) JoinStream(c echo.Context) error {
	var req JoinStreamRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if req.Identity == "" || req.RoomName == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Identity and room_name are required")
	}

	// RoomService 클라이언트 생성
	roomClient := lksdk.NewRoomServiceClient(h.hostURL, h.apiKey, h.apiSecret)

	// 동일한 identity를 가진 참가자가 이미 존재하는지 확인
	exists := false
	_, err := roomClient.GetParticipant(context.Background(), &livekit.RoomParticipantIdentity{
		Room:     req.RoomName,
		Identity: req.Identity,
	})
	if err == nil {
		exists = true
	}

	if exists {
		return echo.NewHTTPError(http.StatusConflict, "Participant already exists")
	}

	// 시청자용 LiveKit 토큰 생성
	at := auth.NewAccessToken(h.apiKey, h.apiSecret)
	at.SetIdentity(req.Identity)
	at.AddGrant(&auth.VideoGrant{
		Room:           req.RoomName,
		RoomJoin:       true,
		CanPublish:     &[]bool{false}[0], // 시청자는 발행 불가
		CanSubscribe:   &[]bool{true}[0],  // 구독 가능
		CanPublishData: &[]bool{true}[0],  // 채팅/반응 가능
	})
	at.SetValidFor(time.Hour)

	// 인증 토큰 생성 (API 호출용)
	authToken := h.createAuthToken(req.RoomName, req.Identity)

	// 응답 생성
	livekitToken, err := at.ToJWT()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to generate LiveKit token")
	}

	response := JoinStreamResponse{
		AuthToken: authToken,
		ConnectionDetails: ConnectionDetails{
			WSURL: h.hostURL,
			Token: livekitToken,
		},
	}

	return c.JSON(http.StatusOK, response)
}

// createAuthToken 헬퍼 함수 (API 호출용 토큰)
func (h *StreamHandler) createAuthToken(room, identity string) string {
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

// ListStreams 핸들러 - 모든 스트림(룸) 조회
func (h *StreamHandler) ListStreams(c echo.Context) error {
	roomClient := lksdk.NewRoomServiceClient(h.hostURL, h.apiKey, h.apiSecret)

	// 모든 룸 조회
	rooms, err := roomClient.ListRooms(context.Background(), &livekit.ListRoomsRequest{})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to list rooms")
	}

	// 응답 데이터 변환
	var roomList []RoomInfo
	for _, room := range rooms.Rooms {
		var metadata map[string]interface{}
		if room.Metadata != "" {
			json.Unmarshal([]byte(room.Metadata), &metadata)
		}

		roomInfo := RoomInfo{
			Name:            room.Name,
			Metadata:        metadata,
			NumParticipants: room.NumParticipants,
			CreationTime:    room.CreationTime,
			EmptyTimeout:    room.EmptyTimeout,
			MaxParticipants: room.MaxParticipants,
		}
		roomList = append(roomList, roomInfo)
	}

	response := ListStreamsResponse{
		Rooms: roomList,
		Total: len(roomList),
	}

	return c.JSON(http.StatusOK, response)
}

// GetStream 핸들러 - 특정 스트림(룸) 조회
func (h *StreamHandler) GetStream(c echo.Context) error {
	roomName := c.Param("roomName")
	if roomName == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Room name is required")
	}

	roomClient := lksdk.NewRoomServiceClient(h.hostURL, h.apiKey, h.apiSecret)

	// 룸 정보 조회
	rooms, err := roomClient.ListRooms(context.Background(), &livekit.ListRoomsRequest{
		Names: []string{roomName},
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get room")
	}

	if len(rooms.Rooms) == 0 {
		return echo.NewHTTPError(http.StatusNotFound, "Room not found")
	}

	room := rooms.Rooms[0]
	var metadata map[string]interface{}
	if room.Metadata != "" {
		json.Unmarshal([]byte(room.Metadata), &metadata)
	}

	roomInfo := RoomInfo{
		Name:            room.Name,
		Metadata:        metadata,
		NumParticipants: room.NumParticipants,
		CreationTime:    room.CreationTime,
		EmptyTimeout:    room.EmptyTimeout,
		MaxParticipants: room.MaxParticipants,
	}

	// 참가자 정보 조회
	participants, err := roomClient.ListParticipants(context.Background(), &livekit.ListParticipantsRequest{
		Room: roomName,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get participants")
	}

	var participantList []ParticipantInfo
	for _, participant := range participants.Participants {
		participantInfo := ParticipantInfo{
			Identity:    participant.Identity,
			Name:        participant.Name,
			State:       participant.State.String(),
			JoinedAt:    participant.JoinedAt,
			IsPublisher: len(participant.Tracks) > 0,
		}
		participantList = append(participantList, participantInfo)
	}

	response := GetStreamResponse{
		Room:         roomInfo,
		Participants: participantList,
	}

	return c.JSON(http.StatusOK, response)
}

// DeleteStream 핸들러 - 스트림(룸) 삭제
func (h *StreamHandler) DeleteStream(c echo.Context) error {
	roomName := c.Param("roomName")
	if roomName == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Room name is required")
	}

	roomClient := lksdk.NewRoomServiceClient(h.hostURL, h.apiKey, h.apiSecret)

	// 룸 삭제
	_, err := roomClient.DeleteRoom(context.Background(), &livekit.DeleteRoomRequest{
		Room: roomName,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to delete room")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":   "Stream deleted successfully",
		"room_name": roomName,
	})
}
