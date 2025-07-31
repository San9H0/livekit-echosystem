package tests

import (
	"context"
	"testing"

	"github.com/livekit/protocol/livekit"
	lksdk "github.com/livekit/server-sdk-go/v2"
	"github.com/zeebo/assert"
)

// MockTest is a simple test that prints "HelloWorld"
func TestMockHelloWorld(t *testing.T) {
	// TODO: Add your test content here
	t.Log("HelloWorld")

	hostURL := "ws://localhost:7880"
	apiKey := "APISSfcCBvtoqGE"
	apiSecret := "sJEpsUb5ETzRcvihadjeSUJMb9fN6j9b4fumAktL6fKB"

	roomClient := lksdk.NewRoomServiceClient(hostURL, apiKey, apiSecret)

	// create a new room
	room, err := roomClient.CreateRoom(context.Background(), &livekit.CreateRoomRequest{
		Name: "test-room",
	})
	assert.NoError(t, err)

	t.Log("1. room: ", room)

	listRoomsRes, err := roomClient.ListRooms(context.Background(), &livekit.ListRoomsRequest{})
	assert.NoError(t, err)
	t.Log("2. listRoomsRes: ", listRoomsRes)
	t.Log("2. rooms count: ", len(listRoomsRes.Rooms))

	deletedResp, err := roomClient.DeleteRoom(context.Background(), &livekit.DeleteRoomRequest{
		Room: "test-room",
	})
	assert.NoError(t, err)
	t.Log("3. deletedResp: ", deletedResp)

	listRoomsRes, err = roomClient.ListRooms(context.Background(), &livekit.ListRoomsRequest{})
	assert.NoError(t, err)

	t.Log("4. listRoomsRes: ", listRoomsRes)
	t.Log("4. rooms count: ", len(listRoomsRes.Rooms))

	// list participants in a room
	listParticipantsRes, err := roomClient.ListParticipants(context.Background(), &livekit.ListParticipantsRequest{
		Room: "my-room",
	})
	assert.NoError(t, err)
	t.Log("5. listParticipantsRes: ", listParticipantsRes)
	t.Log("5. participants count: ", len(listParticipantsRes.Participants))

}
