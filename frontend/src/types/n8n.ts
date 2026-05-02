import { Timestamp } from 'firebase/firestore';

/**
 * n8n 워크플로우 연동 정보 인터페이스
 */
export interface IN8nWorkflow {
  id: string;          // 고유 식별자 (Firestore Doc ID)
  userId: string;      // 사용자 UID
  name: string;        // 워크플로우 이름 (사용자 지정)
  url: string;         // n8n Webhook URL
  token?: string;      // 인증 토큰 (보안용)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 워크플로우 생성 시 필요한 데이터 타입
 */
export type N8nWorkflowCreateData = Omit<IN8nWorkflow, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

/**
 * 워크플로우 수정 시 필요한 데이터 타입
 */
export type N8nWorkflowUpdateData = Partial<N8nWorkflowCreateData>;
