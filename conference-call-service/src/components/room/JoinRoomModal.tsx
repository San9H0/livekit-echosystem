import React, { useState } from 'react'
import { PreJoin } from '@livekit/components-react'
import { Room } from 'livekit-client'
import { backendClient } from '../../clients/backendClient'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface JoinRoomModalProps {
    isOpen: boolean
    onClose: () => void
    loading?: boolean
    onPreJoinSubmit?: (values: any) => void
    onPreJoinError?: (error: Error) => void
}

export interface JoinRoomData {
    username: string
    mediaFile?: File
    joinType: 'participate' | 'watch' // 참여하기 또는 시청하기
}

const JoinRoomModal = ({
    isOpen,
    onClose,
    loading = false,
    onPreJoinSubmit,
    onPreJoinError,
}: JoinRoomModalProps) => {
    const handleClose = () => {
        if (!loading) {
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="w-[40vw] !max-w-none h-[70vh] p-0 bg-white border border-gray-200 shadow-xl">
                <DialogHeader className="flex flex-row items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                    <DialogTitle className="text-2xl font-semibold text-gray-900">
                        미디어 설정
                    </DialogTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        disabled={loading}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                {/* PreJoin 컴포넌트 */}
                <div className="flex-1 overflow-hidden bg-white p-8">
                    <PreJoin
                        defaults={{
                            username: '',
                            videoEnabled: true,
                            audioEnabled: true,
                        }}
                        joinLabel="방 입장"
                        micLabel="마이크"
                        camLabel="카메라"
                        userLabel="사용자명"
                        onSubmit={onPreJoinSubmit}
                        onError={(error) => {
                            console.error('PreJoin error:', error)
                            if (onPreJoinError) {
                                onPreJoinError(error)
                            }
                        }}
                        data-lk-theme="default"
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default JoinRoomModal 
