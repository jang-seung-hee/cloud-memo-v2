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
    window.open(url, '_blank', 'width=800,height=600');
  }


}

// 싱글톤 인스턴스 생성
export const googleCalendarService = new GoogleCalendarService(); 