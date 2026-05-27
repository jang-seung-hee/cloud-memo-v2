import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { Mic, Square, Pause, Play, Trash2, RotateCcw, Volume2, CheckCircle2 } from 'lucide-react';

interface VoiceRecorderUIProps {
  isMobileLightMode: boolean;
  onAudioChange: (file: File | null) => void;
  onRecordingStateChange?: (isRecordingOrPaused: boolean) => void;
  className?: string;
}

/**
 * n8n 전용 컴팩트 액션 버튼 + 녹음 모달 UI 컴포넌트
 */
export const VoiceRecorderUI: React.FC<VoiceRecorderUIProps> = ({
  isMobileLightMode,
  onAudioChange,
  onRecordingStateChange,
  className,
}) => {
  const {
    recordingState,
    recordTime,
    audioFile,
    audioUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecorder();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // 오디오 파일 상태 변경 시 부모 컴포넌트에 파일 정보 전달
  useEffect(() => {
    onAudioChange(audioFile);
  }, [audioFile, onAudioChange]);

  // 녹음 상태 변경 시 부모 컴포넌트에 녹음 실행 여부 전달
  useEffect(() => {
    if (onRecordingStateChange) {
      const isWorking = recordingState === 'recording' || recordingState === 'paused';
      onRecordingStateChange(isWorking);
    }
  }, [recordingState, onRecordingStateChange]);

  // 초 단위 시간을 00:00 포맷으로 변환
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 모달 닫기 제어 (녹음 중일 땐 닫히지 않고 경고)
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (recordingState === 'recording' || recordingState === 'paused') {
        if (!window.confirm('녹음이 진행 중입니다. 정말로 녹음창을 닫으시겠습니까? (녹음 중인 데이터는 정지 후 보관해야 저장됩니다)')) {
          return;
        }
        // 강제 정지 및 초기화
        clearRecording();
      }
      setIsModalOpen(false);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {/* 🎙️ 1. 메인 화면에 표시되는 컴팩트한 병합 액션 버튼 */}
      {audioFile === null ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className={`h-8 rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/20 px-3 flex items-center gap-1.5 transition-all duration-200 active:scale-[0.97] ${className || ''}`}
        >
          <Mic className="h-4 w-4" />
          <span className="text-xs font-semibold">음성 녹음</span>
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className={`h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-3 flex items-center gap-1.5 transition-all duration-200 active:scale-[0.97] shadow-sm animate-pulse ${className || ''}`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-bold">음성 첨부됨</span>
        </Button>
      )}

      {/* 🚀 2. 클릭 시 팝업되는 고급 녹음 컨트롤 다이얼로그 (모달) */}
      <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className={`w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl border-2 ${
          isMobileLightMode ? 'bg-white border-gray-200 shadow-2xl' : 'shadow-2xl bg-card border-border'
        }`}>
          <DialogHeader className="pr-6">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Mic className="h-5 w-5 text-purple-500 shrink-0" />
              <span>음성 메모 녹음</span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-snug opacity-80">
              n8n 웹훅으로 다이렉트 전송할 오디오 메모를 녹음합니다. (백엔드 서버에는 저장되지 않습니다)
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col gap-4 items-center justify-center">
            
            {/* A. 기본 상태 (Idle): 녹음 대기 */}
            {recordingState === 'idle' && (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center animate-bounce">
                  <Mic className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  아래 버튼을 눌러 녹음을 시작하세요.
                </p>
                <Button
                  type="button"
                  onClick={startRecording}
                  className="w-40 h-11 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.97] transition-all font-semibold"
                >
                  <Mic className="h-4 w-4" />
                  녹음 시작
                </Button>
              </div>
            )}

            {/* B. 녹음 중 또는 일시정지 상태 */}
            {(recordingState === 'recording' || recordingState === 'paused') && (
              <div className="flex flex-col gap-4 items-center py-4 w-full">
                {/* 타이머 */}
                <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/30 px-6 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className={`flex h-2.5 w-2.5 rounded-full ${
                    recordingState === 'recording' ? 'bg-red-500 animate-ping' : 'bg-amber-500'
                  }`} />
                  <span className="text-3xl font-bold font-mono tracking-wider tabular-nums">
                    {formatTime(recordTime)}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    recordingState === 'recording'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                  }`}>
                    {recordingState === 'recording' ? '녹음 중' : '일시정지'}
                  </span>
                </div>

                {/* 컨트롤 버튼 */}
                <div className="flex items-center justify-center gap-4 w-full max-w-[280px] mt-2">
                  {recordingState === 'recording' ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={pauseRecording}
                      className="flex-1 h-10 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/10 flex items-center justify-center gap-1.5 active:scale-[0.97]"
                    >
                      <Pause className="h-4 w-4" />
                      <span className="text-xs font-bold">일시정지</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resumeRecording}
                      className="flex-1 h-10 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/10 flex items-center justify-center gap-1.5 active:scale-[0.97]"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span className="text-xs font-bold">이어 녹음</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={stopRecording}
                    className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.97]"
                  >
                    <Square className="h-4 w-4 fill-current" />
                    <span className="text-xs font-bold">녹음 완료</span>
                  </Button>
                </div>
              </div>
            )}

            {/* C. 녹음 완료 상태 (Stopped) */}
            {recordingState === 'stopped' && audioUrl && (
              <div className="flex flex-col gap-4 w-full px-2 py-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      녹음 완료 미리듣기
                    </span>
                  </div>
                  {audioFile && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(audioFile.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>

                <div className="w-full bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <audio
                    src={audioUrl}
                    controls
                    controlsList="nodownload"
                    className="w-full h-8 outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 mt-1 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startRecording}
                    className="flex-1 h-9 rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/20 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    다시 녹음
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearRecording}
                    className="flex-1 h-9 rounded-lg border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/20 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    녹음 삭제
                  </Button>
                </div>

                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full h-10 mt-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl shadow-sm text-xs font-bold"
                >
                  음성 메모 첨부 완료
                </Button>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
