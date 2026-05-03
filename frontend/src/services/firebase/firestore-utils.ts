export const createFirestoreError = (error: any): Error => {
  return new Error(`Firestore 오류: ${error.message || error}`);
};
