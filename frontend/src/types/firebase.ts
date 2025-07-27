import { Timestamp } from 'firebase/firestore';

// Firebase 기본 문서 인터페이스
export interface FirebaseDocument {
  id: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 사용자 프로필 인터페이스
export interface IUserProfile extends FirebaseDocument {
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  lastLoginAt: Timestamp;
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: 'ko' | 'en';
    notifications: boolean;
  };
}

// 메모 인터페이스 (Firebase용)
export interface IFirebaseMemo {
  id: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  category: 'temporary' | 'memory' | 'archive';
  isDraft?: boolean;
  isImportant?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  userId: string;
}

// 템플릿 인터페이스 (Firebase용)
export interface IFirebaseTemplate extends FirebaseDocument {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  usageCount: number;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface IFirebaseCategory {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 메모 생성 데이터 인터페이스
export interface IMemoCreateData {
  title: string;
  content: string;
  images: File[];
  tags: string[];
  category: 'temporary' | 'memory' | 'archive';
  templateId?: string;
}

// 템플릿 생성 데이터 인터페이스
export interface ITemplateCreateData {
  title: string;
  content: string;
  category?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

// 메모 업데이트 데이터 인터페이스
export interface IMemoUpdateData {
  title?: string;
  content?: string;
  images?: string[];
  tags?: string[];
  category?: 'temporary' | 'memory' | 'archive';
  isDraft?: boolean;
  isImportant?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
}

// 템플릿 업데이트 데이터 인터페이스
export interface ITemplateUpdateData {
  title?: string;
  content?: string;
  category?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

// 쿼리 옵션 인터페이스
export interface IQueryOptions {
  limit?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  where?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';
    value: any;
  }>;
}

// Firestore 컬렉션 이름 상수
export const COLLECTIONS = {
  USERS: 'users',
  MEMOS: 'memos',
  TEMPLATES: 'templates',
  CATEGORIES: 'categories'
} as const;

// 컬렉션 이름 타입
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

// Firestore 오류 타입
export interface FirestoreError {
  code: string;
  message: string;
  details?: any;
}

// 실시간 리스너 콜백 타입
export type FirestoreListener<T> = (data: T[]) => void;

// 배치 작업 타입
export interface IBatchOperation {
  type: 'create' | 'update' | 'delete';
  collection: CollectionName;
  docId?: string;
  data?: any;
} 