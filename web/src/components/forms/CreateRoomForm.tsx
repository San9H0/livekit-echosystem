import { useForm } from 'react-hook-form'

interface CreateRoomFormData {
  roomName: string
  creatorName: string
}

interface CreateRoomFormProps {
  onSubmit: (data: CreateRoomFormData) => void
  onBack: () => void
  isSubmitting?: boolean
}

function CreateRoomForm({ onSubmit, onBack, isSubmitting = false }: CreateRoomFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<CreateRoomFormData>({
    mode: 'onChange'
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
            생성자 이름:
          </label>
          <input 
            {...register('creatorName', { 
              required: '생성자 이름을 입력해주세요.',
              minLength: { value: 2, message: '생성자 이름은 2자 이상이어야 합니다.' }
            })}
            placeholder="생성자 이름을 입력하세요"
            style={{
              width: '100%',
              padding: '10px',
              border: errors.creatorName ? '1px solid #dc3545' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {errors.creatorName && (
            <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
              {errors.creatorName.message}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e8f5e8', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
          <p style={{ fontSize: '14px', margin: '0', color: '#155724' }}>
            새로운 conference call 방을 생성합니다
          </p>
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
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting || !isValid ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || !isValid ? 0.7 : 1
            }}
          >
            {isSubmitting ? '방 생성 중...' : '방 생성'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default CreateRoomForm 