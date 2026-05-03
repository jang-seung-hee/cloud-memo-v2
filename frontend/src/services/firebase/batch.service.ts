import {
  doc,
  writeBatch,
  WriteBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { IBatchOperation } from '../../types/firebase';
import { createFirestoreError } from './firestore-utils';

export const createBatch = (): WriteBatch => {
  return writeBatch(db);
};

export const executeBatch = async (operations: IBatchOperation[]): Promise<void> => {
  try {
    const batch = createBatch();

    operations.forEach(operation => {
      const docRef = doc(db, operation.collection, operation.docId || '');

      switch (operation.type) {
        case 'create':
          batch.set(docRef, {
            ...operation.data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...operation.data,
            updatedAt: Timestamp.now()
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('배치 작업 실행 오류:', error);
    throw createFirestoreError(error);
  }
};
