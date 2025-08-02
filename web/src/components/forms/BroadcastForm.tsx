import { useForm } from 'react-hook-form'
import { useState, useEffect, useRef } from 'react'
import { saveFileToDB, loadFileFromDB } from '../../lib/indexedDB'

interface BroadcastFormData {
  roomName: string
  broadcasterName: string
}

interface BroadcastFormProps {
  onSubmit: (data: BroadcastFormData, selectedVideoFile: File) => void
  onBack: () => void
  isSubmitting?: boolean
}

function BroadcastForm({ onSubmit, onBack, isSubmitting = false }: BroadcastFormProps) {
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [savedVideoPath, setSavedVideoPath] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<BroadcastFormData>({
    mode: 'onChange'
  })

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

  // 폼 제출 핸들러
  const onFormSubmit = (data: BroadcastFormData) => {
    if (!selectedVideoFile) {
      setError('비디오 파일을 선택해주세요.')
      return
    }

    onSubmit(data, selectedVideoFile)
  }

  // 컴포넌트 마운트 시 저장된 비디오 정보 로드
  useEffect(() => {
    console.log('[BroadcastForm] 컴포넌트 마운트됨')
    loadSavedVideoInfo()
  }, [])

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            방 이름:
          </label>
          <input 
            {...register('roomName', { 
              required: '방 이름을 입력해주세요.',
              minLength: { value: 2, message: '방 이름은 2자 이상이어야 합니다.' }
            })}
            placeholder="방 이름을 입력하세요"
            style={{
              width: '100%',
              padding: '10px',
              border: errors.roomName ? '1px solid #dc3545' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {errors.roomName && (
            <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
              {errors.roomName.message}
            </p>
          )}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            방송자 이름:
          </label>
          <input 
            {...register('broadcasterName', { 
              required: '방송자 이름을 입력해주세요.',
              minLength: { value: 2, message: '방송자 이름은 2자 이상이어야 합니다.' }
            })}
            placeholder="방송자 이름을 입력하세요"
            style={{
              width: '100%',
              padding: '10px',
              border: errors.broadcasterName ? '1px solid #dc3545' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {errors.broadcasterName && (
            <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
              {errors.broadcasterName.message}
            </p>
          )}
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
                    type="button"
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

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button"
            onClick={onBack}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            뒤로가기
          </button>
          
          <button 
            type="submit"
            disabled={isSubmitting || !isValid || (!selectedVideoFile && !savedVideoPath)}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting || !isValid || (!selectedVideoFile && !savedVideoPath) ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || !isValid || (!selectedVideoFile && !savedVideoPath) ? 0.7 : 1
            }}
          >
            {isSubmitting ? '방송 시작 중...' : '방송 시작'}
          </button>
        </div>
        
        {!selectedVideoFile && !savedVideoPath && (
          <p style={{ marginTop: '10px', color: '#f39c12', fontSize: '14px' }}>
            비디오 파일을 선택해주세요.
          </p>
        )}
      </div>

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
    </form>
  )
}

export default BroadcastForm 