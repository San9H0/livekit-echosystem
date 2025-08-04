pip install \
  "livekit-agents[deepgram,openai,cartesia,silero,turn-detector]~=1.0" \
  "livekit-plugins-noise-cancellation~=0.2" \
  "python-dotenv"



curl -X POST https://api.cartesia.ai/tts/bytes \
-H "Cartesia-Version: 2024-06-10" \
-H "X-API-Key: API-KEY" \
-H "Content-Type: application/json" \
-d '{
  "model_id": "sonic-2",
  "transcript": "이전 강의에서는 클라이언트 디바이스를 WebRTC를 통해 보이스 에이전트에 연결하는 방법에 대해 살펴보았습니다.\n좋습니다. 이제 사용자는 에이전트와 30~50밀리초 이하의 지연 시간으로 대화할 수 있게 되었습니다.\n\n그런데 보이스 에이전트란 도대체 무엇일까요?\n보이스 에이전트는 기본적으로 상태를 유지하는 컴퓨터 프로그램으로, 사용자 휴대폰 등에서 들어오는 음성 데이터를 스트리밍으로 수신하고 이를 처리하며, 사용자에게 다시 음성 응답을 생성하여 전달할 수 있는 기능을 갖추고 있습니다.\n에이전트 프로그램의 대부분의 응용 로직은 사용 사례에 따라 달라질 것입니다.",
  "voice": {
    "mode": "id",
    "id": "af6beeea-d732-40b6-8292-73af0035b740"
  },
  "output_format": {
    "container": "wav",
    "encoding": "pcm_f32le",
    "sample_rate": 44100
  },
  "language": "ko"
}'
  
