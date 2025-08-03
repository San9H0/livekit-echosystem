import React, { useState, useMemo } from 'react'
import { type Room } from '../../clients/backendClient'
import RoomCard from './RoomCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Search, RefreshCw } from 'lucide-react'

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
            <div className="flex flex-col items-center justify-center py-16 min-h-[400px]">
                <div className="loading-spinner mb-5"></div>
                <p className="text-lg text-gray-600">
                    방 목록을 불러오는 중...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 min-h-[400px] text-center">
                <div className="text-5xl mb-4">
                    😞
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    방 목록을 불러올 수 없습니다
                </h3>
                <p className="text-sm text-gray-600 mb-6 max-w-md">
                    {error}
                </p>
                <Button onClick={onRefresh} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    다시 시도
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 h-full overflow-y-auto">
            {/* 검색 및 정렬 컨트롤 */}
            <div className="flex justify-between items-center mb-6 gap-4">
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="방 이름으로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                        정렬:
                    </span>
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">이름순</SelectItem>
                            <SelectItem value="participants">참가자순</SelectItem>
                            <SelectItem value="created">최신순</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 결과 카운트 */}
            <Card className="mb-5">
                <CardContent className="p-4">
                    <span className="text-sm text-gray-600">
                        총 <strong className="text-gray-900">{filteredAndSortedRooms.length}</strong>개의 방이 있습니다
                        {searchTerm && (
                            <span> (검색어: "{searchTerm}")</span>
                        )}
                    </span>
                </CardContent>
            </Card>

            {/* 방 목록 그리드 */}
            {filteredAndSortedRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {searchTerm ? '검색 결과가 없습니다' : '방이 없습니다'}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {searchTerm ? '다른 검색어를 시도해보세요.' : '새로운 방을 생성해보세요.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                    {filteredAndSortedRooms.map((room, index) => (
                        <div key={room.metadata?.title || room.room_id} className="w-full">
                            <RoomCard
                                room={room}
                                onJoinRoom={onJoinRoom}
                                onDeleteRoom={onDeleteRoom}
                                isNewRoom={index < 3} // 최근 3개 방을 NEW로 표시
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default RoomList 
