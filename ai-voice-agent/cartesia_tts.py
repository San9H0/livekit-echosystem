import requests
import json

def generate_tts_audio(transcript, voice_id="af6beeea-d732-40b6-8292-73af0035b740"):
    """
    Cartesia TTS API를 사용하여 텍스트를 음성으로 변환합니다.
    
    Args:
        transcript (str): 음성으로 변환할 텍스트
        voice_id (str): 사용할 음성 ID (기본값: 한국어 음성)
    
    Returns:
        bytes: 오디오 데이터 (WAV 형식)
    """
    
    url = "https://api.cartesia.ai/tts/bytes"
    
    headers = {
        "Cartesia-Version": "2024-06-10",
        "X-API-Key": "API-KEY",
        "Content-Type": "application/json"
    }
    
    data = {
        "model_id": "sonic-2",
        "transcript": transcript,
        "voice": {
            "mode": "id",
            "id": voice_id
        },
        "output_format": {
            "container": "wav",
            "encoding": "pcm_f32le",
            "sample_rate": 44100
        },
        "language": "ko"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()  # HTTP 오류가 있으면 예외 발생
        
        # 오디오 데이터 반환
        return response.content
        
    except requests.exceptions.RequestException as e:
        print(f"TTS API 요청 중 오류 발생: {e}")
        return None

def save_audio_to_file(audio_data, filename="output.wav"):
    """
    오디오 데이터를 파일로 저장합니다.
    
    Args:
        audio_data (bytes): 저장할 오디오 데이터
        filename (str): 저장할 파일명
    """
    if audio_data:
        with open(filename, "wb") as f:
            f.write(audio_data)
        print(f"오디오가 {filename}에 저장되었습니다.")
    else:
        print("저장할 오디오 데이터가 없습니다.")

if __name__ == "__main__":
    # 예제 텍스트 (README.md에서 가져온 내용)
    sample_text = """이전 강의에서는 클라이언트 디바이스를 WebRTC를 통해 보이스 에이전트에 연결하는 방법에 대해 살펴보았습니다.
좋습니다. 이제 사용자는 에이전트와 30~50밀리초 이하의 지연 시간으로 대화할 수 있게 되었습니다.

그런데 보이스 에이전트란 도대체 무엇일까요?
보이스 에이전트는 기본적으로 상태를 유지하는 컴퓨터 프로그램으로, 사용자 휴대폰 등에서 들어오는 음성 데이터를 스트리밍으로 수신하고 이를 처리하며, 사용자에게 다시 음성 응답을 생성하여 전달할 수 있는 기능을 갖추고 있습니다.
에이전트 프로그램의 대부분의 응용 로직은 사용 사례에 따라 달라질 것입니다."""
    
    # TTS 생성
    print("TTS 오디오를 생성하는 중...")
    audio_data = generate_tts_audio(sample_text)
    
    # 파일로 저장
    if audio_data:
        save_audio_to_file(audio_data, "sample_output.wav")
    else:
        print("TTS 생성에 실패했습니다.") 
