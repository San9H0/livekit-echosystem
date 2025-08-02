import { useState } from 'react'
import { BroadcastForm } from './forms'

interface BroadcastSetupScreenProps {
  onStartBroadcast: (roomName: string, broadcasterName: string, selectedVideoFile: File) => void
  onBack: () => void
}

function BroadcastSetupScreen({ onStartBroadcast, onBack }: BroadcastSetupScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFormSubmit = async (data: { roomName: string; broadcasterName: string }, selectedVideoFile: File) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await onStartBroadcast(data.roomName, data.broadcasterName, selectedVideoFile)
    } catch (err) {
      console.error('[BroadcastSetupScreen] 방송 시작 실패:', err)
      setError(err instanceof Error ? err.message : '방송 시작에 실패했습니다.')
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>방송 설정</h2>
      </div>

      <BroadcastForm 
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

export default BroadcastSetupScreen 