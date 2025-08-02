import { useState, useEffect } from 'react'
import RoomList from '../components/RoomList'
import { backendClient, type Room } from '../clients/backendClient'

interface LobbyPageProps {
  onNavigateToPublisher: () => void
  onNavigateToSubscriber: (room: Room) => void
  onNavigateToJoinRoom: (room: Room) => void
  onNavigateToCreateRoom: () => void
}

function LobbyPage({ onNavigateToPublisher, onNavigateToSubscriber, onNavigateToJoinRoom, onNavigateToCreateRoom }: LobbyPageProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRooms = async () => {
    try {
      setLoading(true)
      setError(null)

      // 백엔드 API 호출 - backendClient 사용
      const rooms = await backendClient.getRooms()
      setRooms(rooms)
    } catch (err) {
      console.error('Failed to fetch rooms:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch rooms')
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 방 목록 자동 로드
  useEffect(() => {
    fetchRooms()
  }, [])

  const handleJoinRoom = (room: Room) => {
    console.log('[LobbyPage] 방 입장 시도:', { roomName: room.name })
    onNavigateToJoinRoom(room)
  }

  const handleDeleteRoom = async (room: Room) => {
    if (window.confirm(`정말로 "${room.name}" 방을 삭제하시겠습니까?`)) {
      try {
        console.log('[LobbyPage] 방 삭제 시도:', { roomName: room.name })
        await backendClient.deleteRoom(room.name)
        console.log('[LobbyPage] 방 삭제 성공:', { roomName: room.name })

        // 방 목록 새로고침
        fetchRooms()
      } catch (error) {
        console.error('[LobbyPage] 방 삭제 실패:', error)
        alert(`방 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      }
    }
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>Conference Call 방 목록 ({rooms.length}개)</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onNavigateToCreateRoom}
            style={{
              padding: '8px 16px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create Room
          </button>
          <button
            onClick={onNavigateToPublisher}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            방송하기
          </button>
        </div>
      </div>

      <RoomList
        rooms={rooms}
        loading={loading}
        error={error}
        onRefresh={fetchRooms}
        onJoinRoom={handleJoinRoom}
        onDeleteRoom={handleDeleteRoom}
      />
    </div>
  )
}

export default LobbyPage 
