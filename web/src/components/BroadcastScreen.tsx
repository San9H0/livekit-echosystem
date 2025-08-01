import { useState, useEffect, useRef } from 'react'
import { saveFileToDB, loadFileFromDB } from '../lib/indexedDB'
import { backendClient } from '../clients/backendClient'
import { Room, RoomEvent, LocalVideoTrack, LocalAudioTrack, createLocalVideoTrack, createLocalAudioTrack, Track } from 'livekit-client'

interface BroadcastScreenProps {
  onBack: () => void
}

interface HTMPCaptureableVideoElement extends HTMLVideoElement {
  captureStream(): MediaStream;
}

function BroadcastScreen({ onBack }: BroadcastScreenProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roomName, setRoomName] = useState('')
  const [broadcasterName, setBroadcasterName] = useState('')
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [savedVideoPath, setSavedVideoPath] = useState<string>('')
  
  const videoElementRef = useRef<HTMPCaptureableVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const roomRef = useRef<Room | null>(null)

  // localStorage 키들
  const STORAGE_KEYS = {
    VIDEO_FILE_NAME: 'livekit_video_file_name'
  }

  // 저장된 비디오 파일 정보 로드
  const loadSavedVideoInfo = async () => {
    try {
      const savedFileName = localStorage.getItem(STORAGE_KEYS.VIDEO_FILE_NAME)
      
      if (savedFileName) {
        setSavedVideoPath(savedFileName)
        console.log('저장된 비디오 파일 정보 로드됨:', { fileName: savedFileName })
        
        // IndexedDB에서 파일 복원
        const file = await loadFileFromDB(savedFileName)
        if (file) {
          setSelectedVideoFile(file)
          console.log('저장된 비디오 파일 복원됨:', file.name)
        } else {
          console.warn('저장된 파일을 복원할 수 없음, localStorage에서 제거')
          localStorage.removeItem(STORAGE_KEYS.VIDEO_FILE_NAME)
          setSavedVideoPath('')
        }
      }
    } catch (error) {
      console.warn('저장된 비디오 파일 정보 로드 실패:', error)
    }
  }

  // 비디오 파일 정보 저장
  const saveVideoInfo = async (file: File) => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIDEO_FILE_NAME, file.name)
      setSavedVideoPath(file.name)
      
      // IndexedDB에 파일 저장
      await saveFileToDB(file)
      
      console.log('비디오 파일 정보 저장됨:', file.name)
    } catch (error) {
      console.warn('비디오 파일 정보 저장 실패:', error)
    }
  }

  // 비디오 파일 선택 핸들러
  const handleVideoFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('비디오 파일 선택됨:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type
      })
      
      // 비디오 파일 검증
      if (!file.type.startsWith('video/')) {
        setError('비디오 파일만 선택할 수 있습니다.')
        return
      }
      
      setSelectedVideoFile(file)
      await saveVideoInfo(file)
      setError(null)
    }
  }

  // 파일 체크 함수
  const checkFileStatus = () => {
    console.log('[BroadcastScreen] 파일 상태 체크 시작...')
    
    if (selectedVideoFile) {
      console.log('[BroadcastScreen] 비디오 파일 선택됨:', selectedVideoFile.name)
    } else if (savedVideoPath) {
      console.log('[BroadcastScreen] 저장된 비디오 파일 있음:', savedVideoPath)
    } else {
      console.log('[BroadcastScreen] 비디오 파일이 선택되지 않음')
    }
  }

  const createMediaStream = async (selectedVideoFile: File) : Promise<MediaStream> => {
    return new Promise((resolve, reject) => {
      if (!videoElementRef.current) {
        reject(new Error('비디오 엘리먼트를 찾을 수 없습니다.'))
        return;
      }
      videoElementRef.current.src = URL.createObjectURL(selectedVideoFile)
      videoElementRef.current.muted = true
      videoElementRef.current.loop = true
      videoElementRef.current.playsInline = true
      videoElementRef.current.autoplay = true

      videoElementRef.current.onloadeddata = () => {
        console.log('[BroadcastScreen] 미리보기 비디오 데이터 로드 완료')
        const stream = videoElementRef.current!.captureStream();
        if (!stream) {
          return;
        }
        resolve(stream);
      }

      videoElementRef.current.load();
    })

  }

  const startBroadcast = async () => {
    if (!roomName.trim() || !broadcasterName.trim()) {
      setError('방 이름과 방송자 이름을 입력해주세요.')
      return
    }

    console.log('[BroadcastScreen] 방송 시작 프로세스 시작...')
    console.log('[BroadcastScreen] 방송 정보:', { roomName, broadcasterName, videoEnabled, audioEnabled })

    try {
      setIsConnecting(true)
      setError(null)

      // 0. 파일 상태 체크
      console.log('[BroadcastScreen] 파일 상태 체크...')
      checkFileStatus()

      // 비디오 파일이 선택되었는지 확인
      if (!selectedVideoFile) {
        throw new Error('비디오 파일을 선택해주세요.')
      }

      console.log('[BroadcastScreen] 비디오 파일 재생 시작:', selectedVideoFile.name)

      // 미리보기용 비디오 엘리먼트 설정
      try {

        if (videoElementRef.current) {
          // LiveKit 방 연결 및 스트리밍 시작
          console.log('[BroadcastScreen] LiveKit 방 연결 시작...')
          
          // 1. 백엔드에서 스트림 생성 요청
          const streamResponse = await backendClient.createStream({
            room_name: roomName,
            metadata: {
              creator_identity: broadcasterName,
              title: roomName,
              type: 'video'
            }
          })
          
          console.log('[BroadcastScreen] 스트림 생성 성공:', streamResponse)
          
          // 2. LiveKit 룸 생성
          console.log('[LiveKit] 룸 생성...')
          const room = new Room()
          roomRef.current = room
          
          // 3. 미디어 트랙 생성
          console.log('[BroadcastScreen] 미디어 트랙 생성 시작...')
          
          let videoTrack: LocalVideoTrack | null = null
          let audioTrack: LocalAudioTrack | null = null
          
          if (videoEnabled) {
            console.log('[BroadcastScreen] 비디오 파일로 트랙 생성 중...', selectedVideoFile.name)
            
            // 비디오 파일에서 MediaStream 생성 (사용자 함수 사용)
            const videoStream = await createMediaStream(selectedVideoFile)
            console.log('[BroadcastScreen] 비디오 파일에서 MediaStream 생성 완료')
            
            // MediaStream에서 LocalVideoTrack 생성
            videoTrack = new LocalVideoTrack(videoStream.getVideoTracks()[0])
            
            console.log('[BroadcastScreen] 비디오 파일 트랙 생성 성공')
            console.log('[BroadcastScreen] 비디오 트랙 정보:', {
              id: videoTrack.sid,
              kind: videoTrack.kind,
              source: videoTrack.source
            })
          }
          
          if (audioEnabled) {
            console.log('[BroadcastScreen] 오디오 트랙 생성 중...')
            audioTrack = await createLocalAudioTrack()
            console.log('[BroadcastScreen] 오디오 트랙 생성 성공')
          }
          
          console.log('[BroadcastScreen] 미디어 트랙 생성 완료: 비디오=' + !!videoTrack + ', 오디오=' + !!audioTrack)
          
          // 4. LiveKit 룸 연결
          console.log('[LiveKit] 룸 연결 중...')
          console.log('[BroadcastScreen] 연결 정보:', {
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
          }
          
          if (audioTrack) {
            console.log('[LiveKit] 오디오 트랙 발행 시작...')
            await room.localParticipant.publishTrack(audioTrack)
            console.log('[LiveKit] 오디오 트랙 발행 성공')
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
          console.log('[BroadcastScreen] 비디오 재생 시작 완료!')
        } else {
          throw new Error('비디오 엘리먼트를 찾을 수 없습니다.')
        }
      } catch (previewError) {
        console.error('[BroadcastScreen] 비디오 재생 실패:', previewError)
        throw new Error(`비디오 재생 실패: ${(previewError as Error).message}`)
      }

    } catch (err) {
      console.error('[BroadcastScreen] 방송 시작 실패:', err)
      console.error('[BroadcastScreen] 에러 스택:', (err as Error).stack)
      
      // 에러 타입별 상세 메시지
      let errorMessage = '방송 시작에 실패했습니다.'
      if (err instanceof Error) {
        errorMessage = `${err.name}: ${err.message}`
      }
      
      setError(errorMessage)
      setIsConnecting(false)
    }
  }

  // 비디오 파일에서 MediaStream 생성하는 함수


  const stopBroadcast = async () => {
    try {
      console.log('[BroadcastScreen] 방송 종료 시작')
      
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
        console.log('[BroadcastScreen] 미리보기 비디오 정리됨')
      }

      // 방송 상태 초기화
      setIsConnected(false)
      setIsConnecting(false)
      console.log('[BroadcastScreen] 방송 종료 완료')
    } catch (err) {
      console.error('[BroadcastScreen] 방송 종료 실패:', err)
      setError(err instanceof Error ? err.message : '방송 종료에 실패했습니다.')
    }
  }

  

  // 컴포넌트 마운트 시 저장된 비디오 정보 로드
  useEffect(() => {
          console.log('[BroadcastScreen] 컴포넌트 마운트됨')
    loadSavedVideoInfo()
    
    return () => {
      console.log('[BroadcastScreen] 컴포넌트 언마운트 - 리소스 정리 중...')
      
      // LiveKit 연결 정리
      if (roomRef.current) {
        roomRef.current.disconnect().catch(err => {
          console.error('[BroadcastScreen] LiveKit 연결 해제 실패:', err)
        })
        roomRef.current = null
        console.log('[BroadcastScreen] LiveKit 연결 정리됨')
      }
      
      // 미리보기 비디오 정리
      if (videoElementRef.current) {
        videoElementRef.current.pause()
        videoElementRef.current.src = ''
        videoElementRef.current.load()
        console.log('[BroadcastScreen] 미리보기 비디오 정리됨')
      }
    }
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>방송하기</h2>
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

      {!isConnected && !isConnecting && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              방 이름:
            </label>
            <input 
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="방 이름을 입력하세요"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              방송자 이름:
            </label>
            <input 
              type="text"
              value={broadcasterName}
              onChange={(e) => setBroadcasterName(e.target.value)}
              placeholder="방송자 이름을 입력하세요"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            {/* 비디오 파일 선택 */}
            <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>비디오 파일 선택</h4>
              
              <div style={{ marginTop: '10px' }}>
                <input 
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileSelect}
                  style={{ marginBottom: '8px' }}
                />
                {selectedVideoFile && (
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    선택된 파일: {selectedVideoFile.name} ({(selectedVideoFile.size / 1024 / 1024).toFixed(2)}MB)
                  </p>
                )}
                {savedVideoPath && !selectedVideoFile && (
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    저장된 파일: {savedVideoPath}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        marginLeft: '10px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      변경
                    </button>
                  </p>
                )}
              </div>
            </div>

            {/* 비디오 파일 정보 */}
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e8', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
              <p style={{ fontSize: '14px', margin: '0', color: '#155724' }}>
                선택된 비디오 파일로 방송됩니다
              </p>
            </div>
          </div>

          <button 
            onClick={startBroadcast}
            disabled={isConnecting || !roomName.trim() || !broadcasterName.trim() || (!selectedVideoFile && !savedVideoPath)}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isConnecting || !roomName.trim() || !broadcasterName.trim() || (!selectedVideoFile && !savedVideoPath) ? 'not-allowed' : 'pointer',
              opacity: isConnecting || !roomName.trim() || !broadcasterName.trim() || (!selectedVideoFile && !savedVideoPath) ? 0.7 : 1
            }}
          >
            {isConnecting ? '방송 시작 중...' : '방송 시작'}
          </button>
          
          {!selectedVideoFile && !savedVideoPath && (
            <p style={{ marginTop: '10px', color: '#f39c12', fontSize: '14px' }}>
              비디오 파일을 선택해주세요.
            </p>
          )}
        </div>
      )}

      {isConnecting && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>방송을 시작하는 중...</p>
        </div>
      )}

      {/* 비디오 미리보기 - 항상 렌더링 */}
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
          onPlay={() => console.log('[BroadcastScreen] 미리보기 비디오 재생 시작됨')}
          onPause={() => console.log('[BroadcastScreen] 미리보기 비디오 일시정지됨')}
          onEnded={() => console.log('[BroadcastScreen] 미리보기 비디오 종료됨')}
          onError={(e) => console.error('[BroadcastScreen] 미리보기 비디오 에러:', e)}
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

export default BroadcastScreen