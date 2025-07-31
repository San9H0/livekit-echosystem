import React, { useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

const LiveKitTest1: React.FC = () => {
  const [token, setToken] = useState("");
  const [serverUrl, setServerUrl] = useState("ws://localhost:7880");
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    if (token && serverUrl) {
      setIsConnected(true);
    } else {
      alert("토큰과 서버 URL을 입력해주세요!");
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  if (isConnected) {
    return (
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect
        video={true}
        audio={true}
        onDisconnected={handleDisconnect}
      >
        <VideoConference />
      </LiveKitRoom>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>LiveKit 테스트</h2>
      <div style={{ marginBottom: 12 }}>
        <label>LiveKit Server URL: </label>
        <input
          type="text"
          value={serverUrl}
          onChange={e => setServerUrl(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Token: </label>
        <textarea
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="LiveKit JWT 토큰을 입력하세요"
          style={{ width: "100%", height: 100 }}
        />
      </div>
      <button onClick={handleConnect} style={{ width: "100%", padding: 10 }}>
        연결하기
      </button>
    </div>
  );
};

export default LiveKitTest1; 