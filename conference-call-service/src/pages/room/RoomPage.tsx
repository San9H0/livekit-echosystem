import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Room, RoomEvent, Track } from 'livekit-client'
import {
    LiveKitRoom,
    VideoConference,
    ControlBar,
    RoomAudioRenderer,
    GridLayout,
    ParticipantTile,
    TrackMutedIndicator,
    ParticipantName,
    ConnectionQualityIndicator,
    AudioVisualizer,
    useRoomContext,
    useParticipants,
    useLocalParticipant,
    useDataChannel,
    useChat,
    Chat,
    useStartAudio,
    useStartVideo,
    useIsSpeaking,
    useIsMuted,
    useTrackToggle,
    useMediaDevices,
    MediaDeviceMenu,
    useConnectionState,
    ConnectionStateToast,
    usePinnedTracks,
    useSortedParticipants,
    useSpeakingParticipants,
    useVisualStableUpdate,
    useGridLayout,
    useParticipantInfo,
    useParticipantPermissions,
    useRemoteParticipant,
    useRemoteParticipants,
    useRoomInfo,
    useToken,
    useTrackMutedIndicator,
    useTracks,
    useTrackVolume,
    useParticipantTracks,
    useTrackTranscription,
    useVoiceAssistant,
    useParticipantAttributes,
    useIsRecording,
    useTextStream,
    useTranscriptions,
    useAudioPlayback,
    useClearPinButton,
    useConnectionQualityIndicator,
    useDisconnectButton,
    useFacingMode,
    useFocusToggle,
    useLiveKitRoom,
    useLocalParticipantPermissions,
    useMediaDeviceSelect,
    usePagination,
    useParticipantTile,
    useSwipe,
    useChatToggle,
    useTrackByName,
    usePersistentUserChoices,
    useIsEncrypted,
    LayoutContextProvider,
    RoomName,
    ConnectionState,
    ChatEntry,
} from '@livekit/components-react'
import '@livekit/components-styles'
import HeaderNavigation from '../../components/HeaderNavigation'
import Footer from '../../components/Footer'
import JoinRoomModal, { type JoinRoomData } from '../../components/room/JoinRoomModal'
import { ChatComponent } from '../../components/room/Chat'
import { backendClient } from '../../clients/backendClient'

interface Participant {
    id: string
    name: string
    isLocal: boolean
    isVideoEnabled: boolean
    isAudioEnabled: boolean
    canPublish: boolean
    isViewer: boolean
}

interface UserSettings {
    username: string
    videoEnabled: boolean
    audioEnabled: boolean
    videoDeviceId: string
    audioDeviceId: string
}


const RoomPage = () => {
    const { roomId } = useParams<{ roomId: string }>()
    const navigate = useNavigate()


    // 상태 관리
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(true)
    const [isJoining, setIsJoining] = useState(false)
    const [livekitRoom, setLivekitRoom] = useState<Room | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [userSettings, setUserSettings] = useState<UserSettings>({
        username: '',
        videoEnabled: false,
        audioEnabled: false,
        videoDeviceId: '',
        audioDeviceId: ''
    })
    const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat')
    const [chatMessages, setChatMessages] = useState<Array<{ id: string, sender: string, message: string, timestamp: Date }>>([])
    const [chatInput, setChatInput] = useState('')
    const [preJoinToken, setPreJoinToken] = useState<string>('')
    const [preJoinServerUrl, setPreJoinServerUrl] = useState<string>('')

    const [joinSuccess, setJoinSuccess] = useState<boolean>(false)
    const [joinToken, setJoinToken] = useState<string>('')
    const [joinServerUrl, setJoinServerUrl] = useState<string>('')



    useEffect(() => {
        console.log("[TESTDEBUG] LobbyPage mounted joinToken:", joinToken, ", serverUrl:", joinServerUrl)
    })


    const leaveRoom = async () => {
        // console.log("[TESTDEBUG] leaveRoom")
        // if (livekitRoom) {
        //     await livekitRoom.disconnect()
        // }
        // navigate('/lobby')
    }

    const sendChatMessage = () => {
        // if (chatInput.trim() && userSettings) {
        //     const newMessage = {
        //         id: Date.now().toString(),
        //         sender: userSettings.username,
        //         message: chatInput.trim(),
        //         timestamp: new Date()
        //     }
        //     setChatMessages(prev => [...prev, newMessage])

        //     // LiveKit DataChannel을 통한 채팅 메시지 전송
        //     try {
        //         livekitRoom.localParticipant.publishData(
        //             new TextEncoder().encode(JSON.stringify({
        //                 type: 'chat',
        //                 sender: userSettings.username,
        //                 message: chatInput.trim(),
        //                 timestamp: new Date().toISOString()
        //             }))
        //         )
        //     } catch (err) {
        //         console.error('Failed to send chat message via data channel:', err)
        //     }

        //     setChatInput('')
        // }
    }

    const handleChatKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendChatMessage()
        }
    }

    // useEffect(() => {
    //     console.log("[TESTDEBUG] useEffect livekitRoom is null?:", livekitRoom)
    //     if (!livekitRoom) return

    //     console.log("[TESTDEBUG] useEffect livekitRoom is not null")

    //     return () => {
    //         console.log("[TESTDEBUG] Disconnecting room")
    //         livekitRoom.disconnect()
    //     }
    // }, [livekitRoom])

    const handleDataReceived = (payload: Uint8Array, participant: any) => {
        // try {
        //     const data = JSON.parse(new TextDecoder().decode(payload))
        //     if (data.type === 'chat') {
        //         const newMessage = {
        //             id: Date.now().toString(),
        //             sender: data.sender,
        //             message: data.message,
        //             timestamp: new Date(data.timestamp)
        //         }
        //         setChatMessages(prev => [...prev, newMessage])
        //     }
        // } catch (err) {
        //     console.error('Failed to parse chat message:', err)
        // }
    }

    // PreJoin에서 방 연결 처리
    const handlePreJoinSubmit = async (values: any) => {
        if (!roomId) return

        console.log("[TESTDEBUG] handlePreJoinSubmit values:", values)

        try {
            // 백엔드에서 토큰 가져오기
            const response = await backendClient.joinStream({
                identity: values.username,
                room_id: roomId
            })

            setUserSettings({
                username: values.username,
                videoEnabled: values.videoEnabled,
                audioEnabled: values.audioEnabled,
                videoDeviceId: values.videoDeviceId,
                audioDeviceId: values.audioDeviceId
            })

            console.log("[TESTDEBUG] userSettings:", values)


            setJoinToken(response.connection_details.token)
            setJoinServerUrl(response.connection_details.ws_url)
            setJoinSuccess(true)

            // 방에 연결
            // const room = new Room()

            // 참가자 이벤트 리스너 추가
            // room.on(RoomEvent.ParticipantConnected, (participant) => {
            //     console.log("Participant connected:", participant.identity)
            //     console.log("Total participants after connect:", room.numParticipants)
            // })

            // room.on(RoomEvent.ParticipantDisconnected, (participant) => {
            //     console.log("Participant disconnected:", participant.identity)
            //     console.log("Total participants after disconnect:", room.numParticipants)
            // })

            // room.on(RoomEvent.DataReceived, handleDataReceived)

            // console.log("[TESTDEBUG] Connecting room url:", response.connection_details.ws_url)
            // console.log("[TESTDEBUG] Connecting room token:", response.connection_details.token)
            // await room.connect(response.connection_details.ws_url, response.connection_details.token)

            // console.log("=== Room Connection Debug ===")
            // console.log("Room connected:", room.name)
            // console.log("Local participant:", room.localParticipant.identity)
            // console.log("Initial participants count:", room.numParticipants)

            // setLivekitRoom(room)
            setIsJoinModalOpen(false)
        } catch (err: any) {
            handlePreJoinError(err)
        }
    }

    const handlePreJoinError = (error: Error) => {
        console.error('Failed to join room:', error)
        setError(error.message)
        setIsJoinModalOpen(false)
    }

    // 모달이 열려있거나 입장 중일 때
    if (isJoinModalOpen) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                backgroundColor: '#f8fafc'
            }}>
                <HeaderNavigation
                    onCreateRoom={() => console.log('방 만들기 (아직 구현되지 않음)')}
                    onNavigateToPublisher={() => { }}
                />

                <JoinRoomModal
                    isOpen={isJoinModalOpen}
                    onClose={() => navigate('/lobby')}
                    onPreJoinSubmit={handlePreJoinSubmit}
                    onPreJoinError={handlePreJoinError}
                />
                <Footer />
            </div>
        )
    }

    // LiveKit Room이 없으면 로딩
    if (!joinSuccess) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div>방에 연결 중...</div>
            </div>
        )
    }

    // 에러 화면
    if (error) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column'
            }}>
                <h2>연결 오류</h2>
                <p style={{ marginBottom: '20px' }}>{error}</p>
                <button
                    onClick={() => navigate('/lobby')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    로비로 돌아가기
                </button>
            </div>
        )
    }

    // 컨퍼런스 콜 화면
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* 공통 헤더 네비게이션 */}
            <HeaderNavigation
                onCreateRoom={() => console.log('방 만들기 (아직 구현되지 않음)')}
                onNavigateToPublisher={() => { }}
            />

            {/* 방 정보 표시 영역 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 20px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e9ecef',
                zIndex: 1000
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '16px' }}>방 ID: {roomId}</h2>
                </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div style={{ flex: 1, display: 'flex' }}>
                <LiveKitRoom
                    token={joinToken}
                    serverUrl={joinServerUrl}
                    connect={joinSuccess}
                    data-lk-theme="default"
                    style={{ height: '100%', display: 'flex', width: '100%' }}
                >
                    <div style={{ flex: 1, position: 'relative' }}>
                        <VideoConference />

                    </div>
                </LiveKitRoom>
            </div>
        </div>
    )
}

// 참가자 목록 컴포넌트
const ParticipantsList = () => {
    return (
        <div>
            <h2>참가자 목록</h2>
        </div>
    )
}

export default RoomPage 
