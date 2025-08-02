import React from 'react'
import { type Room } from '../../clients/backendClient'

interface RoomCardProps {
    room: Room
    onJoinRoom: (room: Room) => void
    onDeleteRoom?: (room: Room) => void
    isNewRoom?: boolean
}

const RoomCard = ({
    room,
    onJoinRoom,
    onDeleteRoom,
    isNewRoom = false
}: RoomCardProps) => {
    const handleDeleteRoom = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onDeleteRoom) {
            onDeleteRoom(room)
        }
    }

    const getParticipantCount = () => {
        return room.num_participants || 0
    }

    const getRoomStatus = () => {
        const participantCount = getParticipantCount()
        if (participantCount === 0) return { text: '대기 중', color: '#6b7280', icon: '⏳' }
        if (participantCount < 3) return { text: '활성', color: '#10b981', icon: '🟢' }
        if (participantCount < 6) return { text: '인기', color: '#f59e0b', icon: '🟡' }
        return { text: '혼잡', color: '#ef4444', icon: '🔴' }
    }

    const status = getRoomStatus()

    return (
        <div
            onClick={() => onJoinRoom(room)}
            style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e1e5e9',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minHeight: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
                e.currentTarget.style.borderColor = '#3b82f6'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                e.currentTarget.style.borderColor = '#e1e5e9'
            }}
        >
            {/* 새 방 표시 */}
            {isNewRoom && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    zIndex: 10
                }}>
                    NEW
                </div>
            )}

            {/* 삭제 버튼 */}
            {onDeleteRoom && (
                <button
                    onClick={handleDeleteRoom}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: isNewRoom ? '60px' : '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        color: '#ef4444',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fef2f2'
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

            {/* 방 정보 */}
            <div style={{ flex: 1 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#3b82f6',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}>
                        🏠
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#1f2937',
                            lineHeight: '1.3'
                        }}>
                            {room.metadata?.title || '(제목 없음)'}
                        </h3>
                        <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '13px',
                            color: '#6b7280'
                        }}>
                            {room.metadata?.description || '(설명 없음)'}
                        </p>
                    </div>
                </div>

                {/* 방 상태 및 참가자 정보 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '16px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '20px',
                        fontSize: '13px',
                        color: status.color,
                        fontWeight: '500'
                    }}>
                        <span>{status.icon}</span>
                        {status.text}
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        color: '#6b7280'
                    }}>
                        <span>👥</span>
                        {getParticipantCount()}명 참가
                    </div>
                </div>

                {/* 방 태그들 */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '16px'
                }}>
                    <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500'
                    }}>
                        화상회의
                    </span>
                    <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500'
                    }}>
                        실시간
                    </span>
                </div>
            </div>

            {/* 입장 버튼 */}
            <button
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                }}
            >
                <span>🚪</span>
                입장하기
            </button>
        </div>
    )
}

export default RoomCard 
