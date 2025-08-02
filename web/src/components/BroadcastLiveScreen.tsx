import { useState, useEffect, useRef } from 'react'
import { backendClient } from '../clients/backendClient'
import { Room, RoomEvent, LocalVideoTrack, LocalAudioTrack, createLocalAudioTrack, Track } from 'livekit-client'
import { createMediaStreamFromFile, type HTMPCaptureableVideoElement } from '../utils/MediaStream'

interface BroadcastLiveScreenProps {
  roomName: string
  broadcasterName: string
  selectedVideoFile: File
  onBack: () => void
}

function BroadcastLiveScreen({ roomName, broadcasterName, selectedVideoFile, onBack }: BroadcastLiveScreenProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  
  const videoElementRef = useRef<HTMPCaptureableVideoElement>(null)
  const roomRef = useRef<Room | null>(null)



  const startBroadcast = async () => {
    console.log('[BroadcastLiveScreen] 방송 시작 프로세스 시작...')
    console.log('[BroadcastLiveScreen] 방송 정보:', { roomName, broadcasterName, videoEnabled, audioEnabled })

    try {
      setIsConnecting(true)
      setError(null)

      if (videoElementRef.current) {
        // LiveKit 방 연결 및 스트리밍 시작
        console.log('[BroadcastLiveScreen] LiveKit 방 연결 시작...')
        
        // 1. 백엔드에서 스트림 생성 요청
        const streamResponse = await backendClient.createStream({
          room_name: roomName,
          metadata: {
            creator_identity: broadcasterName,
            title: roomName,
            type: 'video'
          }
        })
        
        console.log('[BroadcastLiveScreen] 스트림 생성 성공:', streamResponse)
        
        // 2. LiveKit 룸 생성
        console.log('[LiveKit] 룸 생성...')
        const room = new Room()
        roomRef.current = room
        
        // 3. 미디어 트랙 생성
        console.log('[BroadcastLiveScreen] 미디어 트랙 생성 시작...')
        
        let videoTrack: LocalVideoTrack | null = null
        let audioTrack: LocalAudioTrack | null = null

        console.log('[BroadcastLiveScreen] 비디오 파일로 트랙 생성 중...', selectedVideoFile.name)
        const mediaStream = await createMediaStreamFromFile(selectedVideoFile, videoElementRef)
        if (videoEnabled) {
          // 비디오 파일에서 MediaStream 생성
          console.log('[BroadcastLiveScreen] 비디오 파일에서 MediaStream 생성 완료')
          
          // MediaStream에서 LocalVideoTrack 생성
          videoTrack = new LocalVideoTrack(mediaStream.getVideoTracks()[0])
          
          console.log('[BroadcastLiveScreen] 비디오 파일 트랙 생성 성공')
          console.log('[BroadcastLiveScreen] 비디오 트랙 정보:', {
            id: videoTrack.sid,
            kind: videoTrack.kind,
            source: videoTrack.source
          })
        }
        
        if (audioEnabled) {
          // MediaStream에서 오디오 트랙 추출
          const audioTracks = mediaStream.getAudioTracks()
          if (audioTracks.length > 0) {
            audioTrack = new LocalAudioTrack(audioTracks[0])
            console.log('[BroadcastLiveScreen] 비디오 파일 오디오 트랙 생성 성공')
            console.log('[BroadcastLiveScreen] 오디오 트랙 정보:', {
              id: audioTrack.sid,
              kind: audioTrack.kind,
              source: audioTrack.source
            })
          } else {
            console.warn('[BroadcastLiveScreen] 비디오 파일에 오디오 트랙이 없습니다')
          }
        }
        
        console.log('[BroadcastLiveScreen] 미디어 트랙 생성 완료: 비디오=' + !!videoTrack + ', 오디오=' + !!audioTrack)
        
        // 4. LiveKit 룸 연결
        console.log('[LiveKit] 룸 연결 중...')
        console.log('[BroadcastLiveScreen] 연결 정보:', {
          wsUrl: streamResponse.connection_details.ws_url,
          tokenLength: streamResponse.connection_details.token.length
        })
        
        await room.connect(streamResponse.connection_details.ws_url, streamResponse.connection_details.token, {
          autoSubscribe: false
        })
        
        console.log('[LiveKit] 룸 연결 성공')
        
        // 5. 트랙 발행
        if (videoTrack) {
          console.log('[LiveKit] 비디오 트랙 발행 시작...')
          await room.localParticipant.publishTrack(videoTrack)
          console.log('[LiveKit] 비디오 트랙 발행 성공')
          
          // 실제 비디오 스트림 발행 시작 로그
          console.log('[LiveKit] 비디오 스트림 발행 시작:', {
            trackSid: videoTrack.sid,
            roomName,
            broadcasterName,
            timestamp: new Date().toISOString()
          })
        }
        
        if (audioTrack) {
          console.log('[LiveKit] 오디오 트랙 발행 시작...')
          await room.localParticipant.publishTrack(audioTrack)
          console.log('[LiveKit] 오디오 트랙 발행 성공')
          
          // 실제 오디오 스트림 발행 시작 로그
          console.log('[LiveKit] 오디오 스트림 발행 시작:', {
            trackSid: audioTrack.sid,
            roomName,
            broadcasterName,
            timestamp: new Date().toISOString()
          })
        }

        await videoElementRef.current.play();
        
        // 6. 이벤트 리스너 설정
        room.on(RoomEvent.TrackPublished, (publication, participant) => {
          console.log('[LiveKit] 트랙 발행됨:', {
            participant: participant.identity,
            trackSid: publication.trackSid,
            trackType: publication.kind
          })
        })
        
        room.on(RoomEvent.TrackUnpublished, (publication, participant) => {
          console.log('[LiveKit] 트랙 발행 해제됨:', {
            participant: participant.identity,
            trackSid: publication.trackSid
          })
        })
        
        room.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log('[LiveKit] 참가자 연결됨:', participant.identity)
        })
        
        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log('[LiveKit] 참가자 연결 해제됨:', participant.identity)
        })

        // 방송 상태를 연결됨으로 설정
        setIsConnected(true)
        setIsConnecting(false)
        console.log('[BroadcastLiveScreen] 비디오 재생 시작 완료!')
      } else {
        throw new Error('비디오 엘리먼트를 찾을 수 없습니다.')
      }

    } catch (err) {
      console.error('[BroadcastLiveScreen] 방송 시작 실패:', err)
      console.error('[BroadcastLiveScreen] 에러 스택:', (err as Error).stack)
      
      let errorMessage = '방송 시작에 실패했습니다.'
      if (err instanceof Error) {
        errorMessage = `${err.name}: ${err.message}`
      }
      
      setError(errorMessage)
      setIsConnecting(false)
    }
  }

  const stopBroadcast = async () => {
    try {
      console.log('[BroadcastLiveScreen] 방송 종료 시작')
      
      // LiveKit 연결 해제
      if (roomRef.current) {
        console.log('[LiveKit] 룸 연결 해제 중...')
        await roomRef.current.disconnect()
        roomRef.current = null
        console.log('[LiveKit] 룸 연결 해제 완료')
      }
      
      // 미리보기 비디오 정리
      if (videoElementRef.current) {
        videoElementRef.current.pause()
        videoElementRef.current.src = ''
        videoElementRef.current.load()
        console.log('[BroadcastLiveScreen] 미리보기 비디오 정리됨')
      }

      // 방송 상태 초기화
      setIsConnected(false)
      setIsConnecting(false)
      console.log('[BroadcastLiveScreen] 방송 종료 완료')
    } catch (err) {
      console.error('[BroadcastLiveScreen] 방송 종료 실패:', err)
      setError(err instanceof Error ? err.message : '방송 종료에 실패했습니다.')
    }
  }

  // 컴포넌트 마운트 시 방송 시작
  useEffect(() => {
    console.log('[BroadcastLiveScreen] 컴포넌트 마운트됨')
    startBroadcast()
    
    return () => {
      console.log('[BroadcastLiveScreen] 컴포넌트 언마운트 - 리소스 정리 중...')
      
      // LiveKit 연결 정리
      if (roomRef.current) {
        roomRef.current.disconnect().catch(err => {
          console.error('[BroadcastLiveScreen] LiveKit 연결 해제 실패:', err)
        })
        roomRef.current = null
        console.log('[BroadcastLiveScreen] LiveKit 연결 정리됨')
      }
      
      // 미리보기 비디오 정리
      if (videoElementRef.current) {
        videoElementRef.current.pause()
        videoElementRef.current.src = ''
        videoElementRef.current.load()
        console.log('[BroadcastLiveScreen] 미리보기 비디오 정리됨')
      }
    }
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>방송 중</h2>
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

      {isConnecting && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>방송을 시작하는 중...</p>
        </div>
      )}

      {/* 비디오 미리보기 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>미리보기</h3>
        <video 
          ref={videoElementRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            maxWidth: '640px',
            height: 'auto',
            backgroundColor: '#000',
            borderRadius: '8px',
            display: isConnected ? 'block' : 'none'
          }}
          onPlay={() => console.log('[BroadcastLiveScreen] 미리보기 비디오 재생 시작됨')}
          onPause={() => console.log('[BroadcastLiveScreen] 미리보기 비디오 일시정지됨')}
          onEnded={() => console.log('[BroadcastLiveScreen] 미리보기 비디오 종료됨')}
          onError={(e) => console.error('[BroadcastLiveScreen] 미리보기 비디오 에러:', e)}
        />
        {isConnected && (
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            현재 방송 중인 비디오 미리보기
          </p>
        )}
      </div>

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
            <strong>방송 중</strong> - 방: {roomName}
          </div>

          {/* 스트림 상태 표시 */}
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>방송 스트림 상태</h4>
            <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
              <div>
                <strong>비디오:</strong> 
                <span style={{ 
                  color: videoEnabled ? '#28a745' : '#dc3545',
                  marginLeft: '5px'
                }}>
                  {videoEnabled ? '방송 중' : '비활성화'}
                </span>
              </div>
              <div>
                <strong>오디오:</strong> 
                <span style={{ 
                  color: audioEnabled ? '#28a745' : '#dc3545',
                  marginLeft: '5px'
                }}>
                  {audioEnabled ? '방송 중' : '비활성화'}
                </span>
              </div>
            </div>
          </div>

          {/* 방송 컨트롤 */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={stopBroadcast}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              방송 종료
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

export default BroadcastLiveScreen 