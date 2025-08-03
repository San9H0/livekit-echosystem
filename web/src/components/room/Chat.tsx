import React, { useState, useRef, useEffect } from 'react';
import { useChatAndTranscription } from '@/hooks/useChatAndTranscription';
import { Chat, ChatEntry } from '@livekit/components-react';
interface ChatProps {
    className?: string;
    style?: React.CSSProperties;
}

interface ChatMessage {
    id: string;
    message: string;
    timestamp: number;
    from?: any;
    isTranscription?: boolean;
}

export const ChatComponent: React.FC = () => {
    // const { messages, send } = useChatAndTranscription();
    // const [chatInput, setChatInput] = useState('');
    // const [isTyping, setIsTyping] = useState(false);
    // const messagesEndRef = useRef<HTMLDivElement>(null);

    // // 메시지 목록 자동 스크롤
    // const scrollToBottom = () => {
    //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // };

    // useEffect(() => {
    //     scrollToBottom();
    // }, [messages]);


    console.log('ChatComponent rendered');
    return (
        <Chat></Chat>
    );
};

