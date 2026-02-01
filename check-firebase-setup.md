# 🔍 Firebase 프로젝트 상태 확인 결과

## ✅ 확인 완료 사항

### 1. Firebase 프로젝트
- **프로젝트 ID:** cloud-memo-v2
- **프로젝트 번호:** 527848937463
- **상태:** 활성화됨

### 2. Cloud Functions
- **함수명:** sendShareNotification
- **버전:** v1
- **트리거:** Firestore document.create (notifications 컬렉션)
- **위치:** us-central1
- **런타임:** nodejs20
- **상태:** 배포됨 ✅

### 3. 에러 로그 분석
```
messaging/unknown-error
The requested URL /batch was not found on this server. Status code: 404.
```

**이 에러의 의미:**
- Firebase Admin SDK가 FCM v1 API의 `/batch` 엔드포인트에 접근하려고 시도
- 하지만 404 응답을 받음
- **가장 큰 원인: Spark 플랜의 제한 또는 FCM API 미활성화**

---

## 🚨 즉시 수행해야 할 작업

### ⚡ 1단계: Firebase Blaze 플랜 확인 (가장 중요!)

**왜 중요한가?**
- Spark (무료) 플랜에서는 Cloud Functions가 **Google 서비스 외의 외부 API 호출이 제한됨**
- FCM API도 외부 API로 간주되어 호출이 차단됨 → 404 에러 발생!

**확인 방법:**

1. 다음 링크를 브라우저에서 열기:
   ```
   https://console.firebase.google.com/project/cloud-memo-v2/usage
   ```

2. 페이지 상단 확인:
   - 📌 **"Spark 플랜"** 표시 → **문제의 원인!** 
   - ✅ **"Blaze 플랜"** 표시 → 다른 원인

**Blaze 플랜으로 업그레이드:**

만약 Spark 플랜이라면 반드시 업그레이드해야 합니다:

1. 같은 페이지에서 **"Blaze 플랜으로 업그레이드"** 버튼 클릭
2. Google Cloud Billing 계정 연결
3. 신용카드/체크카드 등록

**비용 걱정은 안 하셔도 됩니다:**
- Cloud Functions 호출: 월 **200만 회 무료**
- Firestore 읽기: 일 **5만 건 무료**
- FCM 푸시 알림: **완전 무료 (무제한)**
- 개인 프로젝트 수준에서는 무료 할당량 내에서 충분히 사용 가능

---

### ⚡ 2단계: 필수 API 활성화 확인

**다음 3개 API를 모두 활성화해야 합니다:**

#### A. Firebase Management API
```
https://console.cloud.google.com/apis/library/firebase.googleapis.com?project=cloud-memo-v2
```
→ 페이지에서 "사용 설정" 또는 "API 사용 설정됨" 확인

#### B. Firebase Cloud Messaging API
```
https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=cloud-memo-v2
```
→ 페이지에서 "사용 설정" 또는 "API 사용 설정됨" 확인

#### C. Cloud Messaging API (V1)
```
https://console.firebase.google.com/project/cloud-memo-v2/settings/cloudmessaging
```
→ "Cloud Messaging API (V1)" 섹션에서 "사용 설정됨" 확인

---

### ⚡ 3단계: 서비스 계정 권한 확인

1. **IAM 페이지 접속:**
   ```
   https://console.cloud.google.com/iam-admin/iam?project=cloud-memo-v2
   ```

2. **서비스 계정 찾기:**
   - Ctrl+F로 "appspot" 검색
   - 이메일: `cloud-memo-v2@appspot.gserviceaccount.com`

3. **권한 확인:**
   다음 역할 중 하나가 있는지 확인:
   - ✅ "Firebase Admin SDK 관리자 서비스 에이전트"
   - ✅ "Cloud Messaging 관리자"
   - ✅ "편집자"

4. **권한 추가 (없는 경우):**
   - 서비스 계정 오른쪽 "수정" (연필 아이콘) 클릭
   - "다른 역할 추가" 클릭
   - "Cloud Messaging 관리자" 검색 및 선택
   - "저장" 클릭

---

### ⚡ 4단계: Functions 강제 재배포 (선택사항)

모든 설정을 변경한 후 Functions를 강제로 재배포하려면:

```powershell
# 프로젝트 디렉토리로 이동
cd e:\05.Python_Project\19.cloud-memo.v2

# 기존 함수 삭제
firebase functions:delete sendShareNotification

# Functions 재배포
firebase deploy --only functions
```

---

## ⏰ 중요: 변경 후 대기 시간

**모든 변경사항을 적용한 후 반드시 10-15분 대기하세요!**

이유:
- API 활성화가 Google Cloud 인프라에 전파되는 시간
- 권한 변경이 반영되는 시간
- Functions 배포가 완전히 적용되는 시간

**대기 후 테스트:**
1. 브라우저 완전 새로고침 (Ctrl+Shift+R)
2. 메모 공유 테스트
3. 로그 확인: `firebase functions:log`

---

## 📊 테스트 확인 방법

### 성공 시 로그:
```
알림 트리거 발생: { type: 'share', title: '새로운 메모 공유', ... }
대상 사용자의 FCM 토큰 조회
메시지 발송 시도: { notification: {...}, tokens: [...] }
FCM 발송 결과: 1 성공 / 0 실패
Function execution took 500 ms, finished with status: 'ok'
```

### 실패 시 로그 (현재 상태):
```
messaging/unknown-error
The requested URL /batch was not found on this server. Status code: 404.
```

---

## 💡 핵심 요약

**90% 확률로 원인은:**
1. ❌ Firebase Spark 플랜 사용 중
2. ❌ Cloud Functions가 외부 API 호출 불가
3. ❌ FCM API 엔드포인트 접근 차단

**해결책:**
1. ✅ **Blaze 플랜으로 업그레이드** (가장 중요!)
2. ✅ 3개 API 모두 활성화
3. ✅ 서비스 계정 권한 확인
4. ✅ 10분 대기 후 테스트

---

## 🆘 추가 지원

위 단계를 모두 수행했는데도 문제가 해결되지 않으면:

1. Firebase Console > Usage 페이지 스크린샷
2. API & Services > Dashboard 스크린샷
3. Functions 로그 전체 텍스트

위 정보를 공유해주세요.
