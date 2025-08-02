import { useState } from 'react'
import { CreateRoomForm } from '../components/forms'
import { backendClient } from '../clients/backendClient'
import HeaderNavigation from '../components/HeaderNavigation'

interface CreateRoomPageProps {
  onNavigateToLobby: () => void
}

function CreateRoomPage({ onNavigateToLobby }: CreateRoomPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFormSubmit = async (data: { roomName: string; creatorName: string }) => {
    setIsSubmitting(true)
    setError(null)

    try {
      console.log('[CreateRoomPage] 룸 생성 시작:', data)

      // 백엔드에서 룸 생성 요청
      await backendClient.createStream({
        metadata: {
          creator_identity: data.creatorName,
          title: data.roomName,
          description: data.roomName,
          type: 'video',
          isPrivate: false
        }
      })

      console.log('[CreateRoomPage] 룸 생성 성공')

      // 룸 생성 후 로비로 이동
      onNavigateToLobby()
    } catch (err) {
      console.error('[CreateRoomPage] 룸 생성 실패:', err)
      setError(err instanceof Error ? err.message : '룸 생성에 실패했습니다.')
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 공통 헤더 네비게이션 */}
      <HeaderNavigation
        onCreateRoom={() => console.log('방 만들기 (이미 방 생성 페이지에 있음)')}
        onNavigateToPublisher={() => console.log('Publisher 페이지로 이동 (아직 구현되지 않음)')}
      />

      {/* 메인 콘텐츠 */}
      <div style={{ flex: 1, padding: '20px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>새로운 방 생성</h2>
        </div>

        <CreateRoomForm
          onSubmit={handleFormSubmit}
          onBack={onNavigateToLobby}
          isSubmitting={isSubmitting}
        />

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
    </div>
  )
}

export default CreateRoomPage 
