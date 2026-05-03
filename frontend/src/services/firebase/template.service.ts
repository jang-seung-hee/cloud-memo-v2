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
  Unsubscribe,
  increment
} from 'firebase/firestore';
import { db } from './config';
import {
  IFirebaseTemplate,
  ITemplateCreateData,
  ITemplateUpdateData,
  IQueryOptions,
  FirestoreListener,
  COLLECTIONS
} from '../../types/firebase';
import { createFirestoreError } from './firestore-utils';

export const createTemplate = async (userId: string, data: ITemplateCreateData): Promise<string> => {
  try {
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
    throw createFirestoreError(error);
  }
};

export const getTemplate = async (templateId: string): Promise<IFirebaseTemplate | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.TEMPLATES, templateId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as IFirebaseTemplate;
    }
    return null;
  } catch (error) {
    console.error('템플릿 조회 오류:', error);
    throw createFirestoreError(error);
  }
};

export const getTemplatesByUserId = async (userId: string, options?: IQueryOptions): Promise<IFirebaseTemplate[]> => {
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

    const q = query(collection(db, COLLECTIONS.TEMPLATES), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IFirebaseTemplate[];
  } catch (error) {
    console.error('사용자별 템플릿 조회 오류:', error);
    throw createFirestoreError(error);
  }
};

export const getPublicTemplates = async (options?: IQueryOptions): Promise<IFirebaseTemplate[]> => {
  try {
    const constraints: QueryConstraint[] = [where('isPublic', '==', true)];

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

    const q = query(collection(db, COLLECTIONS.TEMPLATES), ...constraints);
    const querySnapshot = await getDocs(q);

    let templates = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IFirebaseTemplate[];

    templates = templates.sort((a, b) => {
      const aUsage = a.usageCount || 0;
      const bUsage = b.usageCount || 0;
      return bUsage - aUsage;
    });

    return templates;
  } catch (error) {
    console.error('공개 템플릿 조회 오류:', error);
    throw createFirestoreError(error);
  }
};

export const updateTemplate = async (templateId: string, data: ITemplateUpdateData): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.TEMPLATES, templateId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('템플릿 업데이트 오류:', error);
    throw createFirestoreError(error);
  }
};

export const incrementTemplateUsage = async (templateId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.TEMPLATES, templateId);
    await updateDoc(docRef, {
      usageCount: increment(1),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('템플릿 사용 횟수 증가 오류:', error);
    throw createFirestoreError(error);
  }
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.TEMPLATES, templateId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('템플릿 삭제 오류:', error);
    throw createFirestoreError(error);
  }
};

export const onTemplatesSnapshot = (userId: string, callback: FirestoreListener<IFirebaseTemplate>): Unsubscribe => {
  const q = query(
    collection(db, COLLECTIONS.TEMPLATES),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const templates = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IFirebaseTemplate[];

    const sortedTemplates = templates.sort((a, b) => {
      const aTime = a.updatedAt?.toDate?.() || new Date();
      const bTime = b.updatedAt?.toDate?.() || new Date();
      return bTime.getTime() - aTime.getTime();
    });

    callback(sortedTemplates);
  }, (error) => {
    console.error('❌ 템플릿 실시간 리스너 오류:', error);
  });
};
