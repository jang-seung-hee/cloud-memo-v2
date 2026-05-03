import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { INotification, FirebaseDocument, COLLECTIONS, FirestoreListener, IUserProfile } from '../../types/firebase';
import { createFirestoreError } from './firestore-utils';

export const updateFcmToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as IUserProfile;
      const tokens = userData.fcmTokens || [];

      if (!tokens.includes(token)) {
        await updateDoc(userDocRef, {
          fcmTokens: [...tokens, token],
          updatedAt: Timestamp.now()
        });
      }
    }
  } catch (error) {
    console.error('FCM 토큰 업데이트 오류:', error);
  }
};

export const createNotification = async (data: Omit<INotification, keyof FirebaseDocument | 'isRead'>): Promise<string> => {
  try {
    const notificationData = {
      ...data,
      isRead: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('알림 생성 오류:', error);
    throw createFirestoreError(error);
  }
};

export const getNotifications = async (userId: string): Promise<INotification[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('receiverId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as INotification[];
  } catch (error) {
    console.error('알림 조회 오류:', error);
    throw createFirestoreError(error);
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await updateDoc(docRef, {
      isRead: true,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('알림 읽음 표시 오류:', error);
  }
};

export const onNotificationsSnapshot = (userId: string, callback: FirestoreListener<INotification>): Unsubscribe => {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('receiverId', '==', userId),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as INotification[];

    const sortedNotifications = notifications.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });

    callback(sortedNotifications);
  }, (error) => {
    console.error('❌ 알림 실시간 리스너 오류:', error);
  });
};
