import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { type Room } from '../../clients/backendClient'
import { backendClient } from '../../clients/backendClient'
import HeaderNavigation from '../../components/HeaderNavigation'
import SidebarNavigation from '../../components/SidebarNavigation'
import RoomList from '../../components/lobby/RoomList'
import CreateRoomModal, { type CreateRoomData } from '../../components/lobby/CreateRoomModal'
import Footer from '../../components/Footer'
import { Box, Flex } from '@radix-ui/themes'

interface LobbyPageProps {
    onNavigateToPublisher: () => void
    onNavigateToSubscriber: (room: Room) => void
    onNavigateToJoinRoom: (room: Room) => void
    onNavigateToCreateRoom: () => void
}


const LobbyPage = ({
    onNavigateToPublisher,
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
            console.log('[LobbyPage] 방 목록 및 참가자 정보 조회 시작')

            const rooms = await backendClient.getRooms()

            // 각 방의 참가자 정보 로깅
            rooms.forEach(room => {
                console.log(`[LobbyPage] 방 "${room.metadata?.title || room.room_id}" 정보:`, {
                    roomId: room.room_id,
                    title: room.metadata?.title || '(제목 없음)',
                    numParticipants: room.num_participants,
                    participants: room.participants || [],
                    creationTime: new Date(room.creation_time * 1000).toLocaleString()
                })
            })

            setRooms(rooms)
            console.log('[LobbyPage] 방 목록 및 참가자 정보 조회 완료:', rooms.length, '개 방')
        } catch (err) {
            console.error('Failed to fetch rooms:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch rooms')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRooms()

        // 30초마다 자동 새로고침
        const intervalId = setInterval(() => {
            console.log('[LobbyPage] 자동 새로고침 실행')
            fetchRooms()
        }, 30000) // 30초

        // 컴포넌트 언마운트 시 인터벌 정리
        return () => {
            clearInterval(intervalId)
        }
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

            await backendClient.createStream({
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

    // 통계 계산(현재 미사용)

    return (
        <Flex direction="column" className="h-screen">
            {/* 헤더 네비게이션 */}
            <HeaderNavigation
                onCreateRoom={() => setIsCreateModalOpen(true)}
                onNavigateToPublisher={onNavigateToPublisher}
                onRefresh={fetchRooms}
            />

            {/* 메인 콘텐츠 영역 */}
            <Flex flexGrow="1" overflow="hidden">
                {/* 왼쪽 사이드바 */}
                <SidebarNavigation />

                {/* 메인 콘텐츠 */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* 방 목록 */}
                    <div className="flex-1 overflow-hidden">
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
                    <footer>
                        <Footer />
                    </footer>
                </main>
            </Flex>

            {/* 방 생성 모달 */}
            <CreateRoomModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateRoom}
                loading={isCreatingRoom}
            />
        </Flex>
    )
}

export default LobbyPage 
