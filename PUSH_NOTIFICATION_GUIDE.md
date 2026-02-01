# Push Notification Implementation Guide (Firebase Cloud Functions)

공유 기능 시 실시간 푸시 알림(앱이 꺼져 있을 때도 수신)을 구현하려면 Firebase Cloud Functions가 필요합니다. 프론트엔드에서는 Firestore에 알림 레코드를 생성하고, Cloud Functions가 이 변경사항을 감지하여 FCM을 통해 실제 푸시를 보내는 방식이 가장 권장됩니다.

## 1. Cloud Functions 설정

`functions/index.js` (또는 `.ts`) 파일에 다음과 같은 코드를 작성합니다.

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendShareNotification = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snapshot, context) => {
        const notification = snapshot.data();
        
        // 대상 사용자의 FCM 토큰 조회
        const userDoc = await admin.firestore().collection('users').doc(notification.receiverId).get();
        const userData = userDoc.data();
        const tokens = userData.fcmTokens || [];

        if (tokens.length === 0) {
            console.log('No tokens found for user:', notification.receiverId);
            return null;
        }

        const message = {
            notification: {
                title: notification.title,
                body: notification.body,
            },
            data: {
                memoId: notification.memoId || '',
                type: notification.type,
            },
            tokens: tokens,
        };

        // 여러 기기로 푸시 발송
        const response = await admin.messaging().sendMulticast(message);
        
        // 유효하지 않은 토큰 정리 (선택 사항)
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            // DB에서 failedTokens 삭제 로직 추가 가능
        }

        return response;
    });
```

## 2. 보안 규칙 (Firestore Rules)

`firestore.rules`에 알림 컬렉션에 대한 권한을 추가해야 합니다.

```
match /notifications/{notificationId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.receiverId;
  allow create: if request.auth != null;
  allow update: if request.auth != null && request.auth.uid == resource.data.receiverId;
}
```

## 3. VAPID 키 생성

1. Firebase Console 접속
2. 프로젝트 설정 > 클라우드 메시징 탭
3. 웹 설정 > 웹 푸시 인증에서 '키 쌍 생성' 클릭
4. 생성된 키를 복사하여 프론트엔드 `.env` 파일의 `REACT_APP_FIREBASE_VAPID_KEY`에 입력하세요.

## 4. PWA 설치 및 iOS 주의사항

* **iOS:** 반드시 사용자가 '홈 화면에 추가'를 통해 PWA를 설치해야만 푸시 알림 수신이 가능합니다.
* **HTTPS:** 푸시 알림은 보안 컨텍스트(HTTPS 또는 localhost)에서만 작동합니다.
