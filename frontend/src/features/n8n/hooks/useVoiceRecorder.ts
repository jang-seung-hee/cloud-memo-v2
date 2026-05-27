import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

/**
 * n8n 음성 녹음 제어 및 상태 관리를 전담하는 커스텀 훅
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

  // 브라우저 지원 MIME 타입 결정
  const getSupportedMimeType = useCallback((): string | undefined => {
    // webm이 표준이며 n8n 및 STT에서 가장 널리 지원됨
    const candidates = ['audio/webm', 'audio/ogg', 'audio/mp3', 'audio/wav'];
    for (const candidate of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    }
    return undefined; // 지원하지 않으면 브라우저 기본 코덱 사용
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
      };

      recorder.start(100); // 100ms 단위로 슬라이스 수집
      setRecordTime(0);
      startTimer();
      setRecordingState('recording');
    } catch (error) {
      console.error('❌ 음성 마이크 디바이스 획득 실패:', error);
      alert('마이크 접근 권한이 필요합니다. 설정에서 마이크를 승인한 뒤 다시 시도해 주세요.');
      setRecordingState('idle');
    }
  }, [audioUrl, getSupportedMimeType, startTimer]);

  // 녹음 일시정지
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      setRecordingState('paused');
    }
  }, [recordingState, stopTimer]);

  // 녹음 재개 (이어 녹음)
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
      setRecordingState('recording');
    }
  }, [recordingState, startTimer]);

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
  }, [audioUrl, stopTimer]);

  // 메모리 누수 방지를 위해 언마운트 시 클린업
  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stopTimer]);

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
  };
};
