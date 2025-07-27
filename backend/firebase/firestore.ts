import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  WriteBatch,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// 컬렉션 이름 상수
export const COLLECTIONS = {
  USERS: 'users',
  MEMOS: 'memos',
  TEMPLATES: 'templates'
} as const;

// 기본 CRUD 작업 함수들
export const firestoreService = {
  // 문서 생성
  async create<T extends DocumentData>(
    collectionName: string, 
    data: T
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('문서 생성 오류:', error);
      throw error;
    }
  },

  // 문서 조회
  async get<T>(
    collectionName: string, 
    docId: string
  ): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error('문서 조회 오류:', error);
      throw error;
    }
  },

  // 문서 업데이트
  async update<T extends DocumentData>(
    collectionName: string, 
    docId: string, 
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('문서 업데이트 오류:', error);
      throw error;
    }
  },

  // 문서 삭제
  async delete(
    collectionName: string, 
    docId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('문서 삭제 오류:', error);
      throw error;
    }
  },

  // 사용자별 문서 조회
  async getByUserId<T>(
    collectionName: string, 
    userId: string
  ): Promise<T[]> {
    try {
      const q = query(
        collection(db, collectionName),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('사용자별 문서 조회 오류:', error);
      throw error;
    }
  },

  // 실시간 리스너
  onSnapshotByUserId<T>(
    collectionName: string,
    userId: string,
    callback: (data: T[]) => void
  ) {
    const q = query(
      collection(db, collectionName),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(data);
    });
  }
};

// 배치 작업을 위한 함수
export const createBatch = (): WriteBatch => {
  return writeBatch(db);
}; 