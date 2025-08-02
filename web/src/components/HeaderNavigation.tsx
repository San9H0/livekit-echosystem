import React from 'react'
import { useNavigate } from 'react-router-dom'

interface HeaderNavigationProps {
    onCreateRoom: () => void
    onNavigateToPublisher: () => void
}

const HeaderNavigation = ({
    onCreateRoom,
    onNavigateToPublisher
}: HeaderNavigationProps) => {
    const navigate = useNavigate()
    return (
        <header style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e1e5e9',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            {/* 로고 및 제목 영역 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease'
                }}
                onClick={() => navigate('/lobby')}
                onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                }}
            >
                <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 'bold'
                }}>
                    🎥
                </div>
                <div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#1f2937'
                    }}>
                        LiveKit Conference
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#6b7280',
                        marginTop: '2px'
                    }}>
                        실시간 화상회의 플랫폼
                    </p>
                </div>
            </div>

            {/* 우측 액션 버튼들 */}
            <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
            }}>
                <button
                    onClick={onCreateRoom}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b82f6'
                        e.currentTarget.style.transform = 'translateY(0)'
                    }}
                >
                    <span>➕</span>
                    방 만들기
                </button>

                <button
                    onClick={onNavigateToPublisher}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc2626'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef4444'
                        e.currentTarget.style.transform = 'translateY(0)'
                    }}
                >
                    <span>📹</span>
                    방송하기
                </button>
            </div>
        </header>
    )
}

export default HeaderNavigation 
