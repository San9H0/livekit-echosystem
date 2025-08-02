import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LobbyPage from './pages/lobby/LobbyPage'
import RoomPage from './pages/room/RoomPage'
import { type Room } from './clients/backendClient'

function App() {
  // 기본 네비게이션 함수들
  const handleNavigateToPublisher = () => {
    console.log('Publisher 페이지로 이동 (아직 구현되지 않음)')
  }

  const handleNavigateToSubscriber = (room: Room) => {
    console.log('Subscriber 페이지로 이동 (아직 구현되지 않음)', room)
  }

  const handleNavigateToJoinRoom = (room: Room) => {
    console.log('Join Room 페이지로 이동 (아직 구현되지 않음)', room)
  }

  const handleNavigateToCreateRoom = () => {
    console.log('Create Room 페이지로 이동 (아직 구현되지 않음)')
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* 기본 경로는 로비로 리다이렉트 */}
          <Route path="/" element={<Navigate to="/lobby" replace />} />

          {/* 로비 페이지 */}
          <Route
            path="/lobby"
            element={
              <LobbyPage
                onNavigateToPublisher={handleNavigateToPublisher}
                onNavigateToSubscriber={handleNavigateToSubscriber}
                onNavigateToJoinRoom={handleNavigateToJoinRoom}
                onNavigateToCreateRoom={handleNavigateToCreateRoom}
              />
            }
          />

          {/* 방 페이지 */}
          <Route path="/room/:roomId" element={<RoomPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
