import { useState, useEffect } from 'react'
import type { Room } from '../clients/backendClient'
import RoomCard from './RoomCard'

interface RoomListProps {
  rooms: Room[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  onJoinRoom: (room: Room) => void
  onDeleteRoom?: (room: Room) => void
}

function RoomList({ rooms, loading, error, onRefresh, onJoinRoom, onDeleteRoom }: RoomListProps) {
  const [newRooms, setNewRooms] = useState<Set<string>>(new Set())

  // 새로 생성된 방을 추적
  useEffect(() => {
    const currentRoomNames = new Set(rooms.map(room => room.name))
    const previousRoomNames = new Set(Array.from(newRooms))

    // 새로 추가된 방들을 찾아서 표시
    const newlyAddedRooms = Array.from(currentRoomNames).filter(name => !previousRoomNames.has(name))

    if (newlyAddedRooms.length > 0) {
      setNewRooms(prev => new Set([...prev, ...newlyAddedRooms]))

      // 5초 후 NEW 표시 제거
      setTimeout(() => {
        setNewRooms(prev => {
          const updated = new Set(prev)
          newlyAddedRooms.forEach(name => updated.delete(name))
          return updated
        })
      }, 5000)
    }
  }, [rooms])

  if (loading) {
    return (
      <div className="loading">
        <p>방 목록을 불러오는 중...</p>
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
        <h3>현재 활성화된 방이 없습니다</h3>
        <p>새로운 방이 생성되면 여기에 표시됩니다.</p>
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
        <h2>활성화된 방 목록 ({rooms.length}개)</h2>
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
          <RoomCard
            key={room.name}
            room={room}
            onJoinRoom={onJoinRoom}
            onDeleteRoom={onDeleteRoom}
            isNewRoom={newRooms.has(room.name)}
          />
        ))}
      </div>
    </div>
  )
}

export default RoomList
