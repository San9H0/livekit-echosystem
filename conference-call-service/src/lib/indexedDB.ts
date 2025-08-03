// IndexedDB 설정
const DB_NAME = 'LiveKitVideoDB'
const DB_VERSION = 1
const STORE_NAME = 'videoFiles'

// IndexedDB 초기화
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'fileName' })
      }
    }
  })
}

// IndexedDB에서 파일 저장
export const saveFileToDB = async (file: File): Promise<void> => {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    await store.put({
      fileName: file.name,
      fileData: file,
      timestamp: Date.now()
    })
    
    console.log('💾 비디오 파일을 IndexedDB에 저장됨:', file.name)
  } catch (error) {
    console.warn('⚠️ IndexedDB 저장 실패:', error)
    throw error
  }
}

// IndexedDB에서 파일 로드
export const loadFileFromDB = async (fileName: string): Promise<File | null> => {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    
    const request = store.get(fileName)
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result
        if (result && result.fileData) {
          console.log('✅ IndexedDB에서 파일 복원됨:', fileName)
          resolve(result.fileData)
        } else {
          console.warn('⚠️ IndexedDB에서 파일을 찾을 수 없음:', fileName)
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('⚠️ IndexedDB 로드 실패:', error)
    return null
  }
}

// IndexedDB에서 파일 삭제
export const deleteFileFromDB = async (fileName: string): Promise<void> => {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    await store.delete(fileName)
    console.log('🗑️ IndexedDB에서 파일 삭제됨:', fileName)
  } catch (error) {
    console.warn('⚠️ IndexedDB 삭제 실패:', error)
    throw error
  }
}

// IndexedDB에서 모든 파일 목록 가져오기
export const getAllFilesFromDB = async (): Promise<Array<{ fileName: string; timestamp: number }>> => {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result
        const fileList = results.map(result => ({
          fileName: result.fileName,
          timestamp: result.timestamp
        }))
        console.log('📋 IndexedDB 파일 목록:', fileList)
        resolve(fileList)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('⚠️ IndexedDB 파일 목록 조회 실패:', error)
    return []
  }
} 