import { useState, useEffect } from 'react'
import type { Room } from '../clients/backendClient'
import RoomCard from './RoomCard'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

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
    const currentRoomNames = new Set(rooms.map(room => room.room_id))
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
      <div className="flex flex-col items-center justify-center py-12">
        <div className="loading-spinner mb-4"></div>
        <p className="text-lg text-gray-600">방 목록을 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-500 text-lg mb-4">오류가 발생했습니다: {error}</div>
        <Button onClick={onRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          다시 시도
        </Button>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">현재 활성화된 방이 없습니다</h3>
        <p className="text-gray-500 mb-6">새로운 방이 생성되면 여기에 표시됩니다.</p>
        <Button onClick={onRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          새로고침
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">활성화된 방 목록 ({rooms.length}개)</h2>
        <Button onClick={onRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          새로고침
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <RoomCard
            key={room.room_id}
            room={room}
            onJoinRoom={onJoinRoom}
            onDeleteRoom={onDeleteRoom}
            isNewRoom={newRooms.has(room.room_id)}
          />
        ))}
      </div>
    </div>
  )
}

export default RoomList
