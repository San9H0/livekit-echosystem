import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Plus, Video, RefreshCw } from 'lucide-react'

interface HeaderNavigationProps {
    onCreateRoom: () => void
    onNavigateToPublisher: () => void
    onRefresh?: () => void
}

const HeaderNavigation = ({
    onCreateRoom,
    onNavigateToPublisher,
    onRefresh
}: HeaderNavigationProps) => {
    const navigate = useNavigate()
    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
            {/* 로고 및 제목 영역 */}
            <div
                className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => navigate('/lobby')}
            >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                    🎥
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 m-0">
                        LiveKit Conference
                    </h1>
                    <p className="text-sm text-gray-500 m-0 mt-0.5">
                        실시간 화상회의 플랫폼
                    </p>
                </div>
            </div>

            {/* 우측 액션 버튼들 */}
            <div className="flex gap-3 items-center">
                {onRefresh && (
                    <Button
                        onClick={onRefresh}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        새로고침
                    </Button>
                )}

                <Button
                    onClick={onCreateRoom}
                    className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                    <Plus className="h-4 w-4" />
                    방 만들기
                </Button>

                <Button
                    onClick={onNavigateToPublisher}
                    variant="destructive"
                    className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                    <Video className="h-4 w-4" />
                    방송하기
                </Button>
            </div>
        </header>
    )
}

export default HeaderNavigation 
