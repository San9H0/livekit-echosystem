package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/livekit/protocol/auth"
)

func getJoinToken(room, identity string) string {
	at := auth.NewAccessToken(os.Getenv("LIVEKIT_API_KEY"), os.Getenv("LIVEKIT_API_SECRET"))
	fmt.Println("[TEST DEBUG] LIVEKIT_API_KEY: ", os.Getenv("LIVEKIT_API_KEY"))
	fmt.Println("[TEST DEBUG] LIVEKIT_API_SECRET: ", os.Getenv("LIVEKIT_API_SECRET"))
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

func main() {
	http.HandleFunc("/getToken", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(getJoinToken("my-room", "identity")))
	})

	log.Fatal(http.ListenAndServe(":8080", nil))
}
