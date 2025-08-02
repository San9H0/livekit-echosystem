import { useState } from 'react'
import ViewerSetupScreen from '../components/ViewerSetupScreen'
import ViewerLiveScreen from '../components/ViewerLiveScreen'
import type { Room } from '../clients/backendClient'

interface SubscriberPageProps {
  room: Room
  onNavigateToLobby: () => void
}

function SubscriberPage({ room, onNavigateToLobby }: SubscriberPageProps) {
  const [currentScreen, setCurrentScreen] = useState<'setup' | 'live'>('setup')
  const [viewerName, setViewerName] = useState<string>('')

  const handleJoinRoom = async (viewerName: string) => {
    setViewerName(viewerName)
    setCurrentScreen('live')
  }

  const handleBackToSetup = () => {
    setCurrentScreen('setup')
    setViewerName('')
  }

  return (
    <>
      {currentScreen === 'setup' && (
        <ViewerSetupScreen
          room={room}
          onJoinRoom={handleJoinRoom}
          onBack={onNavigateToLobby}
        />
      )}

      {currentScreen === 'live' && viewerName && (
        <ViewerLiveScreen
          room={room}
          viewerName={viewerName}
          onBack={handleBackToSetup}
        />
      )}
    </>
  )
}

export default SubscriberPage 
