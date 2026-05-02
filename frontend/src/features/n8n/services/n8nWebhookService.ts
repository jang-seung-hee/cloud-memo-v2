/**
 * n8n 웹훅 전송을 담당하는 서비스
 */
export const n8nWebhookService = {
  /**
   * n8n 워크플로우 웹훅으로 메모와 첨부파일을 전송합니다.
   * @param webhookUrl n8n 웹훅 URL
   * @param token 보안 토큰 (옵션)
   * @param payload 전송할 데이터 (제목, 내용)
   * @param files 첨부파일 배열
   */
  sendMemoToN8n: async (
    webhookUrl: string,
    token: string | undefined,
    payload: { title: string; content: string },
    files: File[]
  ): Promise<boolean> => {
    try {
      const formData = new FormData();
      
      // 텍스트 데이터 추가
      formData.append('title', payload.title);
      formData.append('content', payload.content);
      
      // 파일 데이터 추가 (n8n에서 접근하기 쉽도록 배열 형태로 전송)
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          // n8n의 파일 노드에서는 이름이 중요할 수 있습니다.
          formData.append(`file_${index}`, file, file.name);
        });
        formData.append('fileCount', files.length.toString());
      }

      // 헤더 설정 (토큰이 있는 경우만)
      const headers: Record<string, string> = {};
      if (token && token.trim() !== '') {
        headers['X-N8N-TOKEN'] = token;
      }
      
      // fetch로 전송
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: formData, // FormData를 사용하면 fetch가 알아서 multipart/form-data 헤더와 boundary를 설정합니다.
      });

      if (!response.ok) {
        console.error(`n8n 웹훅 전송 실패: HTTP ${response.status} ${response.statusText}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('n8n 웹훅 전송 중 오류 발생:', error);
      return false;
    }
  }
};
