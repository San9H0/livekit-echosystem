import React, { useState } from 'react'

interface CreateRoomModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (roomData: CreateRoomData) => void
    loading?: boolean
}

export interface CreateRoomData {
    name: string
    description: string
    maxParticipants: number
    isPrivate: boolean
    userId: string
}

// 에러 메시지 전용 타입
interface FormErrors {
    name?: string
    description?: string
    maxParticipants?: string
    isPrivate?: string
    userId?: string
}

const CreateRoomModal = ({
    isOpen,
    onClose,
    onSubmit,
    loading = false
}: CreateRoomModalProps) => {
    const [formData, setFormData] = useState<CreateRoomData>({
        name: '',
        description: '',
        maxParticipants: 10,
        isPrivate: false,
        userId: ''
    })

    const [errors, setErrors] = useState<FormErrors>({})

    const handleInputChange = (field: keyof CreateRoomData, value: string | number | boolean) => {
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

        if (!formData.name.trim()) {
            newErrors.name = '방 이름을 입력해주세요'
        } else if (formData.name.length < 2) {
            newErrors.name = '방 이름은 2자 이상이어야 합니다'
        } else if (formData.name.length > 50) {
            newErrors.name = '방 이름은 50자 이하여야 합니다'
        }

        if (formData.description.length > 200) {
            newErrors.description = '방 설명은 200자 이하여야 합니다'
        }

        if (formData.maxParticipants < 2 || formData.maxParticipants > 50) {
            newErrors.maxParticipants = '참가자 수는 2-50명 사이여야 합니다'
        }

        if (!formData.userId.trim()) {
            newErrors.userId = '사용자 ID를 입력해주세요'
        } else if (formData.userId.length < 2) {
            newErrors.userId = '사용자 ID는 2자 이상이어야 합니다'
        } else if (formData.userId.length > 20) {
            newErrors.userId = '사용자 ID는 20자 이하여야 합니다'
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
                name: '',
                description: '',
                maxParticipants: 10,
                isPrivate: false,
                userId: ''
            })
            setErrors({})
            onClose()
        }
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
                        🏠 새 방 만들기
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

                {/* 폼 */}
                <form onSubmit={handleSubmit}>
                    {/* 방 이름 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            방 이름 *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="방 이름을 입력하세요"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: `1px solid ${errors.name ? '#ef4444' : '#d1d5db'}`,
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
                                    e.target.style.borderColor = errors.name ? '#ef4444' : '#d1d5db'
                                }
                            }}
                        />
                        {errors.name && (
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '12px',
                                color: '#ef4444'
                            }}>
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* 사용자 ID */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            사용자 ID *
                        </label>
                        <input
                            type="text"
                            value={formData.userId}
                            onChange={(e) => handleInputChange('userId', e.target.value)}
                            placeholder="사용자 ID를 입력하세요"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: `1px solid ${errors.userId ? '#ef4444' : '#d1d5db'}`,
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
                                    e.target.style.borderColor = errors.userId ? '#ef4444' : '#d1d5db'
                                }
                            }}
                        />
                        {errors.userId && (
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '12px',
                                color: '#ef4444'
                            }}>
                                {errors.userId}
                            </p>
                        )}
                    </div>

                    {/* 방 설명 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            방 설명
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="방에 대한 설명을 입력하세요 (선택사항)"
                            disabled={loading}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: `1px solid ${errors.description ? '#ef4444' : '#d1d5db'}`,
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                                backgroundColor: loading ? '#f9fafb' : 'white',
                                resize: 'vertical'
                            }}
                            onFocus={(e) => {
                                if (!loading) {
                                    e.target.style.borderColor = '#3b82f6'
                                }
                            }}
                            onBlur={(e) => {
                                if (!loading) {
                                    e.target.style.borderColor = errors.description ? '#ef4444' : '#d1d5db'
                                }
                            }}
                        />
                        {errors.description && (
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '12px',
                                color: '#ef4444'
                            }}>
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* 최대 참가자 수 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            최대 참가자 수
                        </label>
                        <select
                            value={formData.maxParticipants}
                            onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: `1px solid ${errors.maxParticipants ? '#ef4444' : '#d1d5db'}`,
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                                backgroundColor: loading ? '#f9fafb' : 'white',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {[5, 10, 15, 20, 30, 50].map(num => (
                                <option key={num} value={num}>
                                    {num}명
                                </option>
                            ))}
                        </select>
                        {errors.maxParticipants && (
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '12px',
                                color: '#ef4444'
                            }}>
                                {errors.maxParticipants}
                            </p>
                        )}
                    </div>

                    {/* 비공개 방 설정 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={formData.isPrivate}
                                onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                                disabled={loading}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            />
                            🔒 비공개 방
                        </label>
                    </div>

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
                                    생성 중...
                                </>
                            ) : (
                                <>
                                    <span>➕</span>
                                    방 만들기
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

export default CreateRoomModal 
