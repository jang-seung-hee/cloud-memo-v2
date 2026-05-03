import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  limit,
  Timestamp
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './config';
import { IUserProfile, COLLECTIONS } from '../../types/firebase';
import { createFirestoreError } from './firestore-utils';

let lastSyncedUid: string | null = null;

export const syncUserProfile = async (user: User): Promise<void> => {
  if (!user || !user.email) return;

  if (lastSyncedUid === user.uid) {
    return;
  }
  lastSyncedUid = user.uid;

  try {
    console.log('🔄 [Firestore] 프로필 동기화 시도 중...', user.email);
    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);

    const userData = {
      userId: user.uid,
      email: user.email.toLowerCase(),
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || '',
      emailVerified: user.emailVerified,
      lastLoginAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(userDocRef, {
      ...userData,
      settings: {
        theme: 'light',
        language: 'ko',
        notifications: true
      }
    }, { merge: true });

    const publicProfileRef = doc(db, COLLECTIONS.PUBLIC_PROFILES, user.uid);
    await setDoc(publicProfileRef, {
      userId: user.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      updatedAt: Timestamp.now()
    }, { merge: true });

    console.log('✅ [Firestore] 프로필 및 공개 프로필 동기화 성공:', user.email);
  } catch (error) {
    console.error('❌ [Firestore] 프로필 동기화 실패:', error);
  }
};

export const searchUsers = async (searchQuery: string): Promise<IUserProfile[]> => {
  try {
    if (!searchQuery || searchQuery.length < 4) return [];

    const lowercaseQuery = searchQuery.toLowerCase();

    const nameQ = query(
      collection(db, COLLECTIONS.PUBLIC_PROFILES),
      where('displayName', '>=', searchQuery),
      where('displayName', '<=', searchQuery + '\uf8ff'),
      limit(10)
    );

    const emailQ = query(
      collection(db, COLLECTIONS.PUBLIC_PROFILES),
      where('email', '>=', lowercaseQuery),
      where('email', '<=', lowercaseQuery + '\uf8ff'),
      limit(10)
    );

    const [nameSnapshot, emailSnapshot] = await Promise.all([
      getDocs(nameQ),
      getDocs(emailQ)
    ]);

    const resultsMap = new Map<string, IUserProfile>();

    nameSnapshot.forEach(doc => {
      resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as IUserProfile);
    });

    emailSnapshot.forEach(doc => {
      if (!resultsMap.has(doc.id)) {
        resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as IUserProfile);
      }
    });

    return Array.from(resultsMap.values());
  } catch (error) {
    console.error('사용자 검색 오류:', error);
    throw createFirestoreError(error);
  }
};
