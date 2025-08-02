import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Room, RoomEvent, RemoteParticipant, LocalParticipant, Track, TrackPublication, RemoteTrack, LocalAudioTrack, LocalVideoTrack } from 'livekit-client'
import HeaderNavigation from '../../components/HeaderNavigation'
import Footer from '../../components/Footer'
import JoinRoomModal, { type JoinRoomData } from '../../components/room/JoinRoomModal'
import { backendClient } from '../../clients/backendClient'
import { createMediaStreamFromFile, type HTMPCaptureableVideoElement } from '../../utils/MediaStream'

interface Participant {
    id: string
    name: string
    isLocal: boolean
    videoTrack?: RemoteTrack
    audioTrack?: RemoteTrack
    isVideoEnabled: boolean
    isAudioEnabled: boolean
    canPublish: boolean
    isViewer: boolean
}

const RoomPage = () => {
    const { roomId } = useParams<{ roomId: string }>()
    const navigate = useNavigate()

    // 상태 관리
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(true)
    const [isJoining, setIsJoining] = useState(false)
    const [livekitRoom, setLivekitRoom] = useState<Room | null>(null)
    const [participants, setParticipants] = useState<Participant[]>([])
    const [isConnecting, setIsConnecting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [localVideoReady, setLocalVideoReady] = useState(false)
    const [isLocalAudioMuted, setIsLocalAudioMuted] = useState(false)
    const [isLocalVideoMuted, setIsLocalVideoMuted] = useState(false)
    const [chatMessages, setChatMessages] = useState<Array<{ id: string, sender: string, message: string, timestamp: Date }>>([])
    const [chatInput, setChatInput] = useState('')
    const [userSettings, setUserSettings] = useState<{ username: string; mediaFile?: File; joinType: 'participate' | 'watch' } | null>(null)
    const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat')

    // remoteVideoRefs를 Map으로 변경 (null 불허용)
    const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
    const localVideoRef = useRef<HTMPCaptureableVideoElement>(null)
    const mediaBlobRef = useRef<string | null>(null)

    useEffect(() => {
        console.log("[TESTDEBUG] RoomPage mounted.. remoteVideoRefs:", remoteVideoRefs.current.size)
    })

    const createVideoElement = () => {
        const videoElement = document.createElement('video')
        videoElement.autoplay = true
        videoElement.playsInline = true
        videoElement.style.width = '100%'
        videoElement.style.height = '100%'
        videoElement.style.objectFit = 'cover'


        return videoElement
    }

    const handleJoinRoom = async (userData: JoinRoomData) => {
        if (!roomId) return

        try {
            setIsJoining(true)
            setError(null)

            // 백엔드에서 토큰 가져오기
            const response = await backendClient.joinStream({
                identity: userData.username,
                room_id: roomId
            })

            // 사용자 설정 저장
            setUserSettings({
                username: userData.username,
                mediaFile: userData.mediaFile,
                joinType: userData.joinType
            })

            // LiveKit Room 생성 및 연결
            const livekitRoomInstance = new Room({
                adaptiveStream: true,
                dynacast: true,
            })

            // 이벤트 리스너 설정
            livekitRoomInstance.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
            livekitRoomInstance.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
            livekitRoomInstance.on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
            livekitRoomInstance.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
            livekitRoomInstance.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished)
            livekitRoomInstance.on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished)

            // 방 연결
            await livekitRoomInstance.connect(response.connection_details.ws_url, response.connection_details.token)

            setLivekitRoom(livekitRoomInstance)

            // 로컬 참가자 추가 (참여하기일 때만)
            let localParticipant: Participant | null = null
            if (userData.joinType === 'participate') {
                localParticipant = {
                    id: livekitRoomInstance.localParticipant.identity,
                    name: userData.username,
                    isLocal: true,
                    isVideoEnabled: true,
                    isAudioEnabled: true,
                    canPublish: true,
                    isViewer: false
                }
            }

            // 기존에 참여 중인 참가자들 추가
            const existingParticipants: Participant[] = []

            livekitRoomInstance.remoteParticipants.forEach((participant) => {
                const existingParticipant: Participant = {
                    id: participant.identity,
                    name: participant.identity,
                    isLocal: false,
                    isVideoEnabled: false,
                    isAudioEnabled: false,
                    canPublish: participant.permissions?.canPublish ?? false,
                    isViewer: !(participant.permissions?.canPublish ?? false)
                }
                existingParticipants.push(existingParticipant)
            })

            // 로컬 참가자와 기존 참가자들을 모두 추가
            const allParticipants = localParticipant ? [localParticipant, ...existingParticipants] : existingParticipants
            setParticipants(allParticipants)

            // 모달 닫기
            setIsJoinModalOpen(false)
            setIsJoining(false)

        } catch (err) {
            console.error('Failed to join room:', err)
            setError(err instanceof Error ? err.message : 'Failed to join room')
            setIsJoining(false)
        }
    }

    // localVideoRef가 설정되고 미디어 파일이 있을 때 스트림 설정 (참여하기일 때만)
    useEffect(() => {
        const setupMediaStream = async () => {
            if (userSettings?.joinType === 'participate' && localVideoRef.current && userSettings?.mediaFile && livekitRoom && !localVideoReady) {
                try {
                    const mediaStream = await createMediaStreamFromFile(userSettings.mediaFile, localVideoRef)
                    const videoTrack = new LocalVideoTrack(mediaStream.getVideoTracks()[0])
                    const audioTrack = new LocalAudioTrack(mediaStream.getAudioTracks()[0])

                    await livekitRoom.localParticipant.publishTrack(videoTrack)
                    await livekitRoom.localParticipant.publishTrack(audioTrack)

                    await localVideoRef.current.play()
                    setLocalVideoReady(true)
                } catch (error) {
                    console.error("[TESTDEBUG] 미디어 스트림 설정 실패:", error)
                }
            }
        }

        setupMediaStream()
    }, [localVideoRef.current, userSettings?.mediaFile, userSettings?.joinType, livekitRoom, localVideoReady])

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        if (!livekitRoom) {
            return;
        }

        return () => {
            if (mediaBlobRef.current) {
                URL.revokeObjectURL(mediaBlobRef.current)
            }
            // Map 정리 및 비디오 요소들 정리
            remoteVideoRefs.current.forEach((videoElement) => {
                if (videoElement) {
                    videoElement.srcObject = null
                    if (videoElement.parentElement) {
                        videoElement.parentElement.removeChild(videoElement)
                    }
                }
            })
            remoteVideoRefs.current.clear()
            console.log("[TESTDEBUG] clear !! useEffect - remoteVideoRefs.current.size:", remoteVideoRefs.current.size)
        }
    }, [livekitRoom])

    const handleParticipantConnected = (participant: RemoteParticipant) => {
        const newParticipant: Participant = {
            id: participant.identity,
            name: participant.identity,
            isLocal: false,
            isVideoEnabled: false,
            isAudioEnabled: false,
            canPublish: participant.permissions?.canPublish ?? false,
            isViewer: !(participant.permissions?.canPublish ?? false)
        }
        setParticipants(prev => [...prev, newParticipant])
    }

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
        console.log('[Livekit] Participant disconnected:', participant.identity)

        // Map에서 해당 참가자의 비디오 요소 제거 및 정리
        const videoElement = remoteVideoRefs.current.get(participant.identity)
        if (videoElement) {
            // 비디오 요소에서 모든 트랙 분리
            videoElement.srcObject = null
            // 부모 요소에서 제거
            if (videoElement.parentElement) {
                videoElement.parentElement.removeChild(videoElement)
            }
        }
        remoteVideoRefs.current.delete(participant.identity)

        setParticipants(prev => prev.filter(p => p.id !== participant.identity))
    }

    const handleTrackSubscribed = (track: RemoteTrack, publication: TrackPublication, participant: RemoteParticipant) => {
        setParticipants(prev => prev.map(p => {
            if (p.id === participant.identity) {
                if (track.kind === Track.Kind.Video) {
                    console.log("video subscribed")
                    return { ...p, videoTrack: track, isVideoEnabled: true }
                } else if (track.kind === Track.Kind.Audio) {
                    console.log("audio subscribed")
                    return { ...p, audioTrack: track, isAudioEnabled: true }
                }
            }
            return p
        }))

        // 미리 생성된 비디오 요소에 트랙 할당
        const videoElement = remoteVideoRefs.current.get(participant.identity)
        if (videoElement) {
            track.attach(videoElement);
        } else {
            const newVideoElement = createVideoElement();
            remoteVideoRefs.current.set(participant.identity, newVideoElement);
            track.attach(newVideoElement);
            console.log(`[Livekit] ${track.kind} 요소를 찾을 수 없음:`, participant.identity)
        }
    }

    const handleTrackUnsubscribed = (track: RemoteTrack, publication: TrackPublication, participant: RemoteParticipant) => {
        console.log('[Livekit] Track unsubscribed:', track.kind, participant.identity)

        setParticipants(prev => prev.map(p => {
            if (p.id === participant.identity) {
                if (track.kind === Track.Kind.Video) {
                    console.log('[Livekit] 비디오 트랙 구독 해제:', participant.identity)
                    // 비디오 요소 정리
                    const videoElement = remoteVideoRefs.current.get(participant.identity)
                    if (videoElement) {
                        videoElement.srcObject = null
                        if (videoElement.parentElement) {
                            videoElement.parentElement.removeChild(videoElement)
                        }
                        remoteVideoRefs.current.delete(participant.identity)
                    }
                    return { ...p, videoTrack: undefined, isVideoEnabled: false }
                } else if (track.kind === Track.Kind.Audio) {
                    console.log('[Livekit] 오디오 트랙 구독 해제:', participant.identity)
                    return { ...p, audioTrack: undefined, isAudioEnabled: false }
                }
            }
            return p
        }))
    }

    const handleLocalTrackPublished = (publication: TrackPublication, participant: LocalParticipant) => {
        console.log('[Livekit] Local track published:', publication.kind)
    }

    const handleLocalTrackUnpublished = (publication: TrackPublication, participant: LocalParticipant) => {
        console.log('[Livekit] Local track unpublished:', publication.kind)
    }

    const leaveRoom = async () => {
        if (livekitRoom) {
            await livekitRoom.disconnect()
        }
        if (mediaBlobRef.current) {
            URL.revokeObjectURL(mediaBlobRef.current)
        }
        // Map 정리 및 비디오 요소들 정리
        remoteVideoRefs.current.forEach((videoElement) => {
            if (videoElement) {
                videoElement.srcObject = null
                if (videoElement.parentElement) {
                    videoElement.parentElement.removeChild(videoElement)
                }
            }
        })
        remoteVideoRefs.current.clear()
        console.log("[TESTDEBUG] leaveRoom - remoteVideoRefs.current.size:", remoteVideoRefs.current.size)
        navigate('/lobby')
    }

    const toggleLocalAudio = async () => {
        if (livekitRoom) {
            if (isLocalAudioMuted) {
                await livekitRoom.localParticipant.setMicrophoneEnabled(true)
                setIsLocalAudioMuted(false)
            } else {
                await livekitRoom.localParticipant.setMicrophoneEnabled(false)
                setIsLocalAudioMuted(true)
            }
        }
    }

    const toggleLocalVideo = async () => {
        if (livekitRoom) {
            if (isLocalVideoMuted) {
                await livekitRoom.localParticipant.setCameraEnabled(true)
                setIsLocalVideoMuted(false)
            } else {
                await livekitRoom.localParticipant.setCameraEnabled(false)
                setIsLocalVideoMuted(true)
            }
        }
    }

    const sendChatMessage = () => {
        if (chatInput.trim() && livekitRoom && userSettings) {
            const newMessage = {
                id: Date.now().toString(),
                sender: userSettings.username,
                message: chatInput.trim(),
                timestamp: new Date()
            }
            setChatMessages(prev => [...prev, newMessage])
            setChatInput('')
        }
    }

    const handleChatKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendChatMessage()
        }
    }

    // 참가자 수에 따른 그리드 레이아웃 계산
    const getGridLayout = (participantCount: number) => {
        if (participantCount === 1) {
            return {
                gridTemplateColumns: '1fr',
                gridTemplateRows: '1fr'
            }
        } else if (participantCount === 2) {
            return {
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr'
            }
        } else if (participantCount === 3) {
            return {
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr'
            }
        } else if (participantCount === 4) {
            return {
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr'
            }
        } else if (participantCount === 5) {
            return {
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr'
            }
        } else if (participantCount === 6) {
            return {
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr'
            }
        } else {
            return {
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr'
            }
        }
    }

    // 참가자별 그리드 위치 계산
    const getParticipantGridPosition = (index: number, totalCount: number) => {
        if (totalCount === 1) {
            return { gridColumn: '1', gridRow: '1' }
        } else if (totalCount === 2) {
            return { gridColumn: index + 1, gridRow: '1' }
        } else if (totalCount === 3) {
            if (index === 0) return { gridColumn: '1', gridRow: '1' }
            if (index === 1) return { gridColumn: '2', gridRow: '1' }
            if (index === 2) return { gridColumn: '1 / 3', gridRow: '2' }
        } else if (totalCount === 4) {
            const row = Math.floor(index / 2) + 1
            const col = (index % 2) + 1
            return { gridColumn: col, gridRow: row }
        } else if (totalCount === 5) {
            if (index < 3) {
                return { gridColumn: index + 1, gridRow: '1' }
            } else {
                return { gridColumn: index - 2, gridRow: '2' }
            }
        } else if (totalCount === 6) {
            const row = Math.floor(index / 3) + 1
            const col = (index % 3) + 1
            return { gridColumn: col, gridRow: row }
        } else {
            const row = Math.floor(index / 3) + 1
            const col = (index % 3) + 1
            return { gridColumn: col, gridRow: row }
        }
        return {}
    }

    // 모달이 열려있거나 입장 중일 때
    if (isJoinModalOpen || isJoining) {
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
                <Footer />

                <JoinRoomModal
                    isOpen={isJoinModalOpen}
                    onClose={() => navigate('/lobby')}
                    onSubmit={handleJoinRoom}
                    loading={isJoining}
                    roomId={roomId || ''}
                />
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
                    <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>
                        참가자: {participants.length}명
                        {userSettings?.joinType === 'watch' && (
                            <span style={{ marginLeft: '8px', color: '#10b981', fontWeight: '500' }}>
                                👁️ 시청 모드
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div style={{ flex: 1, display: 'flex' }}>
                {/* 비디오 그리드 영역 - 전체화면 */}
                <div style={{
                    flex: 1,
                    position: 'relative',
                    backgroundColor: '#000',
                    display: 'grid',
                    gap: '10px',
                    padding: '20px',
                    ...getGridLayout(participants.filter(p => p.isLocal || remoteVideoRefs.current.has(p.id)).length)
                }}>
                    {participants.map((participant, index) => {
                        // remoteVideoRefs에 key가 존재하지 않으면 렌더링하지 않음
                        if (!participant.isLocal && !remoteVideoRefs.current.has(participant.id)) {
                            return null
                        }

                        // 필터링된 참가자들 중에서의 인덱스 계산
                        const filteredParticipants = participants.filter(p => p.isLocal || remoteVideoRefs.current.has(p.id))
                        const filteredIndex = filteredParticipants.findIndex(p => p.id === participant.id)

                        console.log("[TESTDEBUG] RoomPage render participant:", participant.id, ", len:", participants.length, ", filteredIndex:", filteredIndex)

                        return (
                            <div key={participant.id} style={{
                                position: 'relative',
                                backgroundColor: '#1a1a1a',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                ...getParticipantGridPosition(filteredIndex, filteredParticipants.length)
                            }}>
                                {participant.isLocal ? (
                                    <video
                                        ref={el => {
                                            localVideoRef.current = el as HTMPCaptureableVideoElement
                                        }}
                                        autoPlay
                                        playsInline
                                        muted={true} // 로컬 참가자만 음소거 (자기 자신의 소리 방지)
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <div
                                        ref={el => {
                                            if (el) {
                                                const videoElement = remoteVideoRefs.current.get(participant.id)
                                                if (videoElement) {
                                                    // 이미 추가된 비디오 요소가 있는지 확인
                                                    const existingVideo = el.querySelector('video')
                                                    if (!existingVideo || existingVideo !== videoElement) {
                                                        // 기존 내용을 완전히 제거
                                                        el.innerHTML = ''
                                                        // 비디오 요소를 추가하고 스타일 적용
                                                        videoElement.style.width = '100%'
                                                        videoElement.style.height = '100%'
                                                        videoElement.style.objectFit = 'cover'
                                                        el.appendChild(videoElement)
                                                    }
                                                }
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            position: 'relative'
                                        }}
                                    />
                                )}

                                {/* 참가자 이름 오버레이 */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    left: '10px',
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {participant.name}
                                    {participant.isLocal && ' (나)'}
                                    <span style={{
                                        marginLeft: '4px',
                                        fontSize: '10px',
                                        opacity: 0.8,
                                        color: participant.isViewer ? '#ffd700' : '#00ff00'
                                    }}>
                                        {participant.isViewer ? '👁️ 시청자' : '🎥 참여자'}
                                    </span>
                                </div>

                                {/* 오디오/비디오 상태 표시 */}
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    display: 'flex',
                                    gap: '5px'
                                }}>
                                    {!participant.isAudioEnabled && (
                                        <div style={{
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            padding: '4px',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px'
                                        }}>
                                            🔇
                                        </div>
                                    )}
                                    {!participant.isVideoEnabled && (
                                        <div style={{
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            padding: '4px',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px'
                                        }}>
                                            📹
                                        </div>
                                    )}
                                </div>

                                {/* 미디어 파일 재생 표시 */}
                                {participant.isLocal && localVideoReady && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        left: '10px',
                                        backgroundColor: 'rgba(0,0,0,0.7)',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}>
                                        미디어 파일 재생 중
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* 우측 패널 */}
                <div style={{
                    width: '350px',
                    backgroundColor: '#fff',
                    borderLeft: '1px solid #e9ecef',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* 탭 헤더 */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid #e9ecef',
                        backgroundColor: '#f8f9fa'
                    }}>
                        <button
                            onClick={() => setActiveTab('chat')}
                            style={{
                                flex: 1,
                                padding: '15px 20px',
                                border: 'none',
                                backgroundColor: activeTab === 'chat' ? '#fff' : 'transparent',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: activeTab === 'chat' ? 'bold' : 'normal',
                                borderBottom: activeTab === 'chat' ? '2px solid #007bff' : 'none'
                            }}
                        >
                            💬 채팅
                        </button>
                        <button
                            onClick={() => setActiveTab('participants')}
                            style={{
                                flex: 1,
                                padding: '15px 20px',
                                border: 'none',
                                backgroundColor: activeTab === 'participants' ? '#fff' : 'transparent',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: activeTab === 'participants' ? 'bold' : 'normal',
                                borderBottom: activeTab === 'participants' ? '2px solid #007bff' : 'none'
                            }}
                        >
                            👥 참가자 ({participants.length})
                        </button>
                    </div>

                    {/* 탭 콘텐츠 영역 */}
                    <div style={{
                        flex: 1,
                        padding: '15px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        {activeTab === 'chat' ? (
                            // 채팅 탭
                            <>
                                {chatMessages.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        color: '#6c757d',
                                        fontSize: '14px',
                                        marginTop: '20px'
                                    }}>
                                        아직 메시지가 없습니다.<br />
                                        첫 번째 메시지를 보내보세요!
                                    </div>
                                ) : (
                                    chatMessages.map((message) => (
                                        <div key={message.id} style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            maxWidth: '100%'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '4px'
                                            }}>
                                                <span style={{
                                                    fontWeight: 'bold',
                                                    fontSize: '12px',
                                                    color: message.sender === userSettings?.username ? '#3498db' : '#2c3e50'
                                                }}>
                                                    {message.sender}
                                                </span>
                                                <span style={{
                                                    fontSize: '10px',
                                                    color: '#6c757d'
                                                }}>
                                                    {message.timestamp.toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div style={{
                                                backgroundColor: message.sender === userSettings?.username ? '#3498db' : '#f8f9fa',
                                                color: message.sender === userSettings?.username ? 'white' : '#2c3e50',
                                                padding: '8px 12px',
                                                borderRadius: '12px',
                                                fontSize: '14px',
                                                wordBreak: 'break-word',
                                                alignSelf: message.sender === userSettings?.username ? 'flex-end' : 'flex-start',
                                                maxWidth: '80%'
                                            }}>
                                                {message.message}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </>
                        ) : (
                            // 참가자 탭
                            <>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '15px',
                                    paddingBottom: '10px',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: '#495057' }}>
                                        전체 참가자: {participants.length}명
                                    </h4>
                                </div>

                                {/* 참여자 그룹 */}
                                {participants.filter(p => !p.isViewer).length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h5 style={{
                                            margin: '0 0 10px 0',
                                            fontSize: '12px',
                                            color: '#00ff00',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase'
                                        }}>
                                            🎥 참여자 ({participants.filter(p => !p.isViewer).length}명)
                                        </h5>
                                        {participants.filter(p => !p.isViewer).map((participant) => (
                                            <div key={participant.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '8px 12px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '6px',
                                                marginBottom: '6px',
                                                border: participant.isLocal ? '2px solid #3498db' : '1px solid #e9ecef'
                                            }}>
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    backgroundColor: participant.isLocal ? '#3498db' : '#28a745',
                                                    marginRight: '10px'
                                                }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        color: participant.isLocal ? '#3498db' : '#495057'
                                                    }}>
                                                        {participant.name}
                                                        {participant.isLocal && ' (나)'}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: '#6c757d',
                                                        display: 'flex',
                                                        gap: '10px'
                                                    }}>
                                                        <span>{participant.isAudioEnabled ? '🔊' : '🔇'} 오디오</span>
                                                        <span>{participant.isVideoEnabled ? '📹' : '📷'} 비디오</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 시청자 그룹 */}
                                {participants.filter(p => p.isViewer).length > 0 && (
                                    <div>
                                        <h5 style={{
                                            margin: '0 0 10px 0',
                                            fontSize: '12px',
                                            color: '#ffd700',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase'
                                        }}>
                                            👁️ 시청자 ({participants.filter(p => p.isViewer).length}명)
                                        </h5>
                                        {participants.filter(p => p.isViewer).map((participant) => (
                                            <div key={participant.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '8px 12px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '6px',
                                                marginBottom: '6px',
                                                border: participant.isLocal ? '2px solid #3498db' : '1px solid #e9ecef'
                                            }}>
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    backgroundColor: participant.isLocal ? '#3498db' : '#ffd700',
                                                    marginRight: '10px'
                                                }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        color: participant.isLocal ? '#3498db' : '#495057'
                                                    }}>
                                                        {participant.name}
                                                        {participant.isLocal && ' (나)'}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: '#6c757d'
                                                    }}>
                                                        시청 모드
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* 채팅 입력 영역 - 채팅 탭에서만 표시 */}
                    {activeTab === 'chat' && (
                        <div style={{
                            padding: '15px',
                            borderTop: '1px solid #e9ecef',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'flex-end'
                            }}>
                                <textarea
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={handleChatKeyPress}
                                    placeholder="메시지를 입력하세요..."
                                    style={{
                                        flex: 1,
                                        minHeight: '40px',
                                        maxHeight: '100px',
                                        padding: '8px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        resize: 'none',
                                        fontSize: '14px',
                                        fontFamily: 'inherit'
                                    }}
                                />
                                <button
                                    onClick={sendChatMessage}
                                    disabled={!chatInput.trim()}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: chatInput.trim() ? '#3498db' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                                        fontSize: '14px',
                                        transition: 'background-color 0.2s ease'
                                    }}
                                >
                                    전송
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 하단 컨트롤 바 */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #e9ecef',
                gap: '20px',
                zIndex: 1000
            }}>
                {/* 참여하기일 때만 오디오/비디오 컨트롤 표시 */}
                {userSettings?.joinType === 'participate' && (
                    <>
                        {/* 오디오 토글 버튼 */}
                        <button
                            onClick={toggleLocalAudio}
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: isLocalAudioMuted ? '#e74c3c' : '#3498db',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                transition: 'all 0.2s ease'
                            }}
                            title={isLocalAudioMuted ? '마이크 켜기' : '마이크 끄기'}
                        >
                            {isLocalAudioMuted ? '🔇' : '🎤'}
                        </button>

                        {/* 비디오 토글 버튼 */}
                        <button
                            onClick={toggleLocalVideo}
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: isLocalVideoMuted ? '#e74c3c' : '#3498db',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                transition: 'all 0.2s ease'
                            }}
                            title={isLocalVideoMuted ? '카메라 켜기' : '카메라 끄기'}
                        >
                            {isLocalVideoMuted ? '📹' : '📷'}
                        </button>
                    </>
                )}

                {/* 방 나가기 버튼 */}
                <button
                    onClick={leaveRoom}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#c82333'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc3545'
                        e.currentTarget.style.transform = 'translateY(0)'
                    }}
                    title="방 나가기"
                >
                    🚪 방 나가기
                </button>
            </div>
        </div>
    )
}

export default RoomPage 
