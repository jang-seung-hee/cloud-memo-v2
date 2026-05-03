import * as memoService from './memo.service';
import * as templateService from './template.service';
import * as categoryService from './category.service';
import * as userService from './user.service';
import * as n8nService from './n8n.service';
import * as notificationService from './notification.service';
import * as batchService from './batch.service';

// 400라인 규정을 준수하기 위해 도메인별로 분리된 서비스들을 
// 기존 컴포넌트의 import 파편화를 방지하기 위해 하나로 묶어서 export 합니다.
export const firestoreService = {
  ...memoService,
  ...templateService,
  ...categoryService,
  ...userService,
  ...n8nService,
  ...notificationService,
  ...batchService
};

// 기존의 FirestoreService.getInstance() 패턴을 지원하기 위한 하위 호환성 클래스
export class FirestoreService {
  public static getInstance() {
    return firestoreService;
  }
}