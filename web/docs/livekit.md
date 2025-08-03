LiveKit Docs › LiveKit SDKs › Platform-specific quickstarts › React

---

# React quickstart

> Get started with LiveKit and React.

## Voice AI quickstart

To build your first voice AI app for Next.js, use the following quickstart and the starter app. Otherwise follow the getting started guide below.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Create a voice AI agent in less than 10 minutes.

- **[Next.js Voice Agent](https://github.com/livekit-examples/agent-starter-react)**: A web voice AI assistant built with React and Next.js.

## Getting started guide

This guide walks you through the steps to build a video-conferencing application using React. It uses the [LiveKit React components library](https://docs.livekit.io/reference/components/react.md) to render the UI and communicate with LiveKit servers via WebRTC. By the end, you will have a basic video-conferencing application you can run with multiple participants.

### Install LiveKit SDK

Install the LiveKit SDK:

**yarn**:

```shell
yarn add @livekit/components-react @livekit/components-styles livekit-client

```

---

**npm**:

```shell
npm install @livekit/components-react @livekit/components-styles livekit-client --save

```

### Join a room

Update the `serverUrl` and `token` values and copy and paste the following into your `src/App.tsx` file. To generate a token for this example, see [Creating a token](https://docs.livekit.io/home/get-started/authentication.md#creating-a-token).

> ℹ️ **Note**
> 
> This example hardcodes a token. In a real app, your server generates a token for you.

```tsx
import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  RoomContext,
} from '@livekit/components-react';
import { Room, Track } from 'livekit-client';
import '@livekit/components-styles';
import { useState } from 'react';

const serverUrl = '%{wsURL}%';
const token = '%{token}%';

export default function App() {
  const [room] = useState(() => new Room({
    // Optimize video quality for each participant's screen
    adaptiveStream: true,
    // Enable automatic audio/video quality optimization
    dynacast: true,
  }));

  // Connect to room
  useEffect(() => {
    let mounted = true;
    
    const connect = async () => {
      if (mounted) {
        await room.connect(serverUrl, token);
      }
    };
    connect();

    return () => {
      mounted = false;
      room.disconnect();
    };
  }, [room]);

  return (
    <RoomContext.Provider value={room}>
      <div data-lk-theme="default" style={{ height: '100vh' }}>
        {/* Your custom component with basic video conferencing functionality. */}
        <MyVideoConference />
        {/* The RoomAudioRenderer takes care of room-wide audio for you. */}
        <RoomAudioRenderer />
        {/* Controls for the user to start/stop audio, video, and screen share tracks */}
        <ControlBar />
      </div>
    </RoomContext.Provider>
  );
}

function MyVideoConference() {
  // `useTracks` returns all camera and screen share tracks. If a user
  // joins without a published camera track, a placeholder track is returned.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }}>
      {/* The GridLayout accepts zero or one child. The child is used
      as a template to render all passed in tracks. */}
      <ParticipantTile />
    </GridLayout>
  );
}

```

## Next steps

The following resources are useful for getting started with LiveKit on React.

- **[Generating tokens](https://docs.livekit.io/home/server/generating-tokens.md)**: Guide to generating authentication tokens for your users.

- **[Realtime media](https://docs.livekit.io/home/client/tracks.md)**: Complete documentation for live video and audio tracks.

- **[Realtime data](https://docs.livekit.io/home/client/data.md)**: Send and receive realtime data between clients.

- **[JavaScript SDK](https://github.com/livekit/client-sdk-js)**: LiveKit JavaScript SDK on GitHub.

- **[React components](https://github.com/livekit/components-js)**: LiveKit React components on GitHub.

- **[JavaScript SDK reference](https://docs.livekit.io/reference/client-sdk-js.md)**: LiveKit JavaScript SDK reference docs.

- **[React components reference](https://docs.livekit.io/reference/components/react.md)**: LiveKit React components reference docs.

---

This document was rendered at 2025-08-02T16:26:33.481Z.
For the latest version of this document, see [https://docs.livekit.io/home/quickstarts/react.md](https://docs.livekit.io/home/quickstarts/react.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).



React Components
React Components are the easiest way to build realtime audio/video apps with React. No need to manage state or events; it's all done for you.

Copy page
See more page options
Featured components
A selected collection of components that we consider important and a good starting point for most applications.

LiveKitRoom

VideoTrack

AudioTrack

ParticipantTile

RoomAudioRenderer

TrackLoop

Layouts
Layouts are components that help you arrange video or audio tracks in standard conference layouts.

CarouselLayout
CarouselLayout

FocusLayout
FocusLayout

GridLayout
GridLayout

Participant components
A collection of components that are somewhat related to a participant, for example, to help you render a participant's audio or video track.

AudioTrack

AudioVisualizer

ConnectionQualityIndicator

ParticipantAudioTile

ParticipantName

ParticipantTile

TrackMutedIndicator

VideoTrack

Controls components
These components provide UI elements for controlling video, audio and screen sharing tracks, as well as the status of the room or UI elements.

ChatToggle

ClearPinButton

DisconnectButton

FocusToggle

MediaDeviceSelect

StartAudio

TrackToggle

More components
BarVisualizer

ChatEntry

ConnectionState

ConnectionStateToast

FocusLayoutContainer

LayoutContext

LayoutContextProvider

LiveKitRoom

ParticipantContext

ParticipantContextIfNeeded

ParticipantLoop

RoomAudioRenderer

RoomContext

RoomName

StartMediaButton

Toast

TrackLoop

TrackRefContext

VoiceAssistantControlBar

Prefabs
Prefabs are built atop components, enriched with added functionalities, distinctive styles, and practical defaults. Designed for direct use, they're not intended for extension. Utilize them as-is or as a blueprint for developing your own unique components.

AudioConference
AudioConference

Chat
Chat

ControlBar
ControlBar

MediaDeviceMenu
MediaDeviceMenu

PreJoin
PreJoin

VideoConference
VideoConference

### LiveKitRoom
The LiveKitRoom component provides the room context to all its child components. It is generally the starting point of your LiveKit app and the root of the LiveKit component tree. It provides the room state as a React context to all child components, so you don't have to pass it yourself.

Import
import { LiveKitRoom } from "@livekit/components-react";

Usage
<LiveKitRoom token="<livekit-token>" serverUrl="<url-to-livekit-server>" connect={true}>
  ...
</LiveKitRoom>

Properties
serverUrl
string | undefined
Required
URL to the LiveKit server. For example: wss://<domain>.livekit.cloud To simplify the implementation, undefined is also accepted as an intermediate value, but only with a valid string url can the connection be established.

token
string | undefined
Required
A user specific access token for a client to authenticate to the room. This token is necessary to establish a connection to the room. To simplify the implementation, undefined is also accepted as an intermediate value, but only with a valid string token can the connection be established.

audio
AudioCaptureOptions 
