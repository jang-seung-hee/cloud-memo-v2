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
  onSnapshot,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './config';
import {
  IFirebaseCategory,
  FirestoreListener,
  COLLECTIONS
} from '../../types/firebase';
import { createFirestoreError } from './firestore-utils';

export const createCategory = async (userId: string, data: { name: string; isActive: boolean; order: number }): Promise<string> => {
  try {
    console.log('🔍 createCategory 호출됨:', { userId, data });

    const categoryData = {
      userId,
      name: data.name.trim(),
      isActive: data.isActive,
      order: data.order,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.CATEGORIES), categoryData);
    console.log('✅ 카테고리 생성 완료:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ 카테고리 생성 실패:', error);
    throw createFirestoreError(error);
  }
};

export const getCategory = async (categoryId: string): Promise<IFirebaseCategory | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as IFirebaseCategory;
    }
    return null;
  } catch (error) {
    console.error('❌ 카테고리 조회 실패:', error);
    throw createFirestoreError(error);
  }
};

export const getCategoriesByUserId = async (userId: string): Promise<IFirebaseCategory[]> => {
  try {
    const authUid = auth.currentUser?.uid;
    console.log(`🔍 [Firestore] getCategoriesByUserId 호출됨: 요청UID=${userId}, 현재인증UID=${authUid}`);
    
    if (!authUid) {
      console.warn('⚠️ [Firestore] 현재 로그인된 사용자가 없습니다!');
    } else if (authUid !== userId) {
      console.warn(`⚠️ [Firestore] 요청 UID와 현재 인증 UID가 일치하지 않습니다! (요청: ${userId}, 인증: ${authUid})`);
    }

    const q = query(
      collection(db, COLLECTIONS.CATEGORIES),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const categories: IFirebaseCategory[] = [];

    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as IFirebaseCategory);
    });

    categories.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (categories.length === 0) {
      const defaultNames = ['개인', '업무', '지정안함', '지정안함', '지정안함'];
      const defaultActive = [true, true, false, false, false];
      for (let i = 0; i < 5; i++) {
        const data = {
          name: defaultNames[i],
          isActive: defaultActive[i],
          order: i,
          userId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        await addDoc(collection(db, COLLECTIONS.CATEGORIES), data);
      }
      const newSnapshot = await getDocs(q);
      newSnapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() } as IFirebaseCategory);
      });
    }

    categories.forEach(cat => {
      if (cat.name === '지정안함') cat.isActive = false;
    });

    console.log('✅ 카테고리 목록 조회 완료:', categories.length, '개');
    return categories;
  } catch (error) {
    console.error('❌ 카테고리 목록 조회 실패:', error);
    throw createFirestoreError(error);
  }
};

export const updateCategory = async (categoryId: string, data: { name?: string; isActive?: boolean; order?: number }): Promise<void> => {
  try {
    console.log('🔍 updateCategory 호출됨:', { categoryId, data });

    const updateData: any = {
      updatedAt: Timestamp.now()
    };

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.order !== undefined) updateData.order = data.order;

    const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
    await updateDoc(docRef, updateData);

    console.log('✅ 카테고리 업데이트 완료');
  } catch (error) {
    console.error('❌ 카테고리 업데이트 실패:', error);
    throw createFirestoreError(error);
  }
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    console.log('🔍 deleteCategory 호출됨:', categoryId);
    const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
    await deleteDoc(docRef);
    console.log('✅ 카테고리 삭제 완료');
  } catch (error) {
    console.error('❌ 카테고리 삭제 실패:', error);
    throw createFirestoreError(error);
  }
};

export const onCategoriesSnapshot = (userId: string, callback: FirestoreListener<IFirebaseCategory>): Unsubscribe => {
  try {
    const authUid = auth.currentUser?.uid;
    console.log(`🔍 [Firestore] onCategoriesSnapshot 설정됨: 요청UID=${userId}, 현재인증UID=${authUid}`);
    
    if (!authUid) {
      console.warn('⚠️ [Firestore] 현재 로그인된 사용자가 없습니다!');
    } else if (authUid !== userId) {
      console.warn(`⚠️ [Firestore] 요청 UID와 현재 인증 UID가 일치하지 않습니다! (요청: ${userId}, 인증: ${authUid})`);
    }

    const q = query(
      collection(db, COLLECTIONS.CATEGORIES),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IFirebaseCategory[];

      const sortedCategories = categories.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log('✅ 카테고리 실시간 업데이트:', sortedCategories.length, '개');
      callback(sortedCategories);
    }, (error) => {
      console.error('❌ 카테고리 실시간 리스너 오류:', error);
    });
  } catch (error) {
    console.error('❌ 카테고리 실시간 리스너 설정 실패:', error);
    throw createFirestoreError(error);
  }
};
