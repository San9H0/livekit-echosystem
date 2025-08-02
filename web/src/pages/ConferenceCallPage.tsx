import { useState, useEffect, useRef } from 'react'
import { Room, RoomEvent, RemoteParticipant, LocalParticipant, Track, TrackPublication, RemoteTrack, LocalAudioTrack, LocalVideoTrack } from 'livekit-client'
import { type Room as BackendRoom } from '../clients/backendClient'
import { backendClient } from '../clients/backendClient'
import { type UserSettings } from './JoinRoomPage'
import { createMediaStreamFromFile, createCanvasMediaStream, createAudioMediaStream, type HTMPCaptureableVideoElement } from '../utils/MediaStream'
import HeaderNavigation from '../components/HeaderNavigation'

interface ConferenceCallPageProps {
  room: BackendRoom
  userSettings: UserSettings
  onNavigateToLobby: () => void
}

interface Participant {
  id: string
  name: string
  isLocal: boolean
  videoTrack?: RemoteTrack
  audioTrack?: RemoteTrack
  isVideoEnabled: boolean
  isAudioEnabled: boolean
}

function ConferenceCallPage({ room, userSettings, onNavigateToLobby }: ConferenceCallPageProps) {
  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isConnecting, setIsConnecting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localVideoReady, setLocalVideoReady] = useState(false)
  const [isLocalAudioMuted, setIsLocalAudioMuted] = useState(false)
  const [isLocalVideoMuted, setIsLocalVideoMuted] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ id: string, sender: string, message: string, timestamp: Date }>>([])
  const [chatInput, setChatInput] = useState('')

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const localVideoRef = useRef<HTMPCaptureableVideoElement>(null)
  const mediaBlobRef = useRef<string | null>(null)
  useEffect(() => {
    connectToRoom()
    return () => {
      if (livekitRoom) {
        livekitRoom.disconnect()
      }
      // blob URL 정리
      if (mediaBlobRef.current) {
        URL.revokeObjectURL(mediaBlobRef.current)
      }
    }
  }, [])

  // localVideoRef가 설정되고 미디어 파일이 있을 때 스트림 설정
  useEffect(() => {
    const setupMediaStream = async () => {
      if (localVideoRef.current && userSettings.mediaFile && livekitRoom && !localVideoReady) {
        try {

          const mediaStream = await createMediaStreamFromFile(userSettings.mediaFile, localVideoRef)

          const videoTrack = new LocalVideoTrack(mediaStream.getVideoTracks()[0])
          const audioTrack = new LocalAudioTrack(mediaStream.getAudioTracks()[0])

          await livekitRoom.localParticipant.publishTrack(videoTrack)
          await livekitRoom.localParticipant.publishTrack(audioTrack)

          await localVideoRef.current.play();
          setLocalVideoReady(true);
        } catch (error) {
          console.error("[TESTDEBUG] 미디어 스트림 설정 실패:", error)
        }
      }
    }

    setupMediaStream()
  }, [localVideoRef.current, userSettings.mediaFile, livekitRoom, localVideoReady])

  const connectToRoom = async () => {
    try {
      setIsConnecting(true)
      setError(null)

      // 백엔드에서 토큰 가져오기
      const response = await backendClient.joinStream({
        identity: userSettings.username,
        room_id: room.room_id
      })

      // LiveKit Room 생성 및 연결
      const livekitRoomInstance = new Room({
        adaptiveStream: true,
        dynacast: true,
      })

      // 이벤트 리스너 설정
      livekitRoomInstance.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
      livekitRoomInstance.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      livekitRoomInstance.on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      livekitRoomInstance.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      livekitRoomInstance.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished)
      livekitRoomInstance.on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished)

      // 방 연결
      await livekitRoomInstance.connect(response.connection_details.ws_url, response.connection_details.token)

      setLivekitRoom(livekitRoomInstance)

      // 로컬 참가자 추가
      const localParticipant: Participant = {
        id: livekitRoomInstance.localParticipant.identity,
        name: userSettings.username,
        isLocal: true,
        isVideoEnabled: true,
        isAudioEnabled: true
      }

      // 기존에 참여 중인 참가자들 추가
      const existingParticipants: Participant[] = []
      livekitRoomInstance.remoteParticipants.forEach((participant) => {
        console.log('[Livekit] 기존 참가자 발견:', participant.identity)
        const existingParticipant: Participant = {
          id: participant.identity,
          name: participant.identity,
          isLocal: false,
          isVideoEnabled: false,
          isAudioEnabled: false
        }
        existingParticipants.push(existingParticipant)
      })

      // 로컬 참가자와 기존 참가자들을 모두 추가
      setParticipants([localParticipant, ...existingParticipants])

      setIsConnecting(false)
    } catch (err) {
      console.error('Failed to connect to room:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect to room')
      setIsConnecting(false)
    }
  }

  const handleParticipantConnected = (participant: RemoteParticipant) => {
    console.log('[Livekit] Participant connected:', participant.identity)
    const newParticipant: Participant = {
      id: participant.identity,
      name: participant.identity,
      isLocal: false,
      isVideoEnabled: false,
      isAudioEnabled: false
    }
    setParticipants(prev => [...prev, newParticipant])
  }

  const handleParticipantDisconnected = (participant: RemoteParticipant) => {
    console.log('[Livekit] Participant disconnected:', participant.identity)
    setParticipants(prev => prev.filter(p => p.id !== participant.identity))
  }

  const handleTrackSubscribed = (track: RemoteTrack, publication: TrackPublication, participant: RemoteParticipant) => {
    console.log('[Livekit] Track subscribed:', track.kind, participant.identity)

    setParticipants(prev => prev.map(p => {
      if (p.id === participant.identity) {
        if (track.kind === Track.Kind.Video) {
          return { ...p, videoTrack: track, isVideoEnabled: true }
        } else if (track.kind === Track.Kind.Audio) {
          return { ...p, audioTrack: track, isAudioEnabled: true }
        }
      }
      return p
    }))

    // 비디오 요소에 스트림 연결
    if (track.kind === Track.Kind.Video) {
      const videoElement = videoRefs.current[participant.identity]
      if (videoElement) {
        track.attach(videoElement)
      }
    }
  }

  const handleTrackUnsubscribed = (track: RemoteTrack, publication: TrackPublication, participant: RemoteParticipant) => {
    console.log('[Livekit] Track unsubscribed:', track.kind, participant.identity)

    setParticipants(prev => prev.map(p => {
      if (p.id === participant.identity) {
        if (track.kind === Track.Kind.Video) {
          return { ...p, videoTrack: undefined, isVideoEnabled: false }
        } else if (track.kind === Track.Kind.Audio) {
          return { ...p, audioTrack: undefined, isAudioEnabled: false }
        }
      }
      return p
    }))
  }

  const handleLocalTrackPublished = (publication: TrackPublication, participant: LocalParticipant) => {
    console.log('[Livekit] Local track published:', publication.kind)
  }

  const handleLocalTrackUnpublished = (publication: TrackPublication, participant: LocalParticipant) => {
    console.log('[Livekit] Local track unpublished:', publication.kind)
  }



  const leaveRoom = async () => {
    if (livekitRoom) {
      await livekitRoom.disconnect()
    }
    // blob URL 정리
    if (mediaBlobRef.current) {
      URL.revokeObjectURL(mediaBlobRef.current)
    }
    onNavigateToLobby()
  }

  const toggleLocalAudio = async () => {
    if (livekitRoom) {
      if (isLocalAudioMuted) {
        await livekitRoom.localParticipant.setMicrophoneEnabled(true)
        setIsLocalAudioMuted(false)
      } else {
        await livekitRoom.localParticipant.setMicrophoneEnabled(false)
        setIsLocalAudioMuted(true)
      }
    }
  }

  const toggleLocalVideo = async () => {
    if (livekitRoom) {
      if (isLocalVideoMuted) {
        await livekitRoom.localParticipant.setCameraEnabled(true)
        setIsLocalVideoMuted(false)
      } else {
        await livekitRoom.localParticipant.setCameraEnabled(false)
        setIsLocalVideoMuted(true)
      }
    }
  }

  const sendChatMessage = () => {
    if (chatInput.trim() && livekitRoom) {
      const newMessage = {
        id: Date.now().toString(),
        sender: userSettings.username,
        message: chatInput.trim(),
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, newMessage])
      setChatInput('')

      // LiveKit Data Channel을 통해 메시지 전송 (실제 구현 시)
      // livekitRoom.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(newMessage)))
    }
  }

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }

  // 참가자 수에 따른 그리드 레이아웃 계산
  const getGridLayout = (participantCount: number) => {
    if (participantCount === 1) {
      return {
        gridTemplateColumns: '1fr',
        gridTemplateRows: '1fr'
      }
    } else if (participantCount === 2) {
      return {
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr'
      }
    } else if (participantCount === 3) {
      return {
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr'
      }
    } else if (participantCount === 4) {
      return {
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr'
      }
    } else if (participantCount === 5) {
      return {
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr'
      }
    } else if (participantCount === 6) {
      return {
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr'
      }
    } else {
      // 7명 이상인 경우 3x3 그리드
      return {
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr'
      }
    }
  }

  // 참가자별 그리드 위치 계산
  const getParticipantGridPosition = (index: number, totalCount: number) => {
    if (totalCount === 1) {
      return { gridColumn: '1', gridRow: '1' }
    } else if (totalCount === 2) {
      return { gridColumn: index + 1, gridRow: '1' }
    } else if (totalCount === 3) {
      if (index === 0) return { gridColumn: '1', gridRow: '1' }
      if (index === 1) return { gridColumn: '2', gridRow: '1' }
      if (index === 2) return { gridColumn: '1 / 3', gridRow: '2' }
    } else if (totalCount === 4) {
      const row = Math.floor(index / 2) + 1
      const col = (index % 2) + 1
      return { gridColumn: col, gridRow: row }
    } else if (totalCount === 5) {
      if (index < 3) {
        return { gridColumn: index + 1, gridRow: '1' }
      } else {
        return { gridColumn: index - 2, gridRow: '2' }
      }
    } else if (totalCount === 6) {
      const row = Math.floor(index / 3) + 1
      const col = (index % 3) + 1
      return { gridColumn: col, gridRow: row }
    } else {
      // 7명 이상
      const row = Math.floor(index / 3) + 1
      const col = (index % 3) + 1
      return { gridColumn: col, gridRow: row }
    }
    return {}
  }

  // 로딩 화면
  if (isConnecting) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '20px', fontSize: '16px' }}>방에 연결 중...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // 에러 화면
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <h2>연결 오류</h2>
        <p style={{ marginBottom: '20px' }}>{error}</p>
        <button
          onClick={onNavigateToLobby}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          로비로 돌아가기
        </button>
      </div>
    )
  }

  // 컨퍼런스 콜 화면
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 공통 헤더 네비게이션 */}
      <HeaderNavigation
        onCreateRoom={() => console.log('방 만들기 (아직 구현되지 않음)')}
        onNavigateToPublisher={() => console.log('Publisher 페이지로 이동 (아직 구현되지 않음)')}
      />

      {/* 방 정보 표시 영역 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e9ecef',
        zIndex: 1000
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px' }}>방 ID: {room.room_id}</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>참가자: {participants.length}명</p>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* 비디오 그리드 영역 - 전체화면 */}
        <div style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#000',
          display: 'grid',
          gap: '10px',
          padding: '20px',
          ...getGridLayout(participants.length)
        }}>
          {participants.map((participant, index) => (
            <div key={participant.id} style={{
              position: 'relative',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              overflow: 'hidden',
              ...getParticipantGridPosition(index, participants.length)
            }}>
              <video
                ref={el => {
                  if (participant.isLocal) {
                    localVideoRef.current = el as HTMPCaptureableVideoElement
                  } else {
                    videoRefs.current[participant.id] = el
                  }
                }}
                autoPlay
                playsInline
                muted={participant.isLocal}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              {/* 참가자 이름 오버레이 */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {participant.name}
                {participant.isLocal && ' (나)'}
              </div>

              {/* 오디오/비디오 상태 표시 */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                gap: '5px'
              }}>
                {!participant.isAudioEnabled && (
                  <div style={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}>
                    🔇
                  </div>
                )}
                {!participant.isVideoEnabled && (
                  <div style={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}>
                    📹
                  </div>
                )}
              </div>

              {/* 미디어 파일 재생 표시 */}
              {participant.isLocal && localVideoReady && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  미디어 파일 재생 중
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 우측 채팅 패널 */}
        <div style={{
          width: '350px',
          backgroundColor: '#fff',
          borderLeft: '1px solid #e9ecef',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 채팅 헤더 */}
          <div style={{
            padding: '15px 20px',
            borderBottom: '1px solid #e9ecef',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>💬 채팅</h3>
          </div>

          {/* 채팅 메시지 영역 */}
          <div style={{
            flex: 1,
            padding: '15px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {chatMessages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '14px',
                marginTop: '20px'
              }}>
                아직 메시지가 없습니다.<br />
                첫 번째 메시지를 보내보세요!
              </div>
            ) : (
              chatMessages.map((message) => (
                <div key={message.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxWidth: '100%'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      fontWeight: 'bold',
                      fontSize: '12px',
                      color: message.sender === userSettings.username ? '#3498db' : '#2c3e50'
                    }}>
                      {message.sender}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      color: '#6c757d'
                    }}>
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{
                    backgroundColor: message.sender === userSettings.username ? '#3498db' : '#f8f9fa',
                    color: message.sender === userSettings.username ? 'white' : '#2c3e50',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    wordBreak: 'break-word',
                    alignSelf: message.sender === userSettings.username ? 'flex-end' : 'flex-start',
                    maxWidth: '80%'
                  }}>
                    {message.message}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 채팅 입력 영역 */}
          <div style={{
            padding: '15px',
            borderTop: '1px solid #e9ecef',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-end'
            }}>
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="메시지를 입력하세요..."
                style={{
                  flex: 1,
                  minHeight: '40px',
                  maxHeight: '100px',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  resize: 'none',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: chatInput.trim() ? '#3498db' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  transition: 'background-color 0.2s ease'
                }}
              >
                전송
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 컨트롤 바 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e9ecef',
        gap: '20px',
        zIndex: 1000
      }}>
        {/* 오디오 토글 버튼 */}
        <button
          onClick={toggleLocalAudio}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isLocalAudioMuted ? '#e74c3c' : '#3498db',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            transition: 'all 0.2s ease'
          }}
          title={isLocalAudioMuted ? '마이크 켜기' : '마이크 끄기'}
        >
          {isLocalAudioMuted ? '🔇' : '🎤'}
        </button>

        {/* 비디오 토글 버튼 */}
        <button
          onClick={toggleLocalVideo}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isLocalVideoMuted ? '#e74c3c' : '#3498db',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            transition: 'all 0.2s ease'
          }}
          title={isLocalVideoMuted ? '카메라 켜기' : '카메라 끄기'}
        >
          {isLocalVideoMuted ? '📹' : '📷'}
        </button>

        {/* 나가기 버튼 */}
        <button
          onClick={leaveRoom}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#e74c3c',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            transition: 'all 0.2s ease'
          }}
          title="방 나가기"
        >
          🚪
        </button>
      </div>
    </div>
  )
}

export default ConferenceCallPage 
