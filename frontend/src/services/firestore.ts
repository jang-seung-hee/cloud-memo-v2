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
  QuerySnapshot,
  DocumentSnapshot,
  WriteBatch,
  writeBatch,
  Timestamp,
  QueryConstraint,
  Unsubscribe,
  increment as firestoreIncrement
} from 'firebase/firestore';
import { db } from './firebase/config';
import { 
  IFirebaseMemo, 
  IFirebaseTemplate, 
  IUserProfile,
  IMemoCreateData,
  ITemplateCreateData,
  IMemoUpdateData,
  ITemplateUpdateData,
  IQueryOptions,
  FirestoreListener,
  IBatchOperation,
  COLLECTIONS,
  CollectionName
} from '../types/firebase';

// Firestore 서비스 클래스
export class FirestoreService {
  private static instance: FirestoreService;

  private constructor() {}

  public static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  // === 메모 관련 메서드 ===

  // 메모 생성
  async createMemo(userId: string, data: IMemoCreateData): Promise<string> {
    try {
      // 기본 데이터 객체 생성
      const baseData = {
        userId,
        title: data.title,
        content: data.content,
        images: [], // 이미지는 별도로 업로드 후 URL 설정
        tags: data.tags || [],
        isPinned: false,
        isArchived: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // undefined가 아닌 선택적 필드들만 추가
      const finalData: any = { ...baseData };
      
      // 카테고리는 필수 필드이므로 항상 추가
      finalData.category = data.category;
      
      // templateId는 선택적 필드
      if (data.templateId) {
        finalData.templateId = data.templateId;
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.MEMOS), finalData);

      return docRef.id;
    } catch (error) {
      console.error('메모 생성 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // 메모 조회
  async getMemo(memoId: string): Promise<IFirebaseMemo | null> {
    try {
      const docRef = doc(db, COLLECTIONS.MEMOS, memoId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as IFirebaseMemo;
      }
      return null;
    } catch (error) {
      console.error('메모 조회 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // 사용자별 메모 목록 조회
  async getMemosByUserId(userId: string, options?: IQueryOptions): Promise<IFirebaseMemo[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId)
      ];

      // 추가 쿼리 조건 적용
      if (options?.where) {
        options.where.forEach(condition => {
          constraints.push(where(condition.field, condition.operator, condition.value));
        });
      }

      // 서버 사이드 정렬 완전 제거 - 클라이언트에서만 정렬
      // if (options?.orderBy) {
      //   constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
      // }

      // 제한 조건 적용
      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      const q = query(collection(db, COLLECTIONS.MEMOS), ...constraints);
      const querySnapshot = await getDocs(q);
      
      let memos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IFirebaseMemo[];
      
      // 클라이언트에서 정렬 (항상 실행)
      memos = memos.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || new Date();
        const bTime = b.updatedAt?.toDate?.() || new Date();
        return bTime.getTime() - aTime.getTime();
      });
      
      return memos;
    } catch (error) {
      console.error('사용자별 메모 조회 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // 메모 업데이트
  async updateMemo(memoId: string, data: IMemoUpdateData): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.MEMOS, memoId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('메모 업데이트 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // 메모 삭제
  async deleteMemo(memoId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.MEMOS, memoId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('메모 삭제 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // === 템플릿 관련 메서드 ===

  // 템플릿 생성
  async createTemplate(userId: string, data: ITemplateCreateData): Promise<string> {
    try {
      // 기본 데이터 객체 생성
      const baseData = {
        userId,
        title: data.title,
        content: data.content,
        isPublic: data.isPublic || false,
        usageCount: 0,
        tags: data.tags || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // undefined가 아닌 선택적 필드들만 추가
      const finalData: any = { ...baseData };
      
      if (data.category !== undefined && data.category !== null && data.category !== '') {
        finalData.category = data.category;
      }
      
      if (data.description !== undefined && data.description !== null && data.description !== '') {
        finalData.description = data.description;
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.TEMPLATES), finalData);

      return docRef.id;
    } catch (error) {
      console.error('템플릿 생성 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // 템플릿 조회
  async getTemplate(templateId: string): Promise<IFirebaseTemplate | null> {
    try {
      const docRef = doc(db, COLLECTIONS.TEMPLATES, templateId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as IFirebaseTemplate;
      }
      return null;
    } catch (error) {
      console.error('템플릿 조회 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // 사용자별 템플릿 목록 조회
  async getTemplatesByUserId(userId: string, options?: IQueryOptions): Promise<IFirebaseTemplate[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId)
      ];

      if (options?.where) {
        options.where.forEach(condition => {
          constraints.push(where(condition.field, condition.operator, condition.value));
        });
      }

      // 서버 사이드 정렬 완전 제거 - 클라이언트에서만 정렬
      // if (options?.orderBy) {
      //   constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
      // }

      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      const q = query(collection(db, COLLECTIONS.TEMPLATES), ...constraints);
      const querySnapshot = await getDocs(q);
      
      let templates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IFirebaseTemplate[];
      
      // 클라이언트에서 정렬 (항상 실행)
      templates = templates.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || new Date();
        const bTime = b.updatedAt?.toDate?.() || new Date();
        return bTime.getTime() - aTime.getTime();
      });
      
      return templates;
    } catch (error) {
      console.error('사용자별 템플릿 조회 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // 공개 템플릿 목록 조회
  async getPublicTemplates(options?: IQueryOptions): Promise<IFirebaseTemplate[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('isPublic', '==', true)
      ];

      if (options?.where) {
        options.where.forEach(condition => {
          constraints.push(where(condition.field, condition.operator, condition.value));
        });
      }

      // 서버 사이드 정렬 완전 제거 - 클라이언트에서만 정렬
      // if (options?.orderBy) {
      //   constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
      // }

      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      const q = query(collection(db, COLLECTIONS.TEMPLATES), ...constraints);
      const querySnapshot = await getDocs(q);
      
      let templates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IFirebaseTemplate[];
      
      // 클라이언트에서 정렬 (항상 실행)
      templates = templates.sort((a, b) => {
        const aUsage = a.usageCount || 0;
        const bUsage = b.usageCount || 0;
        return bUsage - aUsage;
      });
      
      return templates;
    } catch (error) {
      console.error('공개 템플릿 조회 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // 템플릿 업데이트
  async updateTemplate(templateId: string, data: ITemplateUpdateData): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.TEMPLATES, templateId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('템플릿 업데이트 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // 템플릿 사용 횟수 증가
  async incrementTemplateUsage(templateId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.TEMPLATES, templateId);
      await updateDoc(docRef, {
        usageCount: firestoreIncrement(1),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('템플릿 사용 횟수 증가 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // 템플릿 삭제
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.TEMPLATES, templateId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('템플릿 삭제 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // === 실시간 리스너 ===

  // 메모 실시간 리스너
  onMemosSnapshot(userId: string, callback: FirestoreListener<IFirebaseMemo>): Unsubscribe {
    const q = query(
      collection(db, COLLECTIONS.MEMOS),
      where('userId', '==', userId)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const memos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IFirebaseMemo[];
      
      // 클라이언트에서 정렬 (인덱스 없이도 작동)
      const sortedMemos = memos.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || new Date();
        const bTime = b.updatedAt?.toDate?.() || new Date();
        return bTime.getTime() - aTime.getTime();
      });
      
      callback(sortedMemos);
    });
  }

  // 템플릿 실시간 리스너
  onTemplatesSnapshot(userId: string, callback: FirestoreListener<IFirebaseTemplate>): Unsubscribe {
    const q = query(
      collection(db, COLLECTIONS.TEMPLATES),
      where('userId', '==', userId)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const templates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IFirebaseTemplate[];
      
      // 클라이언트에서 정렬 (인덱스 없이도 작동)
      const sortedTemplates = templates.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || new Date();
        const bTime = b.updatedAt?.toDate?.() || new Date();
        return bTime.getTime() - aTime.getTime();
      });
      
      callback(sortedTemplates);
    });
  }

  // === 배치 작업 ===

  // 배치 작업 생성
  createBatch(): WriteBatch {
    return writeBatch(db);
  }

  // 배치 작업 실행
  async executeBatch(operations: IBatchOperation[]): Promise<void> {
    try {
      const batch = this.createBatch();
      
      operations.forEach(operation => {
        const docRef = doc(db, operation.collection, operation.docId || '');
        
        switch (operation.type) {
          case 'create':
            batch.set(docRef, {
              ...operation.data,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...operation.data,
              updatedAt: Timestamp.now()
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('배치 작업 실행 오류:', error);
      throw this.createFirestoreError(error);
    }
  }

  // === 유틸리티 메서드 ===

  // Firestore 오류 생성
  private createFirestoreError(error: any): Error {
    return new Error(`Firestore 오류: ${error.message || error}`);
  }
}

// 싱글톤 인스턴스 내보내기
export const firestoreService = FirestoreService.getInstance(); 