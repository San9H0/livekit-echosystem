import { useState, useEffect } from 'react'
import BroadcastScreen from './components/BroadcastScreen'
import ViewerScreen from './components/ViewerScreen'
import RoomList from './components/RoomList'
import { backendClient, type Room } from './clients/backendClient'

// Room 타입은 backendClient에서 import

function App() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const fetchRooms = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 백엔드 API 호출 - backendClient 사용
      const rooms = await backendClient.getRooms()
      setRooms(rooms)
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



  const handleJoinRoom = (room: Room) => {
    console.log('[App] 방 입장 시도:', { roomName: room.name })
    setSelectedRoom(room)
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
        ) : selectedRoom ? (
          // 시청자 화면
          <ViewerScreen 
            room={selectedRoom} 
            onBack={() => setSelectedRoom(null)} 
          />
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

              <RoomList 
                rooms={rooms}
                loading={loading}
                error={error}
                onRefresh={fetchRooms}
                onJoinRoom={handleJoinRoom}
              />
            </div>
        )}
      </main>
    </div>
  )
}

export default App