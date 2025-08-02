import React, { useState, useMemo } from 'react'
import { type Room } from '../../clients/backendClient'
import RoomCard from './RoomCard'

interface RoomListProps {
    rooms: Room[]
    loading: boolean
    error: string | null
    onRefresh: () => void
    onJoinRoom: (room: Room) => void
    onDeleteRoom?: (room: Room) => void
}

const RoomList = ({
    rooms,
    loading,
    error,
    onRefresh,
    onJoinRoom,
    onDeleteRoom
}: RoomListProps) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState<'id' | 'name' | 'participants' | 'created'>('name')

    // 검색 및 정렬된 방 목록
    const filteredAndSortedRooms = useMemo(() => {
        let filtered = rooms.filter(room =>
            room.room_id.toLowerCase().includes(searchTerm.toLowerCase())
        )

        // 정렬
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'id':
                    return a.room_id.localeCompare(b.room_id)
                case 'name':
                    return a.metadata?.title.localeCompare(b.metadata?.title || '')
                case 'participants':
                    const aCount = a.num_participants || 0
                    const bCount = b.num_participants || 0
                    return bCount - aCount // 참가자 많은 순
                case 'created':
                    return new Date(b.creation_time || 0).getTime() - new Date(a.creation_time || 0).getTime()
                default:
                    return 0
            }
        })

        return filtered
    }, [rooms, searchTerm, sortBy])

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                minHeight: '400px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f4f6',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{
                    margin: '20px 0 0 0',
                    fontSize: '16px',
                    color: '#6b7280'
                }}>
                    방 목록을 불러오는 중...
                </p>
                <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                minHeight: '400px',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '48px',
                    marginBottom: '16px'
                }}>
                    😞
                </div>
                <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '18px',
                    color: '#1f2937'
                }}>
                    방 목록을 불러올 수 없습니다
                </h3>
                <p style={{
                    margin: '0 0 24px 0',
                    fontSize: '14px',
                    color: '#6b7280',
                    maxWidth: '400px'
                }}>
                    {error}
                </p>
                <button
                    onClick={onRefresh}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    다시 시도
                </button>
            </div>
        )
    }

    return (
        <div style={{
            padding: '24px',
            height: '100%',
            overflowY: 'auto'
        }}>
            {/* 검색 및 정렬 컨트롤 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                gap: '16px'
            }}>
                <div style={{
                    flex: 1,
                    maxWidth: '400px',
                    position: 'relative'
                }}>
                    <input
                        type="text"
                        placeholder="방 이름으로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 44px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s ease'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6'
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db'
                        }}
                    />
                    <span style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '16px',
                        color: '#9ca3af'
                    }}>
                        🔍
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span style={{
                        fontSize: '14px',
                        color: '#6b7280'
                    }}>
                        정렬:
                    </span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'participants' | 'created')}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="name">이름순</option>
                        <option value="participants">참가자순</option>
                        <option value="created">최신순</option>
                    </select>
                </div>
            </div>

            {/* 결과 카운트 */}
            <div style={{
                marginBottom: '20px',
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e1e5e9'
            }}>
                <span style={{
                    fontSize: '14px',
                    color: '#6b7280'
                }}>
                    총 <strong style={{ color: '#1f2937' }}>{filteredAndSortedRooms.length}</strong>개의 방이 있습니다
                    {searchTerm && (
                        <span> (검색어: "{searchTerm}")</span>
                    )}
                </span>
            </div>

            {/* 방 목록 그리드 */}
            {filteredAndSortedRooms.length === 0 ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '48px',
                        marginBottom: '16px'
                    }}>
                        🏠
                    </div>
                    <h3 style={{
                        margin: '0 0 12px 0',
                        fontSize: '18px',
                        color: '#1f2937'
                    }}>
                        {searchTerm ? '검색 결과가 없습니다' : '아직 방이 없습니다'}
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#6b7280'
                    }}>
                        {searchTerm ? '다른 검색어를 시도해보세요.' : '첫 번째 방을 만들어보세요!'}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '24px',
                    paddingBottom: '24px'
                }}>
                    {filteredAndSortedRooms.map((room, index) => (
                        <RoomCard
                            key={room.metadata?.title || room.room_id}
                            room={room}
                            onJoinRoom={onJoinRoom}
                            onDeleteRoom={onDeleteRoom}
                            isNewRoom={index < 3} // 최근 3개 방을 NEW로 표시
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default RoomList 
