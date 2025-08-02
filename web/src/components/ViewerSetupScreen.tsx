import { useState } from 'react'
import { ViewerForm } from './forms'
import { type Room } from '../clients/backendClient'

interface ViewerSetupScreenProps {
  room: Room
  onJoinRoom: (viewerName: string) => void
  onBack: () => void
}

function ViewerSetupScreen({ room, onJoinRoom, onBack }: ViewerSetupScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFormSubmit = async (data: { viewerName: string }) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await onJoinRoom(data.viewerName)
    } catch (err) {
      console.error('[ViewerSetupScreen] 방 참여 실패:', err)
      setError(err instanceof Error ? err.message : '방 참여에 실패했습니다.')
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>시청 설정</h2>
      </div>

      <ViewerForm
        room={room}
        onSubmit={handleFormSubmit}
        onBack={onBack}
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
  )
}

export default ViewerSetupScreen 
