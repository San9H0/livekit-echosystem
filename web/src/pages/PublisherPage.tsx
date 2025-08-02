import { useState } from 'react'
import BroadcastSetupScreen from '../components/BroadcastSetupScreen'
import BroadcastLiveScreen from '../components/BroadcastLiveScreen'

interface PublisherPageProps {
  onNavigateToLobby: () => void
}

function PublisherPage({ onNavigateToLobby }: PublisherPageProps) {
  const [currentScreen, setCurrentScreen] = useState<'setup' | 'live'>('setup')
  const [broadcastInfo, setBroadcastInfo] = useState<{
    roomName: string
    broadcasterName: string
    selectedVideoFile: File
  } | null>(null)

  const handleStartBroadcast = async (roomName: string, broadcasterName: string, selectedVideoFile: File) => {
    setBroadcastInfo({ roomName, broadcasterName, selectedVideoFile })
    setCurrentScreen('live')
  }

  const handleBackToSetup = () => {
    setCurrentScreen('setup')
    setBroadcastInfo(null)
  }

  return (
    <>
      {currentScreen === 'setup' && (
        <BroadcastSetupScreen
          onStartBroadcast={handleStartBroadcast}
          onBack={onNavigateToLobby}
        />
      )}

      {currentScreen === 'live' && broadcastInfo && (
        <BroadcastLiveScreen
          roomName={broadcastInfo.roomName}
          broadcasterName={broadcastInfo.broadcasterName}
          selectedVideoFile={broadcastInfo.selectedVideoFile}
          onBack={handleBackToSetup}
        />
      )}
    </>
  )
}

export default PublisherPage 
