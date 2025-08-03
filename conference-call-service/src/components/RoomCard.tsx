import type { Room } from '../clients/backendClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface RoomCardProps {
  room: Room
  onJoinRoom: (room: Room) => void
  onDeleteRoom?: (room: Room) => void
  isNewRoom?: boolean
}

function RoomCard({ room, onJoinRoom, onDeleteRoom, isNewRoom = false }: RoomCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('ko-KR')
  }

  const handleJoinRoom = () => {
    console.log('[LiveKit] 방 입장 시도:', {
      roomName: room.room_id,
      participantCount: room.num_participants,
      maxParticipants: room.max_participants,
      metadata: room.metadata
    })
    onJoinRoom(room)
  }

  const handleDeleteRoom = (e: React.MouseEvent) => {
    e.stopPropagation() // 카드 클릭 이벤트 전파 방지
    if (onDeleteRoom) {
      console.log('[RoomCard] 방 삭제 시도:', { roomName: room.room_id })
      onDeleteRoom(room)
    }
  }

  const getMetadataDisplay = () => {
    if (!room.metadata) return null

    // creator_identity가 있으면 방송자 정보로 표시
    if (room.metadata.creator_identity) {
      return `방송자: ${room.metadata.creator_identity}`
    }

    // title이 있으면 제목으로 표시
    if (room.metadata.title) {
      return `제목: ${room.metadata.title}`
    }

    // 그 외의 경우 전체 메타데이터를 JSON으로 표시
    return `정보: ${JSON.stringify(room.metadata)}`
  }

  const getRoomType = () => {
    if (!room.metadata) return '방송'

    if (room.metadata.type === 'conference') {
      return 'Conference Call'
    }

    return '방송'
  }

  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isNewRoom
        ? 'border-green-500 bg-green-50 hover:shadow-green-200'
        : 'hover:shadow-gray-200'
        }`}
      onClick={handleJoinRoom}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className={`text-lg ${isNewRoom ? 'text-green-600' : 'text-gray-900'}`}>
            {room.room_id}
          </CardTitle>
          <div className="flex gap-2 items-center">
            {isNewRoom && (
              <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                NEW
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={`text-xs ${getRoomType() === 'Conference Call'
                ? 'bg-blue-500 text-white'
                : 'bg-red-500 text-white'
                }`}
            >
              {getRoomType()}
            </Badge>
            {onDeleteRoom && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteRoom}
                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 hover:scale-110 transition-all"
                title="방 삭제"
              >
                🗑️
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>참가자:</strong> {room.num_participants}명</p>
          <p><strong>최대 참가자:</strong> {room.max_participants}명</p>
          <p><strong>생성 시간:</strong> {formatDate(room.creation_time)}</p>
          <p><strong>빈 방 대기시간:</strong> {room.empty_timeout}초</p>
          {room.metadata && (
            <p><strong>{getMetadataDisplay()}</strong></p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default RoomCard
