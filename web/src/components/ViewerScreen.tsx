import { useState, useEffect, useRef } from 'react'
import { Room, RoomEvent, RemoteParticipant, RemoteTrack, Track } from 'livekit-client'
import { backendClient, type JoinStreamRequest } from '../clients/backendClient'

interface ViewerScreenProps {
  room: {
    name: string
    metadata: { [key: string]: any } | null
  }
  onBack: () => void
}

interface HTMPCaptureableVideoElement extends HTMLVideoElement {
  captureStream(): MediaStream;
}

function ViewerScreen({ room, onBack }: ViewerScreenProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewerName, setViewerName] = useState('')
  const [participants, setParticipants] = useState<RemoteParticipant[]>([])
  const [currentVideoTrack, setCurrentVideoTrack] = useState<RemoteTrack | null>(null)
  
  const roomRef = useRef<Room | null>(null)
  const videoElementRef = useRef<HTMPCaptureableVideoElement>(null)

  // currentVideoTrack이 변경될 때마다 비디오 엘리먼트에 연결
  useEffect(() => {
    if (currentVideoTrack && videoElementRef.current) {
      console.log('[ViewerScreen] 비디오 트랙을 화면에 연결 중...', {
        trackSid: currentVideoTrack.sid,
        roomName: room.name,
        viewerName
      })
      
      currentVideoTrack.attach(videoElementRef.current)
      console.log('[ViewerScreen] 비디오 트랙 화면에 연결 완료:', {
        trackSid: currentVideoTrack.sid,
        roomName: room.name,
        viewerName
      })
    }
  }, [currentVideoTrack, room.name, viewerName])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      console.log('[ViewerScreen] 컴포넌트 언마운트 - 리소스 정리 중...')
      
      // LiveKit 연결 정리
      if (roomRef.current) {
        roomRef.current.disconnect().catch(err => {
          console.error('[ViewerScreen] LiveKit 연결 해제 실패:', err)
        })
        roomRef.current = null
        console.log('[ViewerScreen] LiveKit 연결 정리됨')
      }
    }
  }, [])

  const joinRoom = async () => {
    if (!viewerName.trim()) {
      setError('시청자 이름을 입력해주세요.')
      return
    }

    console.log('[ViewerScreen] 방 참여 시작:', { roomName: room.name, viewerName })

    try {
      setIsConnecting(true)
      setError(null)

      // 1. 백엔드에서 시청자용 토큰 요청
      console.log('[ViewerScreen] 백엔드 시청자 참여 요청...')
      const joinData = await backendClient.joinStream({
        identity: viewerName,
        room_name: room.name
      })
      console.log('[ViewerScreen] 시청자 참여 성공:', joinData)
      
      // 2. LiveKit 룸 생성 및 연결
      console.log('[LiveKit] 시청자 룸 생성 시작')
      const livekitRoom = new Room()
      roomRef.current = livekitRoom

      // 룸 이벤트 리스너
      console.log('[LiveKit] 시청자 룸 이벤트 리스너 등록 시작')
      livekitRoom.on(RoomEvent.Connected, () => {
        console.log('[LiveKit] 시청자 룸 연결 성공:', { 
          roomName: room.name, 
          viewerName,
          participantCount: livekitRoom.numParticipants
        })
        setIsConnected(true)
        setIsConnecting(false)
      })

      livekitRoom.on(RoomEvent.Disconnected, () => {
        console.log('[LiveKit] 시청자 룸 연결 해제:', { 
          roomName: room.name, 
          viewerName,
          reason: '시청 종료' 
        })
        setIsConnected(false)
        setIsConnecting(false)
      })

      livekitRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('[LiveKit] 참가자 연결됨:', { 
          participantIdentity: participant.identity,
          roomName: room.name,
          viewerName
        })
        setParticipants(prev => [...prev, participant])
      })

      livekitRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('[LiveKit] 참가자 연결 해제됨:', { 
          participantIdentity: participant.identity,
          roomName: room.name,
          viewerName
        })
        setParticipants(prev => prev.filter(p => p.identity !== participant.identity))
      })

      livekitRoom.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication, participant: RemoteParticipant) => {
        console.log('[LiveKit] 트랙 구독됨:', { 
          trackSid: track.sid,
          trackKind: track.kind,
          participantIdentity: participant.identity,
          roomName: room.name,
          viewerName
        })
        
        if (track.kind === Track.Kind.Video) {
          setCurrentVideoTrack(track)
          
          // 실제 비디오 스트림 수신 시작 로그
          console.log('[LiveKit] 비디오 스트림 수신 시작:', {
            trackSid: track.sid,
            participantIdentity: participant.identity,
            roomName: room.name,
            viewerName,
            timestamp: new Date().toISOString()
          })
        } else if (track.kind === Track.Kind.Audio) {
          // 실제 오디오 스트림 수신 시작 로그
          console.log('[LiveKit] 오디오 스트림 수신 시작:', {
            trackSid: track.sid,
            participantIdentity: participant.identity,
            roomName: room.name,
            viewerName,
            timestamp: new Date().toISOString()
          })
        }
      })

      livekitRoom.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication, participant: RemoteParticipant) => {
        console.log('[LiveKit] 트랙 구독 해제됨:', { 
          trackSid: track.sid,
          trackKind: track.kind,
          participantIdentity: participant.identity,
          roomName: room.name,
          viewerName
        })
        
        if (track.kind === Track.Kind.Video) {
          setCurrentVideoTrack(null)
          console.log('[LiveKit] 비디오 스트림 수신 중단:', {
            trackSid: track.sid,
            participantIdentity: participant.identity,
            roomName: room.name,
            viewerName,
            timestamp: new Date().toISOString()
          })
        } else if (track.kind === Track.Kind.Audio) {
          console.log('[LiveKit] 오디오 스트림 수신 중단:', {
            trackSid: track.sid,
            participantIdentity: participant.identity,
            roomName: room.name,
            viewerName,
            timestamp: new Date().toISOString()
          })
        }
      })

      // 3. 룸에 연결
      console.log('[LiveKit] 시청자 룸 연결 시작')
      console.log('[LiveKit] 시청자 연결 정보:', {
        wsUrl: joinData.connection_details.ws_url,
        tokenLength: joinData.connection_details.token.length,
        roomName: room.name,
        viewerName
      })
      
      await livekitRoom.connect(joinData.connection_details.ws_url, joinData.connection_details.token)
      console.log('[LiveKit] 시청자 룸 연결 완료:', { roomName: room.name, viewerName })

    } catch (err) {
      console.error('[ViewerScreen] 방 참여 실패:', err)
      console.error('[ViewerScreen] 에러 스택:', (err as Error).stack)
      
      let errorMessage = '방 참여에 실패했습니다.'
      if (err instanceof Error) {
        errorMessage = `${err.name}: ${err.message}`
      }
      
      setError(errorMessage)
      setIsConnecting(false)
    }
  }

  const leaveRoom = async () => {
    try {
      console.log('[LiveKit] 시청자 룸 연결 해제 시작:', { roomName: room.name, viewerName })
      
      if (roomRef.current) {
        await roomRef.current.disconnect()
        roomRef.current = null
        console.log('[LiveKit] 시청자 룸 연결 해제 완료:', { roomName: room.name, viewerName })
      }

      setIsConnected(false)
      setIsConnecting(false)
      setParticipants([])
      setCurrentVideoTrack(null)
    } catch (err) {
      console.error('[ViewerScreen] 방 나가기 실패:', err)
      setError(err instanceof Error ? err.message : '방 나가기에 실패했습니다.')
    }
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    console.log('[ViewerScreen] 컴포넌트 마운트됨:', { roomName: room.name })
    
    return () => {
      console.log('[ViewerScreen] 컴포넌트 언마운트 - 리소스 정리 중...')
      if (roomRef.current) {
        console.log('[LiveKit] 시청자 컴포넌트 언마운트 시 룸 연결 해제:', { roomName: room.name, viewerName })
        roomRef.current.disconnect()
        console.log('[LiveKit] 시청자 룸 연결 해제 완료')
      }
    }
  }, [room.name, viewerName])

  const getBroadcasterInfo = () => {
    if (!room.metadata) return null
    
    if (room.metadata.creator_identity) {
      return `방송자: ${room.metadata.creator_identity}`
    }
    
    if (room.metadata.title) {
      return `제목: ${room.metadata.title}`
    }
    
    return null
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>방송 시청</h2>
        <button 
          onClick={onBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          뒤로가기
        </button>
      </div>

      {/* 방 정보 */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px' }}>방 정보</h3>
        <p><strong>방 이름:</strong> {room.name}</p>
        {getBroadcasterInfo() && <p><strong>{getBroadcasterInfo()}</strong></p>}
        <p><strong>참가자 수:</strong> {participants.length + 1}명</p>
      </div>

      {!isConnected && !isConnecting && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              시청자 이름:
            </label>
            <input 
              type="text"
              value={viewerName}
              onChange={(e) => setViewerName(e.target.value)}
              placeholder="시청자 이름을 입력하세요"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <button 
            onClick={joinRoom}
            disabled={isConnecting || !viewerName.trim()}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isConnecting || !viewerName.trim() ? 'not-allowed' : 'pointer',
              opacity: isConnecting || !viewerName.trim() ? 0.7 : 1
            }}
          >
            {isConnecting ? '방 참여 중...' : '방 참여'}
          </button>
        </div>
      )}

      {isConnecting && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>방에 참여하는 중...</p>
        </div>
      )}

      {isConnected && (
        <div>
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#d4edda', 
            border: '1px solid #c3e6cb', 
            borderRadius: '4px',
            color: '#155724'
          }}>
            <strong>시청 중</strong> - 방: {room.name}
          </div>

          {/* 비디오 플레이어 */}
          <div style={{ marginBottom: '20px' }}>
            <h3>방송 화면</h3>
            <video 
              ref={videoElementRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                maxWidth: '800px',
                height: 'auto',
                backgroundColor: '#000',
                borderRadius: '8px',
                display: currentVideoTrack ? 'block' : 'none'
              }}
              onPlay={() => console.log('[ViewerScreen] 방송 비디오 재생 시작됨')}
              onPause={() => console.log('[ViewerScreen] 방송 비디오 일시정지됨')}
              onEnded={() => console.log('[ViewerScreen] 방송 비디오 종료됨')}
              onError={(e) => console.error('[ViewerScreen] 방송 비디오 에러:', e)}
            />
            {currentVideoTrack ? (
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                방송자로부터 수신 중인 비디오
              </p>
            ) : (
              <div style={{
                width: '100%',
                maxWidth: '800px',
                height: '450px',
                backgroundColor: '#f8f9fa',
                border: '2px dashed #dee2e6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6c757d'
              }}>
                <p>방송이 시작될 때까지 기다리는 중...</p>
              </div>
            )}
          </div>

          {/* 참가자 목록 */}
          <div style={{ marginBottom: '20px' }}>
            <h3>참가자 목록</h3>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <p><strong>나:</strong> {viewerName}</p>
              {participants.map((participant) => (
                <p key={participant.identity}>
                  <strong>{participant.identity}</strong>
                  {participant.videoTrackPublications.size > 0 && ' (방송자)'}
                </p>
              ))}
            </div>
          </div>

          {/* 방 나가기 버튼 */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={leaveRoom}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              방 나가기
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24'
        }}>
          <strong>오류:</strong> {error}
        </div>
      )}
    </div>
  )
}

export default ViewerScreen 