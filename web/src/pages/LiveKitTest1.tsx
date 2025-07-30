import React, { useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';

const LiveKitTest1: React.FC = () => {
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('wss://your-livekit-server.com');
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    if (token && serverUrl) {
      setIsConnected(true);
    } else {
      alert('토큰과 서버 URL을 입력해주세요!');
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  if (isConnected) {
    return (
      <div style={{ height: '100vh', width: '100vw' }}>
        <LiveKitRoom 
          token={token} 
          serverUrl={serverUrl} 
          connect={true}
          onDisconnected={handleDisconnect}
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>LiveKit 테스트 1</h1>
      <p>LiveKit React SDK를 사용한 기본 연결 테스트입니다.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          서버 URL:
        </label>
        <input
          type="text"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder="wss://your-livekit-server.com"
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          LiveKit 토큰:
        </label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="LiveKit JWT 토큰을 입력하세요"
          style={{
            width: '100%',
            height: '100px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>

      <button
        onClick={handleConnect}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer',
          width: '100%'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
      >
        연결하기
      </button>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <h3>사용법:</h3>
        <ol>
          <li>LiveKit 서버 URL을 입력하세요 (예: wss://your-livekit-server.com)</li>
          <li>LiveKit JWT 토큰을 입력하세요</li>
          <li>"연결하기" 버튼을 클릭하여 방에 참여하세요</li>
          <li>카메라와 마이크 권한을 허용하면 비디오 컨퍼런스가 시작됩니다</li>
        </ol>
      </div>
    </div>
  );
};

export default LiveKitTest1; 