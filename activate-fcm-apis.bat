@echo off
echo ========================================
echo Firebase FCM API 활성화 확인 스크립트
echo ========================================
echo.

echo [1단계] Firebase Management API 활성화 페이지 열기...
start https://console.cloud.google.com/apis/library/firebase.googleapis.com?project=cloud-memo-v2
timeout /t 2 /nobreak >nul

echo [2단계] Firebase Cloud Messaging API 활성화 페이지 열기...
start https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=cloud-memo-v2
timeout /t 2 /nobreak >nul

echo [3단계] Firebase Console Cloud Messaging 설정 페이지 열기...
start https://console.firebase.google.com/project/cloud-memo-v2/settings/cloudmessaging
timeout /t 2 /nobreak >nul

echo [4단계] IAM 권한 확인 페이지 열기...
start https://console.cloud.google.com/iam-admin/iam?project=cloud-memo-v2
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo 브라우저에서 열린 4개 페이지를 확인하세요:
echo ========================================
echo.
echo 1. Firebase Management API
echo    - "API 사용 설정됨" 표시 확인
echo    - 아니면 "사용 설정" 버튼 클릭
echo.
echo 2. Firebase Cloud Messaging API
echo    - "API 사용 설정됨" 표시 확인
echo    - 아니면 "사용 설정" 버튼 클릭
echo.
echo 3. Cloud Messaging API (V1)
echo    - "Cloud Messaging API (V1)" 섹션에서
echo    - "사용 설정됨" 상태 확인
echo    - 아니면 "API 사용 설정" 버튼 클릭
echo.
echo 4. IAM 권한
echo    - cloud-memo-v2@appspot.gserviceaccount.com 찾기
echo    - "Cloud Messaging 관리자" 역할 확인
echo.
echo ========================================
echo 모든 API를 활성화한 후:
echo ========================================
echo.
echo 1. 5-10분 대기 (API 전파 시간)
echo 2. 브라우저 새로고침 (Ctrl+Shift+R)
echo 3. 메모 공유 테스트
echo 4. 로그 확인: firebase functions:log
echo.
echo ========================================
pause
