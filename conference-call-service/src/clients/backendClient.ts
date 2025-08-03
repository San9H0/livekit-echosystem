// 백엔드 API 클라이언트
const API_BASE_URL = 'http://localhost:8080/api'

// 참가자 타입 정의
export interface Participant {
  identity: string
  name: string
  state: string
  joined_at: number
  is_publisher: boolean
}

// Room 타입 정의
export interface Room {
  room_id: string
  metadata: { [key: string]: any } | null
  num_participants: number
  creation_time: number
  empty_timeout: number
  max_participants: number
  participants?: Participant[]
}

// 스트림 생성 요청 타입
export interface CreateStreamRequest {
  metadata: {
    creator_identity: string
    title: string
    description: string
    type: string
    isPrivate: boolean
  }
}

// 스트림 생성 응답 타입
export interface CreateStreamResponse {
  room_id: string
  connection_details: {
    ws_url: string
    token: string
  }
}

// 시청자 참여 요청 타입
export interface JoinStreamRequest {
  room_id: string
  identity: string
}

// 시청자 참여 응답 타입
export interface JoinStreamResponse {
  connection_details: {
    ws_url: string
    token: string
  }
}

// 방 목록 응답 타입
export interface StreamsResponse {
  rooms: Room[]
}

/**
 * 백엔드 API 클라이언트
 */
export class BackendClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * 스트림 생성
   */
  async createStream(request: CreateStreamRequest): Promise<CreateStreamResponse> {
    const url = `${this.baseUrl}/create_stream`
    const requestBody = JSON.stringify(request)

    // 요청 로그
    console.log('[BackendClient] 스트림 생성 요청 전송:', {
      url,
      method: 'POST',
      requestBody: JSON.parse(requestBody),
      timestamp: new Date().toISOString()
    })

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody
      })

      // 응답 로그
      console.log('[BackendClient] 스트림 생성 응답 수신:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[BackendClient] 스트림 생성 실패:', {
          url,
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          timestamp: new Date().toISOString()
        })
        throw new Error(`Failed to create stream: ${response.status} - ${errorText}`)
      }

      const responseData = await response.json()
      console.log('[BackendClient] 스트림 생성 성공:', {
        url,
        status: response.status,
        responseData,
        timestamp: new Date().toISOString()
      })

      return responseData
    } catch (error) {
      console.error('[BackendClient] 스트림 생성 네트워크 오류:', {
        url,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }

  /**
   * 방 목록 조회
   */
  async getStreams(): Promise<StreamsResponse> {
    const url = `${this.baseUrl}/streams`

    // 요청 로그
    console.log('[BackendClient] 방 목록 조회 요청 전송:', {
      url,
      method: 'GET',
      timestamp: new Date().toISOString()
    })

    try {
      const response = await fetch(url)

      // 응답 로그
      console.log('[BackendClient] 방 목록 조회 응답 수신:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[BackendClient] 방 목록 조회 실패:', {
          url,
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          timestamp: new Date().toISOString()
        })
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const responseData = await response.json()
      console.log('[BackendClient] 방 목록 조회 성공:', {
        url,
        status: response.status,
        responseData,
        timestamp: new Date().toISOString()
      })

      return responseData
    } catch (error) {
      console.error('[BackendClient] 방 목록 조회 네트워크 오류:', {
        url,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }

  /**
   * 방 목록만 조회 (간편 메서드)
   */
  async getRooms(): Promise<Room[]> {
    const response = await this.getStreams()
    return response.rooms || []
  }

  /**
   * 시청자로 방 참여
   */
  async joinStream(request: JoinStreamRequest): Promise<JoinStreamResponse> {
    const url = `${this.baseUrl}/join_stream`
    const requestBody = JSON.stringify(request)

    // 요청 로그
    console.log('[BackendClient] 시청자 참여 요청 전송:', {
      url,
      method: 'POST',
      requestBody: JSON.parse(requestBody),
      timestamp: new Date().toISOString()
    })

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody
      })

      // 응답 로그
      console.log('[BackendClient] 시청자 참여 응답 수신:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[BackendClient] 시청자 참여 실패:', {
          url,
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          timestamp: new Date().toISOString()
        })
        throw new Error(`Failed to join stream: ${response.status} - ${errorText}`)
      }

      const responseData = await response.json()
      console.log('[BackendClient] 시청자 참여 성공:', {
        url,
        status: response.status,
        responseData,
        timestamp: new Date().toISOString()
      })

      return responseData
    } catch (error) {
      console.error('[BackendClient] 시청자 참여 네트워크 오류:', {
        url,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }

  /**
   * 방 삭제
   */
  async deleteRoom(roomName: string): Promise<void> {
    const url = `${this.baseUrl}/streams/${roomName}`

    // 요청 로그
    console.log('[BackendClient] 방 삭제 요청 전송:', {
      url,
      method: 'DELETE',
      timestamp: new Date().toISOString()
    })

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // 응답 로그
      console.log('[BackendClient] 방 삭제 응답 수신:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[BackendClient] 방 삭제 실패:', {
          url,
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          timestamp: new Date().toISOString()
        })
        throw new Error(`Failed to delete room: ${response.status} - ${errorText}`)
      }

      console.log('[BackendClient] 방 삭제 성공:', {
        url,
        status: response.status,
        roomName,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('[BackendClient] 방 삭제 네트워크 오류:', {
        url,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }
}

// 기본 인스턴스 export
export const backendClient = new BackendClient() 
