import { Room } from '../types/Room'
import RoomCard from './RoomCard'

interface RoomListProps {
  rooms: Room[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}

function RoomList({ rooms, loading, error, onRefresh }: RoomListProps) {
  if (loading) {
    return (
      <div className="loading">
        <p>방송 리스트를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <p>오류가 발생했습니다: {error}</p>
        <button 
          onClick={onRefresh}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="empty-state">
        <h3>현재 진행 중인 방송이 없습니다</h3>
        <p>새로운 방송이 시작되면 여기에 표시됩니다.</p>
        <button 
          onClick={onRefresh}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          새로고침
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>현재 진행 중인 방송 ({rooms.length}개)</h2>
        <button 
          onClick={onRefresh}
          style={{
            padding: '8px 16px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          새로고침
        </button>
      </div>
      
      <div className="room-list">
        {rooms.map((room) => (
          <RoomCard key={room.sid} room={room} />
        ))}
      </div>
    </div>
  )
}

export default RoomList