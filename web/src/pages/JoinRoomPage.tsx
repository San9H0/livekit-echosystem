import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { type Room } from '../clients/backendClient'
import HeaderNavigation from '../components/HeaderNavigation'

interface JoinRoomPageProps {
  room: Room
  onNavigateToLobby: () => void
  onJoinRoom: (room: Room, userSettings: UserSettings) => void
}

export interface UserSettings {
  username: string
  mediaFile?: File
}

interface FormData {
  username: string
  mediaFile: FileList
}

function JoinRoomPage({ room, onNavigateToLobby, onJoinRoom }: JoinRoomPageProps) {
  const [mediaFile, setMediaFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      username: '',
    }
  })

  const onSubmit = (data: FormData) => {
    const userSettings: UserSettings = {
      username: data.username,
      mediaFile: mediaFile || undefined
    }
    onJoinRoom(room, userSettings)
  }

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMediaFile(file)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 공통 헤더 네비게이션 */}
      <HeaderNavigation
        onCreateRoom={() => console.log('방 만들기 (아직 구현되지 않음)')}
        onNavigateToPublisher={() => console.log('Publisher 페이지로 이동 (아직 구현되지 않음)')}
      />

      {/* 메인 콘텐츠 */}
      <div style={{ flex: 1, padding: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2>방 참가하기</h2>
          <button
            onClick={onNavigateToLobby}
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

        <form onSubmit={handleSubmit(onSubmit)} style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3>방 정보</h3>
            <p><strong>방 ID:</strong> {room.room_id}</p>
            <p><strong>참가자 수:</strong> {room.num_participants}명</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              사용자 이름 *
            </label>
            <input
              type="text"
              {...register('username', {
                required: '사용자 이름을 입력해주세요.',
                minLength: {
                  value: 2,
                  message: '사용자 이름은 2자 이상이어야 합니다.'
                },
                maxLength: {
                  value: 20,
                  message: '사용자 이름은 20자 이하여야 합니다.'
                }
              })}
              placeholder="사용자 이름을 입력하세요"
              style={{
                width: '100%',
                padding: '10px',
                border: errors.username ? '1px solid #e74c3c' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            {errors.username && (
              <p style={{ marginTop: '5px', fontSize: '12px', color: '#e74c3c' }}>
                {errors.username.message}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              미디어 파일
            </label>
            <input
              type="file"
              accept="video/*,audio/*"
              onChange={handleMediaFileChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            {mediaFile && (
              <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                선택된 파일: {mediaFile.name}
              </p>
            )}
            {!mediaFile && (
              <p style={{ marginTop: '5px', fontSize: '12px', color: '#e74c3c' }}>
                미디어를 활성화하려면 미디어 파일을 선택해주세요.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onNavigateToLobby}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!isValid || !mediaFile}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: (!isValid || !mediaFile) ? '#bdc3c7' : '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (!isValid || !mediaFile) ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              방 참가하기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default JoinRoomPage 
