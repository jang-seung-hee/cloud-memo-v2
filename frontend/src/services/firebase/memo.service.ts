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
  Timestamp,
  QueryConstraint,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { storageService } from './storage';
import { compressImage } from '../../utils/imageCompression';
import { logDebug, logInfo, logError } from '../../utils/logger';
import {
  IFirebaseMemo,
  IMemoCreateData,
  IMemoUpdateData,
  IQueryOptions,
  FirestoreListener,
  COLLECTIONS
} from '../../types/firebase';
import { createFirestoreError } from './firestore-utils';

export const createMemo = async (userId: string, data: IMemoCreateData): Promise<string> => {
  try {
    logDebug('createMemo 호출됨:', { userId, data });

    const imageUrls: string[] = [];
    if (data.images && data.images.length > 0) {
      logInfo('이미지 업로드 시작:', data.images.length, '개 파일');
      for (const imageFile of data.images) {
        try {
          const compressedImage = await compressImage(imageFile, { maxSizeMB: 1 });
          const imageUrl = await storageService.uploadImage(compressedImage, userId);
          imageUrls.push(imageUrl);
        } catch (error) {
          logError('이미지 업로드 실패:', error);
        }
      }
    }

    const baseData = {
      userId,
      title: data.title,
      content: data.content,
      images: imageUrls,
      tags: data.tags || [],
      isPinned: false,
      isArchived: false,
      isProcessing: data.isProcessing || false,
      sharedWith: data.sharedWith || [],
      sharedWithUids: data.sharedWithUids || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const finalData: any = { ...baseData };
    finalData.category = data.category;
    if (data.templateId) {
      finalData.templateId = data.templateId;
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.MEMOS), finalData);
    return docRef.id;
  } catch (error) {
    logError('메모 생성 오류:', error);
    throw createFirestoreError(error);
  }
};

export const getMemo = async (memoId: string): Promise<IFirebaseMemo | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.MEMOS, memoId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as IFirebaseMemo;
    }
    return null;
  } catch (error) {
    logError('메모 조회 오류:', error);
    throw createFirestoreError(error);
  }
};

export const getMemosByUserId = async (userId: string, options?: IQueryOptions): Promise<IFirebaseMemo[]> => {
  try {
    const constraints: QueryConstraint[] = [where('userId', '==', userId)];

    if (options?.where) {
      options.where.forEach((condition: any) => {
        constraints.push(where(condition.field, condition.operator, condition.value));
      });
    }

    if (options?.orderBy) {
      constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
    }

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(collection(db, COLLECTIONS.MEMOS), ...constraints);
    const querySnapshot = await getDocs(q);

    let memos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IFirebaseMemo[];

    memos = memos.sort((a, b) => {
      const aTime = a.updatedAt?.toDate?.() || new Date();
      const bTime = b.updatedAt?.toDate?.() || new Date();
      return bTime.getTime() - aTime.getTime();
    });

    return memos;
  } catch (error) {
    console.error('사용자별 메모 조회 오류:', error);
    throw createFirestoreError(error);
  }
};

export const getSharedMemos = async (userId: string): Promise<IFirebaseMemo[]> => {
  try {
    logDebug('getSharedMemos 호출됨:', userId);
    const q = query(
      collection(db, COLLECTIONS.MEMOS),
      where('sharedWithUids', 'array-contains', userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IFirebaseMemo[];
  } catch (error) {
    logError('공유된 메모 조회 오류:', error);
    throw createFirestoreError(error);
  }
};

export const updateMemo = async (memoId: string, data: IMemoUpdateData): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.MEMOS, memoId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('메모 업데이트 오류:', error);
    throw createFirestoreError(error);
  }
};

export const deleteMemo = async (memoId: string): Promise<void> => {
  try {
    // 1. 메모 데이터를 가져와서 첨부된 이미지가 있는지 확인
    const memoData = await getMemo(memoId);
    
    if (memoData && memoData.images && memoData.images.length > 0) {
      logInfo(`메모(${memoId}) 삭제 전 연결된 이미지 ${memoData.images.length}개 삭제 시작`);
      for (const imageUrl of memoData.images) {
        try {
          await storageService.deleteImage(imageUrl);
        } catch (imgError) {
          logError(`이미지 삭제 실패 (${imageUrl}):`, imgError);
          // 개별 이미지 삭제 실패 시에도 메모 자체 삭제는 계속 진행
        }
      }
    }

    // 2. Firestore 문서 삭제
    const docRef = doc(db, COLLECTIONS.MEMOS, memoId);
    await deleteDoc(docRef);
    logInfo(`메모(${memoId}) 및 관련 데이터 삭제 완료`);
  } catch (error) {
    console.error('메모 삭제 오류:', error);
    throw createFirestoreError(error);
  }
};

export const onMemosSnapshot = (userId: string, callback: FirestoreListener<IFirebaseMemo>): Unsubscribe => {
  const q = query(
    collection(db, COLLECTIONS.MEMOS),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const memos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IFirebaseMemo[];

    const sortedMemos = memos.sort((a, b) => {
      const aTime = a.updatedAt?.toDate?.() || new Date();
      const bTime = b.updatedAt?.toDate?.() || new Date();
      return bTime.getTime() - aTime.getTime();
    });

    callback(sortedMemos);
  }, (error) => {
    console.error('❌ 메모 실시간 리스너 오류:', error);
  });
};

export const onSharedMemosSnapshot = (userId: string, callback: FirestoreListener<IFirebaseMemo>): Unsubscribe => {
  logDebug('onSharedMemosSnapshot 설정됨:', userId);
  const q = query(
    collection(db, COLLECTIONS.MEMOS),
    where('sharedWithUids', 'array-contains', userId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const memos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IFirebaseMemo[];

    const sortedMemos = memos.sort((a, b) => {
      const aTime = a.updatedAt?.toDate?.() || new Date();
      const bTime = b.updatedAt?.toDate?.() || new Date();
      return bTime.getTime() - aTime.getTime();
    });

    callback(sortedMemos);
  }, (error) => {
    console.error('❌ 공유 메모 실시간 리스너 오류:', error);
  });
};
