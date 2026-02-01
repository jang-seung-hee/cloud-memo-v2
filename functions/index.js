const functions = require('firebase-functions');
const admin = require('firebase-admin');

// 명시적으로 프로젝트 ID 지정
admin.initializeApp({
    projectId: 'cloud-memo-v2'
});

/**
 * Firestore의 'notifications' 컬렉션에 새 문서가 생성될 때 실행됩니다.
 * 수신자의 FCM 토큰을 조회하여 실제 푸시 알림을 발송합니다.
 */
exports.sendShareNotification = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snapshot, context) => {
        const notification = snapshot.data();
        
        console.log('알림 트리거 발생:', notification);

        const receiverId = notification.receiverId;
        if (!receiverId) {
            console.error('수신자 ID(receiverId)가 없습니다.');
            return null;
        }

        try {
            // 1. 대상 사용자의 FCM 토큰 조회
            const userDoc = await admin.firestore().collection('users').doc(receiverId).get();
            
            if (!userDoc.exists) {
                console.error('사용자 문서를 찾을 수 없습니다:', receiverId);
                return null;
            }

            const userData = userDoc.data();
            const tokens = userData.fcmTokens || [];

            if (tokens.length === 0) {
                console.log('해당 사용자에게 등록된 FCM 토큰이 없습니다:', receiverId);
                return null;
            }

            // 2. FCM 메시지 구성
            const message = {
                notification: {
                    title: notification.title || '새 알림',
                    body: notification.body || '',
                },
                data: {
                    memoId: notification.memoId || '',
                    type: notification.type || 'system',
                    click_action: 'FLUTTER_NOTIFICATION_CLICK', // 웹/앱 호환용
                },
                tokens: tokens,
            };

            console.log('메시지 발송 시도:', message);

            // 3. 여러 기기로 푸시 발송
            const response = await admin.messaging().sendMulticast(message);
            
            console.log('FCM 발송 결과:', response.successCount, '성공 /', response.failureCount, '실패');

            // 4. 유효하지 않은 토큰 정리
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        console.log('발송 실패 토큰:', tokens[idx], resp.error.code);
                        // 토큰이 유효하지 않은 경우 (NotRegistered, InvalidRegistration 등)
                        if (resp.error.code === 'messaging/invalid-registration-token' ||
                            resp.error.code === 'messaging/registration-token-not-registered') {
                            failedTokens.push(tokens[idx]);
                        }
                    }
                });

                if (failedTokens.length > 0) {
                    await admin.firestore().collection('users').doc(receiverId).update({
                        fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
                    });
                    console.log('유효하지 않은 토큰 제거 완료:', failedTokens.length, '개');
                }
            }

            return response;
        } catch (error) {
            console.error('알림 처리 중 오류 발생:', error);
            throw error;
        }
    });
