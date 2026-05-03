/**
 * n8n 웹훅 전송을 담당하는 서비스
 */
export const n8nWebhookService = {
  /**
   * n8n 워크플로우 웹훅으로 메모와 첨부파일을 전송합니다.
   * @param webhookUrl n8n 웹훅 URL
   * @param token 보안 토큰 (옵션)
   * @param payload 전송할 데이터 (제목, 내용, 메모 ID 등)
   * @param files 첨부파일 배열
   */
  sendMemoToN8n: async (
    webhookUrl: string,
    token: string | undefined,
    payload: { title: string; content: string; memoId?: string },
    files: File[],
    signal?: AbortSignal
  ): Promise<{ success: boolean; data?: any; status?: number; statusText?: string }> => {
    try {
      const formData = new FormData();
      
      // 텍스트 데이터 추가
      formData.append('title', payload.title);
      formData.append('content', payload.content);
      if (payload.memoId) {
        formData.append('memoId', payload.memoId);
      }
      
      // 파일 데이터 추가
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file, file.name);
        });
        formData.append('fileCount', files.length.toString());
      }

      const headers: Record<string, string> = {};
      if (token && token.trim() !== '') {
        headers['X-N8N-TOKEN'] = token;
      }
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: formData,
        signal, // 타임아웃 처리를 위한 시그널 추가
      });

      const status = response.status;
      const statusText = response.statusText;

      if (!response.ok) {
        console.error(`n8n 웹훅 전송 실패: HTTP ${status} ${statusText}`);
        return { success: false, status, statusText };
      }

      try {
        const data = await response.json();
        return { success: true, data, status, statusText };
      } catch (e) {
        return { success: true, status, statusText };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('n8n 웹훅 전송 타임아웃');
      } else {
        console.error('n8n 웹훅 전송 중 오류 발생:', error);
      }
      return { success: false, statusText: error.message };
    }
  }
};
