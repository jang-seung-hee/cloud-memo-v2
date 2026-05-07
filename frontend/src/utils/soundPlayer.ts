/**
 * 효과음 재생 유틸리티 (중앙 집중 관리)
 *
 * 볼륨, 재생 속도 등 효과음 설정을 한 곳에서 관리합니다.
 * 효과음 파일 경로는 src/config/siteConfig.ts의 sounds 항목에서 관리합니다.
 *
 * 복제 시 참고: soundSettings의 volume/playbackRate 값만 조정하면
 * 고객사별 청각 피드백 경험을 커스터마이징할 수 있습니다.
 */

import { siteConfig } from '../config/siteConfig';

/** 효과음 종류 */
export type SoundType = 'success' | 'error' | 'delete';

/** 효과음별 재생 설정 */
const soundSettings: Record<SoundType, { volume: number; playbackRate: number }> = {
  /** 메모/n8n 등록 성공 시: 볼륨 80%, 정상 속도 */
  success: { volume: 0.8, playbackRate: 1.0 },
  /** 메모/n8n 등록 실패 시: 볼륨 30%, 정상 속도 */
  error: { volume: 0.3, playbackRate: 1.0 },
  /** 메모 삭제 시: 볼륨 15%, 2배속 */
  delete: { volume: 0.15, playbackRate: 2.5 },
};

/**
 * 지정된 종류의 효과음을 재생합니다.
 * 재생 실패 시 콘솔 경고만 출력하며, UI 동작에 영향을 주지 않습니다.
 *
 * @param type 재생할 효과음 종류 ('success' | 'error' | 'delete')
 */
export const playSound = (type: SoundType): void => {
  try {
    const { volume, playbackRate } = soundSettings[type];
    const audio = new Audio(siteConfig.sounds[type]);
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    audio.play().catch(e => console.log('Audio play failed:', e));
  } catch (e) {
    console.log('Audio init failed:', e);
  }
};
