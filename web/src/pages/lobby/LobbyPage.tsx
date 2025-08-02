import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { type Room } from '../../clients/backendClient'
import { backendClient } from '../../clients/backendClient'
import HeaderNavigation from '../../components/HeaderNavigation'
import SidebarNavigation from '../../components/SidebarNavigation'
import RoomList from '../../components/lobby/RoomList'
import CreateRoomModal, { type CreateRoomData } from '../../components/lobby/CreateRoomModal'
import Footer from '../../components/Footer'

interface LobbyPageProps {
    onNavigateToPublisher: () => void
    onNavigateToSubscriber: (room: Room) => void
    onNavigateToJoinRoom: (room: Room) => void
    onNavigateToCreateRoom: () => void
}


const LobbyPage = ({
    onNavigateToPublisher,
    onNavigateToSubscriber,
    onNavigateToJoinRoom,
    onNavigateToCreateRoom
}: LobbyPageProps) => {
    const navigate = useNavigate()
    const [rooms, setRooms] = useState<Room[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isCreatingRoom, setIsCreatingRoom] = useState(false)

    const fetchRooms = async () => {
        try {
            setLoading(true)
            setError(null)
            const rooms = await backendClient.getRooms()
            setRooms(rooms)
        } catch (err) {
            console.error('Failed to fetch rooms:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch rooms')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRooms()
    }, [])

    const handleJoinRoom = (room: Room) => {
        console.log('[LobbyPage] 방 입장 시도:', { roomName: room.metadata?.title || '(제목 없음)', roomId: room.room_id })
        navigate(`/room/${room.room_id}`)
    }

    const handleDeleteRoom = async (room: Room) => {
        if (window.confirm(`정말로 "${room.metadata?.title || '(제목 없음)'}" 방을 삭제하시겠습니까?`)) {
            try {
                console.log('[LobbyPage] 방 삭제 시도:', { roomName: room.metadata?.title || '(제목 없음)' })
                await backendClient.deleteRoom(room.room_id)
                console.log('[LobbyPage] 방 삭제 성공:', { roomName: room.metadata?.title || '(제목 없음)' })
                fetchRooms()
            } catch (error) {
                console.error('[LobbyPage] 방 삭제 실패:', error)
                alert(`방 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
            }
        }
    }

    const handleCreateRoom = async (roomData: CreateRoomData) => {
        try {
            setIsCreatingRoom(true)
            console.log('[LobbyPage] 방 생성 시도:', roomData)

            const newRoom = await backendClient.createStream({
                metadata: {
                    creator_identity: roomData.userId,
                    title: roomData.name,
                    description: roomData.description,
                    type: 'video',
                    isPrivate: roomData.isPrivate
                }
            })

            // 임시로 성공 메시지 표시
            alert(`방 "${roomData.name}"이 성공적으로 생성되었습니다!`)

            // 방 목록 새로고침
            await fetchRooms()

            // 모달 닫기
            setIsCreateModalOpen(false)
        } catch (error) {
            console.error('[LobbyPage] 방 생성 실패:', error)
            alert(`방 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        } finally {
            setIsCreatingRoom(false)
        }
    }

    // 통계 계산
    const totalParticipants = rooms.reduce((total, room) => {
        return total + (room.num_participants || 0)
    }, 0)

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            backgroundColor: '#f8fafc'
        }}>
            {/* 헤더 네비게이션 */}
            <HeaderNavigation
                onCreateRoom={() => setIsCreateModalOpen(true)}
                onNavigateToPublisher={onNavigateToPublisher}
            />

            {/* 메인 콘텐츠 영역 */}
            <div style={{
                display: 'flex',
                flex: 1,
                overflow: 'hidden'
            }}>
                {/* 왼쪽 사이드바 */}
                <SidebarNavigation
                    activeRooms={rooms.length}
                    totalParticipants={totalParticipants}
                    onRefresh={fetchRooms}
                />

                {/* 메인 콘텐츠 */}
                <main style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* 방 목록 */}
                    <div style={{
                        flex: 1,
                        overflow: 'hidden'
                    }}>
                        <RoomList
                            rooms={rooms}
                            loading={loading}
                            error={error}
                            onRefresh={fetchRooms}
                            onJoinRoom={handleJoinRoom}
                            onDeleteRoom={handleDeleteRoom}
                        />
                    </div>

                    {/* 푸터 */}
                    <Footer />
                </main>
            </div>

            {/* 방 생성 모달 */}
            <CreateRoomModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateRoom}
                loading={isCreatingRoom}
            />
        </div>
    )
}

export default LobbyPage 
