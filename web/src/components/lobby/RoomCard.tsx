import React, { useState } from 'react'
import { type Room } from '../../clients/backendClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Trash2, Users, Home } from 'lucide-react'

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
    const [showParticipants, setShowParticipants] = useState(false)

    const handleDeleteRoom = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onDeleteRoom) {
            onDeleteRoom(room)
        }
    }

    const toggleParticipants = (e: React.MouseEvent) => {
        e.stopPropagation()
        setShowParticipants(!showParticipants)
    }

    const getParticipantCount = () => {
        return room.num_participants || 0
    }

    const getRoomStatus = () => {
        const participantCount = getParticipantCount()
        if (participantCount === 0) return { text: '대기 중', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: '⏳' }
        if (participantCount < 3) return { text: '활성', color: 'text-green-600', bgColor: 'bg-green-100', icon: '🟢' }
        if (participantCount < 6) return { text: '인기', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '🟡' }
        return { text: '혼잡', color: 'text-red-600', bgColor: 'bg-red-100', icon: '🔴' }
    }

    const status = getRoomStatus()

    return (
        <Card
            onClick={() => onJoinRoom(room)}
            className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-500 w-full h-48 flex flex-col relative overflow-hidden group"
        >
            {/* 새 방 표시 */}
            {isNewRoom && (
                <Badge
                    variant="destructive"
                    className="absolute top-2 right-2 z-10 text-xs font-semibold"
                >
                    NEW
                </Badge>
            )}

            {/* 상단 여백 */}
            <div className="flex-1"></div>

            {/* 하단 정보 영역 */}
            <div className="p-3 pb-2">
                {/* 제목 */}
                <h3 className="text-sm font-semibold text-gray-900 leading-tight m-0 mb-2 truncate">
                    {room.metadata?.title || '(제목 없음)'}
                </h3>

                {/* 태그들과 참가자 수, 삭제 버튼 */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`${status.bgColor} ${status.color} text-xs font-medium`}>
                            <span className="mr-1">{status.icon}</span>
                            {status.text}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            화상회의
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                            실시간
                        </Badge>
                        <span className="text-xs text-gray-600">
                            {getParticipantCount()}명
                        </span>
                    </div>

                    {/* 삭제 버튼 */}
                    {onDeleteRoom && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteRoom}
                            className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 hover:scale-110 transition-all"
                            title="방 삭제"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                </div>


            </div>
        </Card>
    )
}

export default RoomCard 
