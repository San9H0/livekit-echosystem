import type { Room } from '../clients/backendClient'

interface RoomCardProps {
  room: Room
  onJoinRoom: (room: Room) => void
}

function RoomCard({ room, onJoinRoom }: RoomCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('ko-KR')
  }

  const handleJoinRoom = () => {
    console.log('[LiveKit] 방 입장 시도:', { 
      roomName: room.name, 
      participantCount: room.num_participants,
      maxParticipants: room.max_participants,
      metadata: room.metadata
    })
    onJoinRoom(room)
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

  return (
    <div className="room-card" onClick={handleJoinRoom}>
      <h3>{room.name}</h3>
      <div className="room-info">
        <p><strong>참가자:</strong> {room.num_participants}명</p>
        <p><strong>최대 참가자:</strong> {room.max_participants}명</p>
        <p><strong>생성 시간:</strong> {formatDate(room.creation_time)}</p>
        <p><strong>빈 방 대기시간:</strong> {room.empty_timeout}초</p>
        {room.metadata && (
          <p><strong>{getMetadataDisplay()}</strong></p>
        )}
      </div>
    </div>
  )
}

export default RoomCard