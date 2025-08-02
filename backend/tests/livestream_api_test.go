package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/livekit/protocol/livekit"
	lksdk "github.com/livekit/server-sdk-go/v2"
	"github.com/pion/webrtc/v4"
	"github.com/zeebo/assert"
)

// LiveKit Ingress API 테스트를 위한 구조체
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

// LiveKit livestream API 플로우 테스트
func TestLiveStreamAPIFlow(t *testing.T) {
	// LiveKit 서버 설정
	hostURL := "ws://localhost:7880"
	apiKey := "APISSfcCBvtoqGE"
	apiSecret := "sJEpsUb5ETzRcvihadjeSUJMb9fN6j9b4fumAktL6fKB"

	// 1. LiveKit Room Service 클라이언트 생성
	roomClient := lksdk.NewRoomServiceClient(hostURL, apiKey, apiSecret)
	assert.NotNil(t, roomClient)

	// 2. 테스트용 방 생성
	roomName := fmt.Sprintf("test-room-%d", time.Now().Unix())
	room, err := roomClient.CreateRoom(context.Background(), &livekit.CreateRoomRequest{
		Name: roomName,
		Metadata: `{
			"creator_identity": "test-publisher",
			"enable_chat": true,
			"allow_participation": true
		}`,
	})
	assert.NoError(t, err)
	assert.NotNil(t, room)
	t.Logf("1. Created room: %s", roomName)

	// 3. Ingress 생성 (LiveKit SDK 사용)
	ingressClient := lksdk.NewIngressClient(hostURL, apiKey, apiSecret)

	ingressOptions := &livekit.CreateIngressRequest{
		Name:                roomName,
		RoomName:            roomName,
		ParticipantName:     "test-publisher (via OBS)",
		ParticipantIdentity: "test-publisher (via OBS)",
		Video: &livekit.IngressVideoOptions{
			Source: livekit.TrackSource_CAMERA,
			// Preset: livekit.IngressVideoEncodingPreset_H264_1080P_30FPS_3_LAYERS,
		},
		Audio: &livekit.IngressAudioOptions{
			Source: livekit.TrackSource_MICROPHONE,
			// Preset: livekit.IngressAudioEncodingPreset_OPUS_STEREO_96KBPS,
		},
	}

	ingress, err := ingressClient.CreateIngress(context.Background(), livekit.IngressInput_RTMP_INPUT, ingressOptions)
	assert.NoError(t, err)
	assert.NotNil(t, ingress)
	t.Logf("2. Created ingress - URL: %s, StreamKey: %s", ingress.Url, ingress.StreamKey)

	// 4. 시뮬레이션: HTTP API 호출 테스트
	// 실제 Next.js API 엔드포인트를 시뮬레이션
	createIngressReq := CreateIngressRequest{
		RoomName:    roomName,
		IngressType: "rtmp",
		Metadata: map[string]interface{}{
			"creator_identity":    "test-publisher",
			"enable_chat":         true,
			"allow_participation": true,
		},
	}

	reqBody, err := json.Marshal(createIngressReq)
	assert.NoError(t, err)

	// HTTP 요청 시뮬레이션 (실제로는 Next.js 서버가 처리)
	req := httptest.NewRequest("POST", "/api/create_ingress", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	// 응답 구조 검증
	var expectedResponse CreateIngressResponse
	expectedResponse.Ingress.URL = ingress.Url
	expectedResponse.Ingress.StreamKey = ingress.StreamKey
	expectedResponse.Ingress.RoomName = roomName

	t.Logf("3. Expected API Response:")
	t.Logf("   - Server URL: %s", expectedResponse.Ingress.URL)
	t.Logf("   - Stream Key: %s", expectedResponse.Ingress.StreamKey)
	t.Logf("   - Room Name: %s", expectedResponse.Ingress.RoomName)

	// 5. 참가자 연결 테스트 (시청자 시뮬레이션)
	roomCB := &lksdk.RoomCallback{
		ParticipantCallback: lksdk.ParticipantCallback{
			OnTrackSubscribed: func(track *webrtc.TrackRemote, publication *lksdk.RemoteTrackPublication, rp *lksdk.RemoteParticipant) {
				t.Logf("4. Track subscribed - Kind: %s, Codec: %s", track.Kind(), track.Codec().MimeType)
			},
		},
	}

	viewerRoom, err := lksdk.ConnectToRoom(hostURL, lksdk.ConnectInfo{
		APIKey:              apiKey,
		APISecret:           apiSecret,
		RoomName:            roomName,
		ParticipantIdentity: "test-viewer",
	}, roomCB)
	assert.NoError(t, err)
	assert.NotNil(t, viewerRoom)
	t.Logf("5. Viewer connected to room: %s", roomName)

	// 잠시 대기 후 연결 해제
	time.Sleep(2 * time.Second)
	viewerRoom.Disconnect()

	// 6. 방 정리
	deletedResp, err := roomClient.DeleteRoom(context.Background(), &livekit.DeleteRoomRequest{
		Room: roomName,
	})
	assert.NoError(t, err)
	t.Logf("6. Room deleted: %s", roomName)

	// 7. 방 목록 확인
	listRoomsRes, err := roomClient.ListRooms(context.Background(), &livekit.ListRoomsRequest{})
	assert.NoError(t, err)
	t.Logf("7. Remaining rooms count: %d", len(listRoomsRes.Rooms))
}

// OBS 설정 정보 검증 테스트
func TestOBSSettingsValidation(t *testing.T) {
	hostURL := "ws://localhost:7880"
	apiKey := "APISSfcCBvtoqGE"
	apiSecret := "sJEpsUb5ETzRcvihadjeSUJMb9fN6j9b4fumAktL6fKB"

	// Ingress 생성
	ingressClient := lksdk.NewIngressClient(hostURL, apiKey, apiSecret)

	roomName := fmt.Sprintf("obs-test-room-%d", time.Now().Unix())
	ingressOptions := &livekit.CreateIngressRequest{
		Name:                roomName,
		RoomName:            roomName,
		ParticipantName:     "obs-publisher",
		ParticipantIdentity: "obs-publisher",
		Video: &livekit.IngressVideoOptions{
			Source: livekit.TrackSource_CAMERA,
			Preset: livekit.IngressVideoEncodingPreset_H264_1080P_30FPS_3_LAYERS,
		},
		Audio: &livekit.IngressAudioOptions{
			Source: livekit.TrackSource_MICROPHONE,
			Preset: livekit.IngressAudioEncodingPreset_OPUS_STEREO_96KBPS,
		},
	}

	ingress, err := ingressClient.CreateIngress(context.Background(), livekit.IngressInput_RTMP_INPUT, ingressOptions)
	assert.NoError(t, err)

	// OBS 설정 정보 검증
	t.Logf("OBS Settings Validation:")
	t.Logf("Server URL: %s", ingress.Url)
	t.Logf("Stream Key: %s", ingress.StreamKey)

	// URL 형식 검증
	assert.Contains(t, ingress.Url, "rtmp://")
	assert.NotEmpty(t, ingress.StreamKey)
	assert.True(t, len(ingress.StreamKey) > 10) // Stream Key는 충분히 긴 문자열이어야 함

	// 방 정리
	roomClient := lksdk.NewRoomServiceClient(hostURL, apiKey, apiSecret)
	roomClient.DeleteRoom(context.Background(), &livekit.DeleteRoomRequest{
		Room: roomName,
	})
}
