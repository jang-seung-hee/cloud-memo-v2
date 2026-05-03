import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import {
  IN8nWorkflow,
  N8nWorkflowCreateData,
  N8nWorkflowUpdateData
} from '../../types/n8n';
import { COLLECTIONS, FirestoreListener } from '../../types/firebase';
import { createFirestoreError } from './firestore-utils';

export const createN8nWorkflow = async (userId: string, data: N8nWorkflowCreateData): Promise<string> => {
  try {
    const workflowData = {
      userId,
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.N8N_WORKFLOWS), workflowData);
    return docRef.id;
  } catch (error) {
    console.error('❌ n8n 워크플로우 생성 실패:', error);
    throw createFirestoreError(error);
  }
};

export const getN8nWorkflows = async (userId: string): Promise<IN8nWorkflow[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.N8N_WORKFLOWS),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const workflows = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IN8nWorkflow[];

    return workflows.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  } catch (error) {
    console.error('❌ n8n 워크플로우 목록 조회 실패:', error);
    throw createFirestoreError(error);
  }
};

export const updateN8nWorkflow = async (workflowId: string, data: N8nWorkflowUpdateData): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.N8N_WORKFLOWS, workflowId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('❌ n8n 워크플로우 업데이트 실패:', error);
    throw createFirestoreError(error);
  }
};

export const deleteN8nWorkflow = async (workflowId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.N8N_WORKFLOWS, workflowId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('❌ n8n 워크플로우 삭제 실패:', error);
    throw createFirestoreError(error);
  }
};

export const onN8nWorkflowsSnapshot = (userId: string, callback: FirestoreListener<IN8nWorkflow>): Unsubscribe => {
  const q = query(
    collection(db, COLLECTIONS.N8N_WORKFLOWS),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const workflows = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IN8nWorkflow[];

    const sortedWorkflows = workflows.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    callback(sortedWorkflows);
  }, (error) => {
    console.error('❌ n8n 워크플로우 실시간 리스너 오류:', error);
  });
};
