import type { Room } from '../clients/backendClient'

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
      roomName: room.name,
      participantCount: room.num_participants,
      maxParticipants: room.max_participants,
      metadata: room.metadata
    })
    onJoinRoom(room)
  }

  const handleDeleteRoom = (e: React.MouseEvent) => {
    e.stopPropagation() // 카드 클릭 이벤트 전파 방지
    if (onDeleteRoom) {
      console.log('[RoomCard] 방 삭제 시도:', { roomName: room.name })
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

  const getCardStyle = () => {
    const baseStyle = {
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '10px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      backgroundColor: '#fff'
    }

    if (isNewRoom) {
      return {
        ...baseStyle,
        border: '2px solid #27ae60',
        backgroundColor: '#f8fff9',
        boxShadow: '0 4px 8px rgba(39, 174, 96, 0.2)'
      }
    }

    return baseStyle
  }

  return (
    <div
      className="room-card"
      onClick={handleJoinRoom}
      style={getCardStyle()}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = isNewRoom
          ? '0 6px 12px rgba(39, 174, 96, 0.3)'
          : '0 4px 8px rgba(0, 0, 0, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = isNewRoom
          ? '0 4px 8px rgba(39, 174, 96, 0.2)'
          : '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: isNewRoom ? '#27ae60' : '#333' }}>
          {room.name}
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isNewRoom && (
            <span style={{
              backgroundColor: '#27ae60',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              NEW
            </span>
          )}
          <span style={{
            backgroundColor: getRoomType() === 'Conference Call' ? '#3498db' : '#e74c3c',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            {getRoomType()}
          </span>
          {onDeleteRoom && (
            <button
              onClick={handleDeleteRoom}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                color: '#e74c3c',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fdf2f2'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              title="방 삭제"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

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
