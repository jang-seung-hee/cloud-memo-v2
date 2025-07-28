import { IMemo } from '../../types/memo';

/**
 * Google Calendar 웹 URL 서비스 클래스
 * OAuth 토큰 없이 Google Calendar 웹 URL을 생성하여 일정 추가
 */
export class GoogleCalendarService {

  /**
   * Google Calendar 웹 URL 생성 (OAuth 토큰 없이 사용 가능)
   */
  createCalendarEventUrl(
    memo: IMemo, 
    dateTime: Date, 
    durationMinutes: number = 60
  ): string {
    const startTime = new Date(dateTime);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: memo.title || '메모',
      dates: `${startTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      details: memo.content || '',
      sf: 'true',
      output: 'xml'
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Google Calendar 웹 URL로 새 창 열기
   */
  openCalendarEvent(memo: IMemo, dateTime: Date, durationMinutes: number = 60): void {
    const url = this.createCalendarEventUrl(memo, dateTime, durationMinutes);
    
    try {
      // 팝업 차단 방지를 위한 더 안전한 방식
      const popup = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      // 팝업이 차단되었는지 확인
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // 팝업이 차단된 경우 새 탭으로 열기
        window.open(url, '_blank');
      }
    } catch (error) {
      console.warn('팝업 열기 실패, 새 탭으로 열기:', error);
      // 에러 발생 시 새 탭으로 열기
      window.open(url, '_blank');
    }
  }


}

// 싱글톤 인스턴스 생성
export const googleCalendarService = new GoogleCalendarService(); 