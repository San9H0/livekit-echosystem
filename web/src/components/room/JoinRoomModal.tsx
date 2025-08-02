import React, { useState } from 'react'

interface JoinRoomModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (userData: JoinRoomData) => void
    loading?: boolean
    roomId: string
}

export interface JoinRoomData {
    username: string
    mediaFile?: File
    joinType: 'participate' | 'watch' // 참여하기 또는 시청하기
}

// 에러 메시지 전용 타입
interface FormErrors {
    username?: string
}

const JoinRoomModal = ({
    isOpen,
    onClose,
    onSubmit,
    loading = false,
    roomId
}: JoinRoomModalProps) => {
    const [formData, setFormData] = useState<JoinRoomData>({
        username: '',
        mediaFile: undefined,
        joinType: 'participate' // 기본값은 참여하기
    })

    const [errors, setErrors] = useState<FormErrors>({})

    const handleInputChange = (field: keyof JoinRoomData, value: string | File | undefined) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))

        // 에러 클리어
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }))
        }
    }

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        if (!formData.username.trim()) {
            newErrors.username = '사용자 이름을 입력해주세요'
        } else if (formData.username.length < 2) {
            newErrors.username = '사용자 이름은 2자 이상이어야 합니다'
        } else if (formData.username.length > 20) {
            newErrors.username = '사용자 이름은 20자 이하여야 합니다'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (validateForm()) {
            onSubmit(formData)
        }
    }

    const handleClose = () => {
        if (!loading) {
            setFormData({
                username: '',
                mediaFile: undefined,
                joinType: 'participate'
            })
            setErrors({})
            onClose()
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        handleInputChange('mediaFile', file)
    }

    if (!isOpen) return null

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                {/* 헤더 */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#1f2937'
                    }}>
                        🎥 방 입장
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            color: '#6b7280',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.backgroundColor = '#f3f4f6'
                                e.currentTarget.style.color = '#374151'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.color = '#6b7280'
                            }
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* 방 정보 */}
                <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '24px'
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#6b7280'
                    }}>
                        방 ID: <strong>{roomId}</strong>
                    </p>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit}>
                    {/* 사용자 이름 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            사용자 이름 *
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            placeholder="사용자 이름을 입력하세요"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: `1px solid ${errors.username ? '#ef4444' : '#d1d5db'}`,
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                                backgroundColor: loading ? '#f9fafb' : 'white'
                            }}
                            onFocus={(e) => {
                                if (!loading) {
                                    e.target.style.borderColor = '#3b82f6'
                                }
                            }}
                            onBlur={(e) => {
                                if (!loading) {
                                    e.target.style.borderColor = errors.username ? '#ef4444' : '#d1d5db'
                                }
                            }}
                        />
                        {errors.username && (
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '12px',
                                color: '#ef4444'
                            }}>
                                {errors.username}
                            </p>
                        )}
                    </div>

                    {/* 참여 방식 선택 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            참여 방식 *
                        </label>
                        <div style={{
                            display: 'flex',
                            gap: '12px'
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 16px',
                                border: `2px solid ${formData.joinType === 'participate' ? '#3b82f6' : '#d1d5db'}`,
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                backgroundColor: formData.joinType === 'participate' ? '#eff6ff' : 'white',
                                transition: 'all 0.2s ease',
                                flex: 1
                            }}>
                                <input
                                    type="radio"
                                    name="joinType"
                                    value="participate"
                                    checked={formData.joinType === 'participate'}
                                    onChange={(e) => handleInputChange('joinType', e.target.value as 'participate' | 'watch')}
                                    disabled={loading}
                                    style={{
                                        margin: 0,
                                        cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                />
                                <div>
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        color: '#374151'
                                    }}>
                                        🎥 참여하기
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        marginTop: '2px'
                                    }}>
                                        카메라와 마이크 사용
                                    </div>
                                </div>
                            </label>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 16px',
                                border: `2px solid ${formData.joinType === 'watch' ? '#3b82f6' : '#d1d5db'}`,
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                backgroundColor: formData.joinType === 'watch' ? '#eff6ff' : 'white',
                                transition: 'all 0.2s ease',
                                flex: 1
                            }}>
                                <input
                                    type="radio"
                                    name="joinType"
                                    value="watch"
                                    checked={formData.joinType === 'watch'}
                                    onChange={(e) => handleInputChange('joinType', e.target.value as 'participate' | 'watch')}
                                    disabled={loading}
                                    style={{
                                        margin: 0,
                                        cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                />
                                <div>
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        color: '#374151'
                                    }}>
                                        👁️ 시청하기
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        marginTop: '2px'
                                    }}>
                                        음성/영상만 시청
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* 미디어 파일 선택 - 참여하기일 때만 표시 */}
                    {formData.joinType === 'participate' && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#374151'
                            }}>
                                미디어 파일 (선택사항)
                            </label>
                            <input
                                type="file"
                                accept="video/*,audio/*"
                                onChange={handleFileChange}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease',
                                    backgroundColor: loading ? '#f9fafb' : 'white',
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            />
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '12px',
                                color: '#6b7280'
                            }}>
                                비디오나 오디오 파일을 선택하면 방송에 사용됩니다.
                            </p>
                            {formData.mediaFile && (
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '12px',
                                    color: '#10b981'
                                }}>
                                    선택된 파일: {formData.mediaFile.name}
                                </p>
                            )}
                        </div>
                    )}

                    {/* 버튼들 */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        marginTop: '32px'
                    }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.backgroundColor = '#e5e7eb'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                                }
                            }}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.backgroundColor = '#2563eb'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.backgroundColor = '#3b82f6'
                                }
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid transparent',
                                        borderTop: '2px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    입장 중...
                                </>
                            ) : (
                                <>
                                    <span>🚪</span>
                                    방 입장
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    )
}

export default JoinRoomModal 
