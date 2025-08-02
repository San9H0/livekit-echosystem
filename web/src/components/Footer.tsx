import React from 'react'

const Footer = () => {
    const currentYear = new Date().getFullYear()

    return (
        <footer style={{
            backgroundColor: '#1f2937',
            color: '#f9fafb',
            padding: '24px',
            textAlign: 'center',
            borderTop: '1px solid #374151'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
            }}>
                {/* 로고 및 브랜드 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#3b82f6',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}>
                        🎥
                    </div>
                    <span style={{
                        fontSize: '18px',
                        fontWeight: '600'
                    }}>
                        LiveKit Conference
                    </span>
                </div>

                {/* 저작권 정보 */}
                <div style={{
                    fontSize: '14px',
                    color: '#d1d5db',
                    lineHeight: '1.5'
                }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                        © {currentYear} LiveKit Conference. All rights reserved.
                    </p>
                    <p style={{ margin: 0 }}>
                        Made with ❤️ by <strong style={{ color: '#3b82f6' }}>LiveKit Team</strong>
                    </p>
                </div>

                {/* 링크들 */}
                <div style={{
                    display: 'flex',
                    gap: '24px',
                    marginTop: '8px'
                }}>
                    <a
                        href="#"
                        style={{
                            color: '#9ca3af',
                            textDecoration: 'none',
                            fontSize: '13px',
                            transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#3b82f6'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#9ca3af'
                        }}
                    >
                        개인정보처리방침
                    </a>
                    <a
                        href="#"
                        style={{
                            color: '#9ca3af',
                            textDecoration: 'none',
                            fontSize: '13px',
                            transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#3b82f6'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#9ca3af'
                        }}
                    >
                        이용약관
                    </a>
                    <a
                        href="#"
                        style={{
                            color: '#9ca3af',
                            textDecoration: 'none',
                            fontSize: '13px',
                            transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#3b82f6'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#9ca3af'
                        }}
                    >
                        고객지원
                    </a>
                    <a
                        href="#"
                        style={{
                            color: '#9ca3af',
                            textDecoration: 'none',
                            fontSize: '13px',
                            transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#3b82f6'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#9ca3af'
                        }}
                    >
                        개발자 문서
                    </a>
                </div>

                {/* 기술 스택 정보 */}
                <div style={{
                    marginTop: '16px',
                    padding: '12px 20px',
                    backgroundColor: '#374151',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#9ca3af'
                }}>
                    <span>Powered by </span>
                    <strong style={{ color: '#3b82f6' }}>LiveKit</strong>
                    <span>, </span>
                    <strong style={{ color: '#3b82f6' }}>React</strong>
                    <span>, </span>
                    <strong style={{ color: '#3b82f6' }}>TypeScript</strong>
                    <span> & </span>
                    <strong style={{ color: '#3b82f6' }}>WebRTC</strong>
                </div>
            </div>
        </footer>
    )
}

export default Footer 
