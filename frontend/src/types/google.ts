// Google Calendar API 관련 타입 정의

export interface IGoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

export interface IGoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface IGoogleCalendarEventResponse {
  id: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export interface IGoogleCalendarError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

// Google Calendar API 응답 타입
export interface IGoogleCalendarListResponse {
  items: IGoogleCalendar[];
  nextPageToken?: string;
}

// Calendar 이벤트 생성 요청 타입
export interface ICreateCalendarEventRequest {
  calendarId: string;
  event: IGoogleCalendarEvent;
} 