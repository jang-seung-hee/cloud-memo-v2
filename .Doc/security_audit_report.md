> **보안 점검 기준일시**: 2026년 5월 3일 09:43:23

# 보안 점검 최종 보고서

## 1. 프로젝트 개요
- **프로젝트 유형**: 웹/앱 메모 및 자동화 시스템 (React 기반 프론트엔드)
- **주요 프레임워크**: React, Vite/CRA, TailwindCSS
- **백엔드 사용 여부**: Firebase (Firestore, Storage, Auth, Functions) 사용
- **데이터베이스 / 스토리지**: Firebase Firestore, Firebase Storage
- **외부 API**: n8n Webhook 연동 (워크플로우 자동화 기능)
- **배포 환경**: Firebase Hosting 또는 Vercel/Netlify 추정 (설정 파일 기준)
- **점검 범위**: 프론트엔드(src), 백엔드(functions, Firebase Rules), 설정 파일(.env 등)
- **점검하지 못한 범위**: n8n 내부 워크플로우 로직 및 실제 인프라의 과금/할당량 설정

## 2. 종합 위험도
- **전체 위험도**: **High** (보안상 치명적이지는 않으나 인가 검증 누락이 발견됨)
- **가장 위험한 항목 TOP 3**:
  1. [SEC-002] Firestore 메모(Memos) 컬렉션의 세부 권한(수정/삭제) 검증 누락 (**High**)
  2. [SEC-004] 외부 n8n Webhook Token의 프론트엔드 노출 및 클라이언트 직접 호출 (**Medium**)
  3. [SEC-003] 카테고리(Categories) 컬렉션의 전역 읽기 권한 개방으로 인한 정보 노출 (**Medium**)

## 3. 요약 결론
현재 프로젝트는 React와 Firebase를 사용하여 현대적인 서버리스 아키텍처로 구현되어 있으며, Secret Key 등의 치명적인 하드코딩 노출은 없습니다. 그러나 **백엔드(Firestore Rules)에서 '수정/삭제 권한'을 엄밀하게 통제하지 않고 프론트엔드에 의존**하고 있는 접근 제어 결함이 있습니다. 실제 서비스 배포 전에 **반드시 Firestore 보안 규칙(Rules)을 수정하여 세부 권한 기반(Role-based) 인가 처리를 완료해야 합니다.** 현재 상태로는 내부 테스트만 권장되며 배포는 보류하는 것이 좋습니다.

## 4. 발견 항목 목록

| 번호 | 위험도 | 분류 | 위치 | 문제 요약 | 영향 | 우선순위 |
|---|---|---|---|---|---|---|
| SEC-001 | Low | 환경변수 | `frontend/.env` | Firebase API 키 평문 노출 | 정보 노출 | 낮음 |
| SEC-002 | High | DB 권한 | `firestore.rules` | 공유 메모 세부 권한 검증 누락 | 데이터 훼손 | 높음 |
| SEC-003 | Medium | DB 권한 | `firestore.rules` | categories 전역 읽기 허용 | 정보 노출 | 중간 |
| SEC-004 | Medium | 구조 설계 | `N8nMemoCreatePage.tsx` | n8n Webhook 토큰 노출 | API 오남용 | 중간 |
| SEC-005 | Low | 과호출 | `n8nWebhookService.ts`| Rate Limit 부족 | 비용 증가 | 낮음 |

## 5. 상세 분석

### [SEC-002] 메모 공유 권한(수정/삭제)의 백엔드 검증 누락
- **위험도**: High
- **점수**: 16 (영향도 4 x 악용 4)
- **파일 위치**: `backend/security/firestore.rules`
- **문제 설명**: 프론트엔드에서는 공유 권한을 바탕으로 버튼을 숨기지만, Rules에서는 단순히 `sharedWithUids` 포함 여부만 확인합니다.
- **악용 시나리오**: '읽기 전용' 사용자도 SDK를 통해 직접 수정/삭제 요청을 보내면 성공합니다.
- **권장 수정**: `sharedWith` 배열 내 객체의 `permissions.edit`, `permissions.delete` 값을 확인하도록 강화.

### [SEC-003] 카테고리 정보 전역 노출
- **위험도**: Medium
- **점수**: 9 (영향도 3 x 악용 3)
- **파일 위치**: `backend/security/firestore.rules`
- **문제 설명**: 로그인한 사용자라면 누구나 타인의 카테고리 목록을 읽을 수 있습니다.
- **권장 수정**: `resource.data.userId == request.auth.uid` 조건 추가.

### [SEC-004] n8n Webhook 토큰 및 엔드포인트 노출
- **위험도**: Medium
- **점수**: 12 (영향도 3 x 악용 4)
- **파일 위치**: `N8nMemoCreatePage.tsx`, `n8nWebhookService.ts`
- **문제 설명**: 클라이언트에서 직접 fetch를 날려 토큰이 브라우저 네트워크 탭에 노출됩니다.
- **권장 수정**: Firebase Functions를 경유하여 서버 대 서버 호출로 변경.

## 6. 즉시 조치 체크리스트

### [Critical / High 우선]
- [ ] `firestore.rules`: Memos 컬렉션 update/delete 시 `permissions` 기반 세부 권한 검증 추가

### [Medium]
- [ ] `firestore.rules`: Categories 컬렉션 read 권한을 본인 소유로 제한
- [ ] n8n Webhook 연동 방식을 Firebase Functions 경유로 변경

### [Low / Info]
- [ ] GCP Console에서 Firebase API Key에 도메인 제한 적용
- [ ] n8n 프롬프트 인젝션 방어용 구분자 추가

---
**개발자 코멘트**: 
Firestore Rule의 권한 체크 부분만 수정하면 운영 환경에 도입해도 될 만큼 탄탄한 구조입니다. 원하시면 Critical / High 항목부터 실제 수정 패치를 제안하겠습니다.
