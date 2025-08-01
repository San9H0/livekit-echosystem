import { useState, useEffect } from 'react'
import BroadcastScreen from './components/BroadcastScreen'

// Room 타입을 inline으로 정의
interface Room {
  name: string
  metadata: { [key: string]: any } | null
  num_participants: number
  creation_time: number
  empty_timeout: number
  max_participants: number
}

function App() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBroadcast, setShowBroadcast] = useState(false)

  const fetchRooms = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 백엔드 API 호출 (8080 포트) - streams 엔드포인트 사용
      const response = await fetch('http://localhost:8080/api/streams')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setRooms(data.rooms || [])
    } catch (err) {
      console.error('Failed to fetch rooms:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch rooms')
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 방 목록 자동 로드
  useEffect(() => {
    fetchRooms()
  }, [])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('ko-KR')
  }

  const getMetadataDisplay = (metadata: any) => {
    if (!metadata) return null
    
    // creator_identity가 있으면 방송자 정보로 표시
    if (metadata.creator_identity) {
      return `방송자: ${metadata.creator_identity}`
    }
    
    // title이 있으면 제목으로 표시
    if (metadata.title) {
      return `제목: ${metadata.title}`
    }
    
    // 그 외의 경우 전체 메타데이터를 JSON으로 표시
    return `정보: ${JSON.stringify(metadata)}`
  }

  const handleJoinRoom = (roomName: string) => {
    // 나중에 방 입장 기능 구현
    console.log('Joining room:', roomName)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1>LiveKit 방송 플랫폼</h1>
        </div>
      </header>
      
      <main className="container">
        {showBroadcast ? (
          // 방송자 화면
          <BroadcastScreen onBack={() => setShowBroadcast(false)} />
        ) : (
          // 메인 로비 화면 - 방송 리스트
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2>현재 진행 중인 방송 ({rooms.length}개)</h2>
              <div>
                <button 
                  onClick={fetchRooms}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginRight: '10px',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? '새로고침 중...' : '새로고침'}
                </button>
                <button 
                  onClick={() => setShowBroadcast(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  방송하기
                </button>
              </div>
            </div>

            {loading && (
              <div className="loading">
                <p>방송 리스트를 불러오는 중...</p>
              </div>
            )}

            {error && (
              <div className="error">
                <p>오류가 발생했습니다: {error}</p>
                <button 
                  onClick={fetchRooms}
                  style={{
                    marginTop: '10px',
                    padding: '10px 20px',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  다시 시도
                </button>
              </div>
            )}

            {!loading && !error && rooms.length === 0 && (
              <div className="empty-state">
                <h3>현재 진행 중인 방송이 없습니다</h3>
                <p>새로운 방송이 시작되면 여기에 표시됩니다.</p>
                <p style={{ marginTop: '20px' }}>
                  <strong>방송하기</strong> 버튼을 클릭해서 새로운 방송을 시작해보세요!
                </p>
              </div>
            )}

            {!loading && !error && rooms.length > 0 && (
              <div className="room-list">
                {rooms.map((room) => (
                  <div key={room.name} className="room-card" onClick={() => handleJoinRoom(room.name)}>
                    <h3>{room.name}</h3>
                    <div className="room-info">
                      <p><strong>참가자:</strong> {room.num_participants}명</p>
                      <p><strong>최대 참가자:</strong> {room.max_participants}명</p>
                      <p><strong>생성 시간:</strong> {formatDate(room.creation_time)}</p>
                      <p><strong>빈 방 대기시간:</strong> {room.empty_timeout}초</p>
                      {room.metadata && (
                        <p><strong>{getMetadataDisplay(room.metadata)}</strong></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App