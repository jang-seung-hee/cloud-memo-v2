import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

/**
 * n8n 음성 녹음 제어 및 상태 관리를 전담하는 커스텀 훅
 * (Screen Wake Lock API 연동으로 긴 녹음 시 절전 모드 방지 기능 제공)
 */
export const useVoiceRecorder = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordTime, setRecordTime] = useState<number>(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null); // Screen Wake Lock 레퍼런스

  // Screen Wake Lock 활성화
  const acquireWakeLock = useCallback(async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!wakeLockRef.current) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('⚡ [Wake Lock] 녹음 중 기기 화면 절전 방지 활성화');
        }
      } catch (err) {
        console.warn('⚠️ [Wake Lock] 화면 절전 방지 활성화 실패:', err);
      }
    }
  }, []);

  // Screen Wake Lock 해제
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('🔒 [Wake Lock] 화면 절전 방지 기능 비활성화');
      } catch (err) {
        console.error('❌ [Wake Lock] 화면 절전 방지 해제 실패:', err);
      }
    }
  }, []);

  // 브라우저 지원 MIME 타입 결정
  const getSupportedMimeType = useCallback((): string | undefined => {
    const candidates = ['audio/webm', 'audio/ogg', 'audio/mp3', 'audio/wav'];
    for (const candidate of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    }
    return undefined;
  }, []);

  // 타이머 작동
  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setRecordTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      chunksRef.current = [];
      setAudioFile(null);
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      // 오디오 마이크 스트림 획득
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/webm';
        const extension = mime.split(';')[0].split('/')[1] || 'webm';
        
        // 최종 Blob 병합 생성
        const audioBlob = new Blob(chunksRef.current, { type: mime });
        
        // 파일 이름 예시 생성: voice_memo_YYYYMMDD_HHMMSS.webm
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const fileName = `voice_memo_${year}${month}${day}_${hours}${minutes}${seconds}.${extension}`;

        const file = new File([audioBlob], fileName, { type: mime });
        const url = URL.createObjectURL(audioBlob);

        setAudioFile(file);
        setAudioUrl(url);
        setRecordingState('stopped');
        
        // 녹음 완료 시 일단 Wake Lock 해제 (나중에 업로드 시에 다시 걸어줌)
        releaseWakeLock();
      };

      // 녹음 시작과 동시에 Wake Lock 획득
      await acquireWakeLock();

      recorder.start(100); // 100ms 단위로 슬라이스 수집
      setRecordTime(0);
      startTimer();
      setRecordingState('recording');
    } catch (error) {
      console.error('❌ 음성 마이크 디바이스 획득 실패:', error);
      alert('마이크 접근 권한이 필요합니다. 설정에서 마이크를 승인한 뒤 다시 시도해 주세요.');
      setRecordingState('idle');
      releaseWakeLock();
    }
  }, [audioUrl, getSupportedMimeType, startTimer, acquireWakeLock, releaseWakeLock]);

  // 녹음 일시정지
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      setRecordingState('paused');
      // 일시 정지 중에는 전력 보존을 위해 Wake Lock 일시 해제
      releaseWakeLock();
    }
  }, [recordingState, stopTimer, releaseWakeLock]);

  // 녹음 재개 (이어 녹음)
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
      setRecordingState('recording');
      // 녹음 재개 시 다시 Wake Lock 획득
      acquireWakeLock();
    }
  }, [recordingState, startTimer, acquireWakeLock]);

  // 녹음 정지
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop();
      stopTimer();
      
      // 스트림 트랙 중지 (마이크 붉은 불빛 제거)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [recordingState, stopTimer]);

  // 녹음 삭제 및 리셋
  const clearRecording = useCallback(() => {
    stopTimer();
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    chunksRef.current = [];
    setAudioFile(null);
    setAudioUrl(null);
    setRecordTime(0);
    setRecordingState('idle');
    
    // 삭제 시 Wake Lock 확실하게 해제
    releaseWakeLock();
  }, [audioUrl, stopTimer, releaseWakeLock]);

  // 앱이 백그라운드에서 다시 복귀했을 때 녹음 중이면 Wake Lock 재획득
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && recordingState === 'recording') {
        await acquireWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [recordingState, acquireWakeLock]);

  // 메모리 누수 방지 및 강제 언마운트 시 Wake Lock 해제
  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      releaseWakeLock();
    };
  }, [stopTimer, releaseWakeLock]);

  return {
    recordingState,
    recordTime,
    audioFile,
    audioUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
    acquireWakeLock, // 전송 단계에서 화면 유지할 수 있게 밖으로 제공
    releaseWakeLock,
  };
};
