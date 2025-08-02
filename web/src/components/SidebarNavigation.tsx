import React from 'react'

interface SidebarNavigationProps {
    activeRooms: number
    totalParticipants: number
    onRefresh: () => void
}

const SidebarNavigation = ({
    activeRooms,
    totalParticipants,
    onRefresh
}: SidebarNavigationProps) => {
    return (
        <aside style={{
            width: '280px',
            backgroundColor: '#f8fafc',
            borderRight: '1px solid #e1e5e9',
            padding: '24px 0',
            height: 'calc(100vh - 80px)', // 헤더 높이 제외
            overflowY: 'auto'
        }}>
            {/* 통계 정보 */}
            <div style={{
                padding: '0 24px 24px 24px',
                borderBottom: '1px solid #e1e5e9',
                marginBottom: '24px'
            }}>
                <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937'
                }}>
                    📊 실시간 통계
                </h3>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e1e5e9'
                    }}>
                        <span style={{
                            fontSize: '14px',
                            color: '#6b7280'
                        }}>
                            활성 방
                        </span>
                        <span style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#3b82f6'
                        }}>
                            {activeRooms}개
                        </span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e1e5e9'
                    }}>
                        <span style={{
                            fontSize: '14px',
                            color: '#6b7280'
                        }}>
                            참가자
                        </span>
                        <span style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#10b981'
                        }}>
                            {totalParticipants}명
                        </span>
                    </div>
                </div>
            </div>

            {/* 메뉴 아이템들 */}
            <div style={{
                padding: '0 24px'
            }}>
                <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937'
                }}>
                    🚀 빠른 액션
                </h3>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <button
                        onClick={onRefresh}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e1e5e9',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#374151',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            width: '100%'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6'
                            e.currentTarget.style.borderColor = '#d1d5db'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff'
                            e.currentTarget.style.borderColor = '#e1e5e9'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>🔄</span>
                        방 목록 새로고침
                    </button>

                    <button
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e1e5e9',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#374151',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            width: '100%'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6'
                            e.currentTarget.style.borderColor = '#d1d5db'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff'
                            e.currentTarget.style.borderColor = '#e1e5e9'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>📋</span>
                        사용 가이드
                    </button>

                    <button
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e1e5e9',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#374151',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            width: '100%'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6'
                            e.currentTarget.style.borderColor = '#d1d5db'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff'
                            e.currentTarget.style.borderColor = '#e1e5e9'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>⚙️</span>
                        설정
                    </button>
                </div>
            </div>

            {/* 하단 정보 */}
            <div style={{
                padding: '24px',
                marginTop: 'auto',
                borderTop: '1px solid #e1e5e9'
            }}>
                <div style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    textAlign: 'center',
                    lineHeight: '1.4'
                }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                        LiveKit Conference v1.0.0
                    </p>
                    <p style={{ margin: 0 }}>
                        안정적인 화상회의를 제공합니다
                    </p>
                </div>
            </div>
        </aside>
    )
}

export default SidebarNavigation 
