export interface Room {
  name: string
  metadata: { [key: string]: any } | null
  num_participants: number
  creation_time: number
  empty_timeout: number
  max_participants: number
}

export interface RoomListResponse {
  rooms: Room[]
  total: number
}