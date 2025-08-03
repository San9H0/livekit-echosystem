import { useForm } from 'react-hook-form'
import { type Room } from '../../clients/backendClient'

interface ViewerFormData {
  viewerName: string
}

interface ViewerFormProps {
  room: Room
  onSubmit: (data: ViewerFormData) => void
  onBack: () => void
  isSubmitting?: boolean
}

function ViewerForm({ room, onSubmit, onBack, isSubmitting = false }: ViewerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ViewerFormData>({
    mode: 'onChange'
  })

  const getBroadcasterInfo = () => {
    if (!room.metadata) return null

    if (room.metadata.creator_identity) {
      return `방송자: ${room.metadata.creator_identity}`
    }

    if (room.metadata.title) {
      return `제목: ${room.metadata.title}`
    }

    return null
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 방 정보 */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px' }}>방 정보</h3>
        <p><strong>방 이름:</strong> {room.room_id}</p>
        {getBroadcasterInfo() && <p><strong>{getBroadcasterInfo()}</strong></p>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            시청자 이름:
          </label>
          <input
            {...register('viewerName', {
              required: '시청자 이름을 입력해주세요.',
              minLength: { value: 2, message: '시청자 이름은 2자 이상이어야 합니다.' }
            })}
            placeholder="시청자 이름을 입력하세요"
            style={{
              width: '100%',
              padding: '10px',
              border: errors.viewerName ? '1px solid #dc3545' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {errors.viewerName && (
            <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
              {errors.viewerName.message}
            </p>
          )}
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
            disabled={isSubmitting || !isValid}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting || !isValid ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || !isValid ? 0.7 : 1
            }}
          >
            {isSubmitting ? '방 참여 중...' : '방 참여'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default ViewerForm 
