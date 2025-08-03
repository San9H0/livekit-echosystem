import { useMemo } from 'react';
import {
    type ReceivedChatMessage,
    type TextStreamData,
    useChat,
    useRoomContext,
    useTranscriptions,
} from '@livekit/components-react';
import type { Room, Participant } from 'livekit-client';

// 전사 데이터를 채팅 메시지로 변환하는 유틸리티 함수
const transcriptionToChatMessage = (
    transcription: TextStreamData,
    room: Room
): ReceivedChatMessage => {
    // 전사된 참가자 찾기
    let fromParticipant: Participant | undefined;

    // 로컬 참가자인지 확인
    if (transcription.participantInfo?.identity === room.localParticipant.identity) {
        fromParticipant = room.localParticipant;
    } else {
        // 원격 참가자 중에서 찾기
        fromParticipant = Array.from(room.remoteParticipants.values()).find(
            (p) => p.identity === transcription.participantInfo?.identity
        );
    }

    return {
        id: `transcription-${transcription.streamInfo?.id || Date.now()}`,
        timestamp: transcription.streamInfo?.timestamp || Date.now(),
        message: transcription.text,
        from: fromParticipant || room.localParticipant, // 기본값으로 로컬 참가자 설정
    };
};

interface ChatAndTranscriptionReturn {
    messages: ReceivedChatMessage[];
    send: ReturnType<typeof useChat>['send'];
}

export function useChatAndTranscription(): ChatAndTranscriptionReturn {
    const transcriptions: TextStreamData[] = useTranscriptions();
    const chat = useChat();
    const room = useRoomContext();

    const mergedTranscriptions = useMemo(() => {
        const merged: Array<ReceivedChatMessage> = [
            ...transcriptions.map((transcription) => transcriptionToChatMessage(transcription, room)),
            ...chat.chatMessages,
        ];
        return merged.sort((a, b) => a.timestamp - b.timestamp);
    }, [transcriptions, chat.chatMessages, room]);

    return {
        messages: mergedTranscriptions,
        send: chat.send
    };
}
