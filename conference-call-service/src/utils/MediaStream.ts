interface HTMPCaptureableVideoElement extends HTMLVideoElement {
  captureStream(): MediaStream;
}

/**
 * 비디오 파일로부터 MediaStream을 생성하는 함수
 * @param selectedVideoFile - 선택된 비디오 파일
 * @param videoElementRef - 비디오 엘리먼트 ref
 * @returns Promise<MediaStream> - 생성된 MediaStream
 */
export const createMediaStreamFromFile = async (
  selectedVideoFile: File, 
  videoElementRef: React.RefObject<HTMPCaptureableVideoElement | null>
): Promise<MediaStream> => {
  return new Promise((resolve, reject) => {
    if (!videoElementRef.current) {
      reject(new Error('비디오 엘리먼트를 찾을 수 없습니다.'))
      return;
    }

    const videoElement = videoElementRef.current
    videoElement.src = URL.createObjectURL(selectedVideoFile)
    videoElement.muted = true
    videoElement.loop = true
    videoElement.playsInline = true
    videoElement.autoplay = true

    videoElement.onloadeddata = () => {
      console.log('[MediaStream] 미리보기 비디오 데이터 로드 완료')
      const stream = videoElement.captureStream();
      if (!stream) {
        reject(new Error('MediaStream을 생성할 수 없습니다.'))
        return;
      }
      resolve(stream);
    }

    videoElement.onerror = () => {
      reject(new Error('비디오 파일을 로드할 수 없습니다.'))
    }

    videoElement.load();
  })
}

/**
 * 비디오 파일로부터 캔버스를 통한 MediaStream을 생성하는 함수
 * @param videoFile - 비디오 파일
 * @param options - 옵션 설정
 * @returns Promise<MediaStream> - 생성된 MediaStream
 */
export const createCanvasMediaStream = async (
  videoFile: File,
  options: {
    width?: number
    height?: number
    fps?: number
  } = {}
): Promise<MediaStream> => {
  const { width = 640, height = 480, fps = 30 } = options

  return new Promise((resolve, reject) => {
    const videoElement = document.createElement('video')
    videoElement.src = URL.createObjectURL(videoFile)
    videoElement.loop = true
    videoElement.muted = true
    videoElement.autoplay = true
    
    // 비디오 로드 대기
    videoElement.onloadedmetadata = () => {
      // 캔버스에 비디오 렌더링
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = width
      canvas.height = height

      const stream = canvas.captureStream(fps)
      const videoTrack = stream.getVideoTracks()[0]

      // 비디오를 캔버스에 그리는 함수
      const drawVideo = () => {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
        requestAnimationFrame(drawVideo)
      }
      drawVideo()

      resolve(stream)
    }

    videoElement.onerror = () => {
      reject(new Error('비디오 파일을 로드할 수 없습니다.'))
    }

    videoElement.load()
  })
}

/**
 * 오디오 파일로부터 MediaStream을 생성하는 함수
 * @param audioFile - 오디오 파일
 * @returns Promise<MediaStream> - 생성된 MediaStream
 */
export const createAudioMediaStream = async (audioFile: File): Promise<MediaStream> => {
  return new Promise((resolve, reject) => {
    const audioElement = document.createElement('audio')
    audioElement.src = URL.createObjectURL(audioFile)
    audioElement.loop = true
    audioElement.autoplay = true
    
    // 오디오 로드 대기
    audioElement.onloadedmetadata = () => {
      // 오디오 컨텍스트 생성
      const audioContext = new AudioContext()
      const source = audioContext.createMediaElementSource(audioElement)
      const destination = audioContext.createMediaStreamDestination()
      source.connect(destination)
      source.connect(audioContext.destination) // 로컬에서도 들을 수 있도록

      const audioTrack = destination.stream.getAudioTracks()[0]
      if (!audioTrack) {
        reject(new Error('오디오 트랙을 생성할 수 없습니다.'))
        return
      }

      resolve(destination.stream)
    }

    audioElement.onerror = () => {
      reject(new Error('오디오 파일을 로드할 수 없습니다.'))
    }

    audioElement.load()
  })
}

export type { HTMPCaptureableVideoElement } 