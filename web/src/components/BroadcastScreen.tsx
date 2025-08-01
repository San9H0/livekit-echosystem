import { useState, useEffect, useRef } from 'react'
import { Room, RoomEvent, LocalVideoTrack, LocalAudioTrack, createLocalVideoTrack, createLocalAudioTrack } from 'livekit-client'

interface BroadcastScreenProps {
  onBack: () => void
}

function BroadcastScreen({ onBack }: BroadcastScreenProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roomName, setRoomName] = useState('')
  const [broadcasterName, setBroadcasterName] = useState('')
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [useVideoFile, setUseVideoFile] = useState(false)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [savedVideoPath, setSavedVideoPath] = useState<string>('')
  const [deviceStatus, setDeviceStatus] = useState({
    hasCamera: false,
    hasMicrophone: false,
    cameraPermission: 'unknown' as 'granted' | 'denied' | 'prompt' | 'unknown',
    microphonePermission: 'unknown' as 'granted' | 'denied' | 'prompt' | 'unknown',
    devices: [] as MediaDeviceInfo[]
  })
  
  const roomRef = useRef<Room | null>(null)
  const videoTrackRef = useRef<LocalVideoTrack | null>(null)
  const audioTrackRef = useRef<LocalAudioTrack | null>(null)
  const videoElementRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // localStorage 키들
  const STORAGE_KEYS = {
    VIDEO_FILE_NAME: 'livekit_video_file_name',
    VIDEO_FILE_PATH: 'livekit_video_file_path',
    USE_VIDEO_FILE: 'livekit_use_video_file'
  }

  // 저장된 비디오 파일 정보 로드
  const loadSavedVideoInfo = () => {
    try {
      const savedFileName = localStorage.getItem(STORAGE_KEYS.VIDEO_FILE_NAME)
      const savedFilePath = localStorage.getItem(STORAGE_KEYS.VIDEO_FILE_PATH)
      const useFile = localStorage.getItem(STORAGE_KEYS.USE_VIDEO_FILE) === 'true'
      
      if (savedFileName && savedFilePath) {
        setSavedVideoPath(savedFileName)
        setUseVideoFile(useFile)
        console.log('📁 저장된 비디오 파일 정보 로드됨:', { fileName: savedFileName, useFile })
      }
    } catch (error) {
      console.warn('⚠️ 저장된 비디오 파일 정보 로드 실패:', error)
    }
  }

  // 비디오 파일 정보 저장
  const saveVideoInfo = (file: File) => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIDEO_FILE_NAME, file.name)
      localStorage.setItem(STORAGE_KEYS.VIDEO_FILE_PATH, URL.createObjectURL(file))
      localStorage.setItem(STORAGE_KEYS.USE_VIDEO_FILE, 'true')
      setSavedVideoPath(file.name)
      console.log('💾 비디오 파일 정보 저장됨:', file.name)
    } catch (error) {
      console.warn('⚠️ 비디오 파일 정보 저장 실패:', error)
    }
  }

  // 비디오 파일 선택 핸들러
  const handleVideoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('📄 비디오 파일 선택됨:', {
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
      saveVideoInfo(file)
      setUseVideoFile(true)
      setError(null)
    }
  }

  // 비디오 파일에서 MediaStream 생성
  const createVideoStreamFromFile = async (file: File): Promise<MediaStream> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.src = URL.createObjectURL(file)
      video.muted = true
      video.loop = true
      video.playsInline = true
      
      video.onloadedmetadata = () => {
        console.log('📹 비디오 파일 메타데이터 로드됨:', {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        })
        
        video.play().then(() => {
          // video 엘리먼트를 캔버스로 스트리밍
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          canvas.width = video.videoWidth || 1280
          canvas.height = video.videoHeight || 720
          
          const stream = canvas.captureStream(30) // 30 FPS
          
          const drawFrame = () => {
            if (video.paused || video.ended) return
            
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
            requestAnimationFrame(drawFrame)
          }
          drawFrame()
          
          console.log('✅ 비디오 파일에서 MediaStream 생성 완료')
          resolve(stream)
        }).catch(reject)
      }
      
      video.onerror = () => {
        reject(new Error('비디오 파일을 로드할 수 없습니다.'))
      }
    })
  }

  // 미디어 디바이스 체크 함수
  const checkMediaDevices = async () => {
    console.log('🔍 미디어 디바이스 체크 시작...')
    
    try {
      // 1. 미디어 디바이스 목록 가져오기
      const devices = await navigator.mediaDevices.enumerateDevices()
      console.log('📱 감지된 디바이스들:', devices)
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      const audioDevices = devices.filter(device => device.kind === 'audioinput')
      
      console.log('🎥 비디오 디바이스 수:', videoDevices.length)
      console.log('🎤 오디오 디바이스 수:', audioDevices.length)
      
      videoDevices.forEach((device, index) => {
        console.log(`📹 비디오 디바이스 ${index + 1}:`, {
          deviceId: device.deviceId,
          label: device.label || 'Unknown Camera',
          groupId: device.groupId
        })
      })
      
      audioDevices.forEach((device, index) => {
        console.log(`🎤 오디오 디바이스 ${index + 1}:`, {
          deviceId: device.deviceId,
          label: device.label || 'Unknown Microphone',
          groupId: device.groupId
        })
      })

      // 2. 권한 상태 체크
      let cameraPermission: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown'
      let microphonePermission: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown'

      try {
        if (navigator.permissions) {
          const cameraResult = await navigator.permissions.query({ name: 'camera' as PermissionName })
          const micResult = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          
          cameraPermission = cameraResult.state as 'granted' | 'denied' | 'prompt'
          microphonePermission = micResult.state as 'granted' | 'denied' | 'prompt'
          
          console.log('🔐 카메라 권한 상태:', cameraPermission)
          console.log('🔐 마이크 권한 상태:', microphonePermission)
        }
      } catch (permErr) {
        console.warn('⚠️ 권한 상태 체크 실패:', permErr)
      }

      setDeviceStatus({
        hasCamera: videoDevices.length > 0,
        hasMicrophone: audioDevices.length > 0,
        cameraPermission,
        microphonePermission,
        devices
      })

      // 3. 미디어 스트림 테스트 (권한 요청 포함)
      await testMediaAccess()

    } catch (error) {
      console.error('❌ 미디어 디바이스 체크 실패:', error)
      setError(`디바이스 체크 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  // 미디어 접근 테스트 함수
  const testMediaAccess = async () => {
    console.log('🧪 미디어 접근 테스트 시작...')
    
    // 비디오 테스트
    if (deviceStatus.hasCamera || videoEnabled) {
      try {
        console.log('📷 카메라 접근 테스트 중...')
        
        // 기본 카메라 테스트
        let videoStream: MediaStream | null = null
        try {
          videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            } 
          })
          console.log('✅ 카메라 접근 성공 (기본 설정)')
          console.log('📊 비디오 트랙 설정:', videoStream.getVideoTracks()[0].getSettings())
        } catch (err) {
          console.log('⚠️ 기본 카메라 설정 실패, 다른 설정으로 재시도...')
          
          // 더 낮은 해상도로 재시도
          try {
            videoStream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                width: { ideal: 640 },
                height: { ideal: 480 }
              } 
            })
            console.log('✅ 카메라 접근 성공 (낮은 해상도)')
            console.log('📊 비디오 트랙 설정:', videoStream.getVideoTracks()[0].getSettings())
          } catch (err2) {
            console.log('⚠️ 낮은 해상도도 실패, 최소 설정으로 재시도...')
            
            // 최소 설정으로 재시도
            try {
              videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: true 
              })
              console.log('✅ 카메라 접근 성공 (최소 설정)')
              console.log('📊 비디오 트랙 설정:', videoStream.getVideoTracks()[0].getSettings())
            } catch (err3) {
              throw err3 // 모든 시도 실패
            }
          }
        }
        
        videoStream?.getTracks().forEach(track => track.stop()) // 테스트 후 정리
        
      } catch (videoError) {
        console.error('❌ 카메라 접근 실패 (모든 설정):', videoError)
        console.error('카메라 에러 상세:', {
          name: (videoError as Error).name,
          message: (videoError as Error).message,
          constraint: (videoError as any).constraint
        })
        
        // NotReadableError에 대한 추가 진단
        if ((videoError as Error).name === 'NotReadableError') {
          console.log('🔍 NotReadableError 상세 진단:')
          console.log('- 다른 앱(Zoom, Teams, OBS 등)에서 카메라를 사용 중일 수 있습니다')
          console.log('- 카메라 드라이버 문제일 수 있습니다')
          console.log('- 하드웨어 카메라가 물리적으로 비활성화되었을 수 있습니다')
          console.log('- 시스템에서 카메라 접근을 차단했을 수 있습니다')
          
          // 사용 중인 미디어 트랙 확인
          navigator.mediaDevices.enumerateDevices().then(devices => {
            const videoDevices = devices.filter(d => d.kind === 'videoinput')
            console.log('🔍 사용 가능한 카메라 디바이스들:')
            videoDevices.forEach((device, index) => {
              console.log(`  ${index + 1}. ${device.label || 'Unknown Camera'} (${device.deviceId.substring(0, 8)}...)`)
            })
          })
        }
      }
    }

    // 오디오 테스트  
    if (deviceStatus.hasMicrophone || audioEnabled) {
      try {
        console.log('🎙️ 마이크 접근 테스트 중...')
        const audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        })
        console.log('✅ 마이크 접근 성공')
        console.log('📊 오디오 트랙 설정:', audioStream.getAudioTracks()[0].getSettings())
        audioStream.getTracks().forEach(track => track.stop()) // 테스트 후 정리
      } catch (audioError) {
        console.error('❌ 마이크 접근 실패:', audioError)
        console.error('마이크 에러 상세:', {
          name: (audioError as Error).name,
          message: (audioError as Error).message,
          constraint: (audioError as any).constraint
        })
      }
    }
  }

  const startBroadcast = async () => {
    if (!roomName.trim() || !broadcasterName.trim()) {
      setError('방 이름과 방송자 이름을 입력해주세요.')
      return
    }

    console.log('🚀 방송 시작 프로세스 시작...')
    console.log('📝 방송 정보:', { roomName, broadcasterName, videoEnabled, audioEnabled })

    try {
      setIsConnecting(true)
      setError(null)

      // 0. 미디어 디바이스 사전 체크
      console.log('🔍 미디어 디바이스 사전 체크...')
      await checkMediaDevices()

      // 1. 백엔드에서 방송용 스트림 생성
      console.log('🏗️ 백엔드 스트림 생성 요청...')
      const createStreamResponse = await fetch('http://localhost:8080/api/create_stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_name: roomName,
          metadata: {
            creator_identity: broadcasterName,
            title: `${broadcasterName}의 방송`,
            type: 'live_broadcast'
          }
        })
      })

      if (!createStreamResponse.ok) {
        const errorText = await createStreamResponse.text()
        console.error('❌ 스트림 생성 실패:', createStreamResponse.status, errorText)
        throw new Error(`Failed to create stream: ${createStreamResponse.status} - ${errorText}`)
      }

      const streamData = await createStreamResponse.json()
      console.log('✅ 스트림 생성 성공:', streamData)
      
      // 2. LiveKit 룸 생성 및 연결
      console.log('🏠 LiveKit 룸 생성...')
      const room = new Room()
      roomRef.current = room

      // 룸 이벤트 리스너
      room.on(RoomEvent.Connected, () => {
        console.log('✅ 룸 연결 성공 - 방송 시작됨')
        setIsConnected(true)
        setIsConnecting(false)
      })

      room.on(RoomEvent.Disconnected, () => {
        console.log('🔌 룸 연결 해제 - 방송 종료됨')
        setIsConnected(false)
        setIsConnecting(false)
      })

      room.on(RoomEvent.TrackPublished, (publication, participant) => {
        console.log('📡 트랙 발행됨:', { trackSid: publication.trackSid, participant: participant.identity, kind: publication.kind })
      })

      room.on(RoomEvent.TrackPublishFailed, (error, track) => {
        console.error('❌ 트랙 발행 실패:', { error, trackKind: track.kind })
      })

      // 3. 카메라 및 마이크 트랙 생성
      console.log('🎥 미디어 트랙 생성 시작...')
      
      let videoTrackCreated = false
      if (videoEnabled) {
        try {
          if (useVideoFile && selectedVideoFile) {
            // 비디오 파일 사용
            console.log('📄 비디오 파일로 트랙 생성 중...', selectedVideoFile.name)
            
            const videoStream = await createVideoStreamFromFile(selectedVideoFile)
            const videoTrack = videoStream.getVideoTracks()[0]
            
            if (videoTrack) {
              // Canvas 캡처 트랙을 새로운 MediaStream으로 래핑
              const mediaStream = new MediaStream([videoTrack])
              
              // MediaStream을 사용하여 LocalVideoTrack 생성
              videoTrackRef.current = await createLocalVideoTrack({
                video: { 
                  mediaStream: mediaStream
                }
              })
              
              console.log('✅ 비디오 파일 트랙 생성 성공')
              console.log('📊 비디오 트랙 설정:', videoTrackRef.current.mediaStreamTrack.getSettings())
              videoTrackCreated = true
              
              // 로컬 비디오 미리보기
              if (videoElementRef.current && videoTrackRef.current) {
                videoTrackRef.current.attach(videoElementRef.current)
                console.log('📺 비디오 파일 미리보기 연결됨')
              }
            } else {
              throw new Error('비디오 파일에서 비디오 트랙을 가져올 수 없습니다.')
            }
          } else {
            // 카메라 사용
            console.log('📷 카메라로 비디오 트랙 생성 중...')
            
            // 여러 설정으로 카메라 트랙 생성 시도
            let videoTrackOptions = [
              // 1. 기본 고해상도 설정
              {
                resolution: { width: 1280, height: 720 },
                facingMode: 'user'
              },
              // 2. 낮은 해상도 설정
              {
                resolution: { width: 640, height: 480 },
                facingMode: 'user'
              },
              // 3. 최소 설정 (해상도 지정 없음)
              {
                facingMode: 'user'
              },
              // 4. 매우 기본적인 설정
              {}
            ]
            
            let videoTrackError: Error | null = null
            for (let i = 0; i < videoTrackOptions.length; i++) {
              try {
                console.log(`📷 비디오 트랙 생성 시도 ${i + 1}/${videoTrackOptions.length}:`, videoTrackOptions[i])
                videoTrackRef.current = await createLocalVideoTrack(videoTrackOptions[i])
                console.log('✅ 카메라 비디오 트랙 생성 성공')
                console.log('📊 비디오 트랙 설정:', videoTrackRef.current.mediaStreamTrack.getSettings())
                videoTrackCreated = true
                
                // 로컬 비디오 미리보기
                if (videoElementRef.current && videoTrackRef.current) {
                  videoTrackRef.current.attach(videoElementRef.current)
                  console.log('📺 카메라 미리보기 연결됨')
                }
                break // 성공하면 루프 종료
              } catch (err) {
                videoTrackError = err as Error
                console.log(`⚠️ 비디오 트랙 생성 시도 ${i + 1} 실패:`, err)
              }
            }
            
            if (!videoTrackCreated) {
              throw videoTrackError || new Error('모든 비디오 설정으로 카메라 접근 실패')
            }
          }
          
        } catch (videoError) {
          console.error('❌ 비디오 트랙 생성 실패 (모든 시도):', videoError)
          console.error('비디오 에러 상세:', {
            name: (videoError as Error).name,
            message: (videoError as Error).message,
            constraint: (videoError as any).constraint
          })
          
          // NotReadableError 상세 가이드
          if ((videoError as Error).name === 'NotReadableError') {
            console.log('🔧 NotReadableError 해결 방법:')
            console.log('1. 다른 앱(Zoom, Teams, Skype, OBS 등)을 종료하세요')
            console.log('2. 브라우저를 완전히 종료하고 다시 시작하세요')
            console.log('3. 카메라 드라이버를 업데이트하세요')
            console.log('4. 시스템을 재부팅하세요')
            console.log('5. 카메라가 물리적으로 차단되지 않았는지 확인하세요')
          }
          
          // 카메라 실패 시에도 오디오만으로 계속 진행
          console.log('⚠️ 비디오를 사용할 수 없지만 오디오만으로 방송을 계속 진행합니다...')
          setError(`비디오 접근 실패: ${(videoError as Error).message} - 오디오만으로 방송을 진행합니다.`)
        }
      }

      let audioTrackCreated = false
      if (audioEnabled) {
        try {
          console.log('🎤 오디오 트랙 생성 중...')
          audioTrackRef.current = await createLocalAudioTrack({
            echoCancellation: true,
            noiseSuppression: true,
          })
          console.log('✅ 오디오 트랙 생성 성공')
          console.log('📊 오디오 트랙 설정:', audioTrackRef.current.mediaStreamTrack.getSettings())
          audioTrackCreated = true
        } catch (audioError) {
          console.error('❌ 오디오 트랙 생성 실패:', audioError)
          console.error('오디오 에러 상세:', {
            name: (audioError as Error).name,
            message: (audioError as Error).message,
            constraint: (audioError as any).constraint
          })
          
          // 오디오도 실패한 경우, 비디오가 있으면 계속 진행
          if (videoTrackCreated) {
            console.log('⚠️ 마이크를 사용할 수 없지만 비디오만으로 방송을 계속 진행합니다...')
            setError(`마이크 접근 실패: ${(audioError as Error).message} - 비디오만으로 방송을 진행합니다.`)
          } else {
            // 비디오와 오디오 모두 실패한 경우에만 방송 중단
            throw new Error(`마이크와 카메라 모두 접근할 수 없습니다: ${(audioError as Error).message}`)
          }
        }
      }

      // 비디오와 오디오 모두 실패한 경우 확인
      if (!videoTrackCreated && !audioTrackCreated) {
        throw new Error('비디오와 오디오 모두 사용할 수 없어 방송을 시작할 수 없습니다.')
      }

      console.log(`📊 미디어 트랙 생성 완료: 비디오=${videoTrackCreated}, 오디오=${audioTrackCreated}`)

      // 4. 룸에 연결
      console.log('🔗 LiveKit 룸 연결 중...')
      console.log('연결 정보:', {
        wsUrl: streamData.connection_details.ws_url,
        tokenLength: streamData.connection_details.token.length
      })
      
      await room.connect(streamData.connection_details.ws_url, streamData.connection_details.token)
      console.log('✅ 룸 연결 완료')

      // 5. 트랙 발행
      console.log('📡 트랙 발행 시작...')
      
      let publishedTracks = 0
      
      if (videoTrackRef.current) {
        try {
          console.log('📹 비디오 트랙 발행 중...')
          await room.localParticipant.publishTrack(videoTrackRef.current)
          console.log('✅ 비디오 트랙 발행 완료')
          publishedTracks++
        } catch (publishError) {
          console.error('❌ 비디오 트랙 발행 실패:', publishError)
        }
      }
      
      if (audioTrackRef.current) {
        try {
          console.log('🎙️ 오디오 트랙 발행 중...')
          await room.localParticipant.publishTrack(audioTrackRef.current)
          console.log('✅ 오디오 트랙 발행 완료')
          publishedTracks++
        } catch (publishError) {
          console.error('❌ 오디오 트랙 발행 실패:', publishError)
        }
      }

      console.log(`📊 트랙 발행 완료: ${publishedTracks}개 트랙 발행됨`)
      console.log('🎉 방송 시작 프로세스 완료!')
      
      if (publishedTracks === 0) {
        throw new Error('어떤 미디어 트랙도 발행할 수 없습니다.')
      }

    } catch (err) {
      console.error('❌ 방송 시작 실패:', err)
      console.error('에러 스택:', (err as Error).stack)
      
      // 에러 타입별 상세 메시지
      let errorMessage = '방송 시작에 실패했습니다.'
      if (err instanceof Error) {
        if (err.name === 'NotReadableError') {
          errorMessage = '카메라에 접근할 수 없습니다. 다른 앱에서 카메라를 사용 중이거나 카메라가 연결되지 않았을 수 있습니다.'
        } else if (err.name === 'NotAllowedError') {
          errorMessage = '카메라 또는 마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.'
        } else if (err.name === 'NotFoundError') {
          errorMessage = '카메라 또는 마이크가 발견되지 않았습니다. 디바이스가 연결되어 있는지 확인해주세요.'
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = '요청한 미디어 설정을 지원하지 않습니다. 다른 설정으로 시도해보세요.'
        } else {
          errorMessage = `${err.name}: ${err.message}`
        }
      }
      
      setError(errorMessage)
      setIsConnecting(false)
      
      // 실패 시 트랙 정리
      if (videoTrackRef.current) {
        videoTrackRef.current.stop()
        videoTrackRef.current = null
        console.log('🧹 비디오 트랙 정리됨')
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.stop()
        audioTrackRef.current = null
        console.log('🧹 오디오 트랙 정리됨')
      }
    }
  }

  const stopBroadcast = async () => {
    try {
      // 트랙 정리
      if (videoTrackRef.current) {
        videoTrackRef.current.stop()
        videoTrackRef.current = null
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.stop()
        audioTrackRef.current = null
      }

      // 룸 연결 해제
      if (roomRef.current) {
        await roomRef.current.disconnect()
        roomRef.current = null
      }

      setIsConnected(false)
      setIsConnecting(false)
    } catch (err) {
      console.error('방송 종료 실패:', err)
      setError(err instanceof Error ? err.message : '방송 종료에 실패했습니다.')
    }
  }

  const toggleVideo = async () => {
    if (!videoTrackRef.current) return
    
    if (videoEnabled) {
      await videoTrackRef.current.mute()
    } else {
      await videoTrackRef.current.unmute()
    }
    setVideoEnabled(!videoEnabled)
  }

  const toggleAudio = async () => {
    if (!audioTrackRef.current) return
    
    if (audioEnabled) {
      await audioTrackRef.current.mute()
    } else {
      await audioTrackRef.current.unmute()
    }
    setAudioEnabled(!audioEnabled)
  }

  // 컴포넌트 마운트 시 미디어 디바이스 체크 및 저장된 비디오 정보 로드
  useEffect(() => {
    console.log('🎬 BroadcastScreen 컴포넌트 마운트됨')
    loadSavedVideoInfo()
    checkMediaDevices()
    
    return () => {
      console.log('🧹 BroadcastScreen 컴포넌트 언마운트 - 리소스 정리 중...')
      if (videoTrackRef.current) {
        videoTrackRef.current.stop()
        console.log('🧹 비디오 트랙 정리됨')
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.stop()
        console.log('🧹 오디오 트랙 정리됨')
      }
      if (roomRef.current) {
        roomRef.current.disconnect()
        console.log('🧹 룸 연결 해제됨')
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
          {/* 디바이스 상태 표시 */}
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #dee2e6', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>🔍 디바이스 상태</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
              <div>
                <strong>카메라:</strong> {deviceStatus.hasCamera ? '✅ 감지됨' : '❌ 없음'}
                <br />
                <small>권한: {deviceStatus.cameraPermission}</small>
              </div>
              <div>
                <strong>마이크:</strong> {deviceStatus.hasMicrophone ? '✅ 감지됨' : '❌ 없음'}
                <br />
                <small>권한: {deviceStatus.microphonePermission}</small>
              </div>
            </div>
            <button 
              onClick={checkMediaDevices}
              style={{
                marginTop: '10px',
                padding: '5px 15px',
                fontSize: '12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              디바이스 다시 체크
            </button>
          </div>

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
            {/* 비디오 소스 선택 */}
            <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>📹 비디오 소스 선택</h4>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <input 
                    type="radio"
                    name="videoSource"
                    checked={!useVideoFile}
                    onChange={() => setUseVideoFile(false)}
                    style={{ marginRight: '8px' }}
                  />
                  카메라 사용 {!deviceStatus.hasCamera && '(카메라 없음)'}
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <input 
                    type="radio"
                    name="videoSource"
                    checked={useVideoFile}
                    onChange={() => setUseVideoFile(true)}
                    style={{ marginRight: '8px' }}
                  />
                  비디오 파일 사용
                </label>
              </div>
              
              {useVideoFile && (
                <div style={{ marginLeft: '24px', marginTop: '10px' }}>
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
              )}
            </div>

            {/* 비디오 활성화 체크박스 */}
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <input 
                type="checkbox"
                checked={videoEnabled}
                onChange={(e) => setVideoEnabled(e.target.checked)}
                style={{ marginRight: '8px' }}
                disabled={!useVideoFile && !deviceStatus.hasCamera}
              />
              비디오 사용 {!useVideoFile && !deviceStatus.hasCamera && '(카메라 없음)'}
            </label>
            
            {/* 오디오 활성화 체크박스 */}
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                style={{ marginRight: '8px' }}
                disabled={!deviceStatus.hasMicrophone}
              />
              마이크 사용 {!deviceStatus.hasMicrophone && '(마이크 없음)'}
            </label>
          </div>

          <button 
            onClick={startBroadcast}
            disabled={isConnecting || !roomName.trim() || !broadcasterName.trim()}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isConnecting || !roomName.trim() || !broadcasterName.trim() ? 'not-allowed' : 'pointer',
              opacity: isConnecting || !roomName.trim() || !broadcasterName.trim() ? 0.7 : 1
            }}
          >
            {isConnecting ? '방송 시작 중...' : '방송 시작'}
          </button>
          
          {(!deviceStatus.hasCamera && !deviceStatus.hasMicrophone) && (
            <p style={{ marginTop: '10px', color: '#f39c12', fontSize: '14px' }}>
              ⚠️ 카메라와 마이크가 모두 감지되지 않았습니다. 방송 시작 시 사용 가능한 디바이스로 자동 설정됩니다.
            </p>
          )}
          
          {(deviceStatus.hasCamera && !deviceStatus.hasMicrophone) && (
            <p style={{ marginTop: '10px', color: '#3498db', fontSize: '14px' }}>
              ℹ️ 카메라만 사용 가능합니다. 비디오 전용 방송이 됩니다.
            </p>
          )}
          
          {(!deviceStatus.hasCamera && deviceStatus.hasMicrophone) && (
            <p style={{ marginTop: '10px', color: '#3498db', fontSize: '14px' }}>
              ℹ️ 마이크만 사용 가능합니다. 오디오 전용 방송이 됩니다.
            </p>
          )}
        </div>
      )}

      {isConnecting && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>방송을 시작하는 중...</p>
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
            <strong>🔴 방송 중</strong> - 방: {roomName}
          </div>

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
                borderRadius: '8px'
              }}
            />
          </div>

          {/* 방송 컨트롤 */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={toggleVideo}
              style={{
                padding: '10px 20px',
                backgroundColor: videoEnabled ? '#2ecc71' : '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {videoEnabled ? '🎥 카메라 ON' : '🎥 카메라 OFF'}
            </button>
            
            <button 
              onClick={toggleAudio}
              style={{
                padding: '10px 20px',
                backgroundColor: audioEnabled ? '#2ecc71' : '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {audioEnabled ? '🎤 마이크 ON' : '🎤 마이크 OFF'}
            </button>
            
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