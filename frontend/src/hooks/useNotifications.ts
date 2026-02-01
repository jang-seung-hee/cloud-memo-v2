import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../services/firebase/config';
import { firestoreService } from '../services/firebase/firestore';
import { INotification } from '../types/firebase';
import { useToast } from './use-toast';

export const useNotifications = (userId: string | undefined) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // FCM 토큰 요청 및 저장
  const requestPermission = useCallback(async () => {
    if (!userId) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // FCM 토큰 획득
        const token = await getToken(messaging, {
          vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY // Firebase Console에서 생성한 VAPID 키 필요
        });

        if (token) {
          // Firestore에 토큰 저장
          await firestoreService.updateFcmToken(userId, token);
          console.log('FCM 토큰 저장 완료');
        }
      }
    } catch (error) {
      console.error('알림 권한 요청 중 오류 발생:', error);
    }
  }, [userId]);

  // 포그라운드 메시지 수신 처리
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('포그라운드 메시지 수신:', payload);
      
      // 메모 ID 추출
      const memoId = payload.data?.memoId;
      
      // 토스트 알림 표시
      if (payload.notification) {
        const title = payload.notification.title || '';
        const body = payload.notification.body || '';
        const description = memoId 
          ? `${body}\n\n📝 메모 보기: /memo/${memoId}` 
          : body;
        
        toast({
          title,
          description,
          duration: 5000, // 5초 동안 표시
        });
        
        // 메모 ID가 있으면 자동으로 이동 (선택사항)
        // if (memoId) {
        //   setTimeout(() => {
        //     window.location.href = `/memo/${memoId}`;
        //   }, 1000);
        // }
      }
    });

    return () => unsubscribe();
  }, [userId, toast]);

  // Firestore 실시간 알림 리스너
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = firestoreService.onNotificationsSnapshot(userId, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.isRead).length);
    });

    return () => unsubscribe();
  }, [userId]);

  // 초기 권한 요청
  useEffect(() => {
    if (userId) {
      requestPermission();
    }
  }, [userId, requestPermission]);

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    await firestoreService.markNotificationAsRead(notificationId);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    requestPermission
  };
};
