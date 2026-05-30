/**
 * n8n 웹훅 전송용 음성 파일의 유실 방지를 위한 IndexedDB 헬퍼 모듈
 * 
 * - 대용량 바이너리 데이터인 Blob을 로컬에 영구 보존할 수 있습니다.
 * - 오직 n8n 웹훅 자동화 전송 기능에만 국한하여 활용됩니다.
 */

const DB_NAME = 'n8n_voice_backup_db';
const STORE_NAME = 'pending_voice_memos';
const DB_VERSION = 1;

export interface ICachedVoice {
  id: string;          // n8n_voice_[timestamp] 형식의 고유 키
  workflowId: string;   // 연동 대상 n8n 워크플로우 ID
  blob: Blob;          // 오디오 데이터 (이진 데이터)
  fileName: string;    // 원본 파일 이름
  createdAt: number;   // 타임스탬프
  workflowName: string;// 워크플로우 이름 (사용자 UI 노출용)
}

export const n8nVoiceDb = {
  /**
   * IndexedDB 데이터베이스 초기화 및 연결
   */
  initDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('이 브라우저는 IndexedDB를 지원하지 않습니다.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB 열기 실패:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // id를 키값으로 사용하도록 스토어 생성
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          console.log(`⚡ IndexedDB 스토어 생성 완료: ${STORE_NAME}`);
        }
      };
    });
  },

  /**
   * 미전송 오디오 파일을 로컬에 임시 보존 처리
   * @param workflowId n8n 워크플로우 ID
   * @param workflowName n8n 워크플로우 이름
   * @param blob 오디오 파일 데이터
   * @param fileName 오디오 파일명
   */
  async saveVoice(
    workflowId: string,
    workflowName: string,
    blob: Blob,
    fileName: string
  ): Promise<string> {
    try {
      const db = await this.initDb();
      const id = `n8n_voice_${Date.now()}`;
      
      const data: ICachedVoice = {
        id,
        workflowId,
        workflowName,
        blob,
        fileName,
        createdAt: Date.now(),
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data);

        request.onsuccess = () => {
          console.log(`💾 음성 로컬 백업 완료 (ID: ${id})`);
          resolve(id);
        };

        request.onerror = () => {
          console.error('❌ 음성 로컬 백업 실패:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB 저장 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 워크플로우의 미전송 오디오 백업본 조회
   * @param workflowId n8n 워크플로우 ID
   */
  async getPendingVoice(workflowId: string): Promise<ICachedVoice | null> {
    try {
      const db = await this.initDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result as ICachedVoice[];
          // 해당 워크플로우에 맞는 가장 최신 백업 파일 필터링
          const filtered = results
            .filter((item) => item.workflowId === workflowId)
            .sort((a, b) => b.createdAt - a.createdAt);

          if (filtered.length > 0) {
            resolve(filtered[0]);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB 로드 실패:', error);
      return null;
    }
  },

  /**
   * 전송 완료된 로컬 백업 파일 삭제 (클린업)
   * @param id 삭제 대상 고유 ID
   */
  async deleteVoice(id: string): Promise<void> {
    try {
      const db = await this.initDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
          console.log(`🧹 로컬 백업 파일 삭제 완료 (ID: ${id})`);
          resolve();
        };

        request.onerror = () => {
          console.error('❌ 로컬 백업 파일 삭제 실패:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('IndexedDB 삭제 실패:', error);
    }
  }
};
