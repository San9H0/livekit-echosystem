package tests

import (
	"fmt"
	"testing"
	"time"

	lksdk "github.com/livekit/server-sdk-go/v2"
	"github.com/pion/webrtc/v4"
)

func TestListParticipants(t *testing.T) {
	hostURL := "ws://localhost:7880" // ex: https://project-123456.livekit.cloud
	apiKey := "APISSfcCBvtoqGE"
	apiSecret := "sJEpsUb5ETzRcvihadjeSUJMb9fN6j9b4fumAktL6fKB"
	roomName := "my-room"
	identity := "user-1"
	roomCB := &lksdk.RoomCallback{
		ParticipantCallback: lksdk.ParticipantCallback{
			OnTrackSubscribed: trackSubscribed,
		},
	}
	room, err := lksdk.ConnectToRoom(hostURL, lksdk.ConnectInfo{
		APIKey:              apiKey,
		APISecret:           apiSecret,
		RoomName:            roomName,
		ParticipantIdentity: identity,
	}, roomCB)
	if err != nil {
		panic(err)
	}
	t.Log("[TESTDEBUG] sleep 10 seconds room: ", room)

	time.Sleep(10 * time.Second)
	room.Disconnect()
}

func trackSubscribed(track *webrtc.TrackRemote, publication *lksdk.RemoteTrackPublication, rp *lksdk.RemoteParticipant) {
	fmt.Println("trackSubscribed kind:", track.Kind(), ", codec:", track.Codec().MimeType)
}
