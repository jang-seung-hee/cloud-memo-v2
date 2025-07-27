import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { MoonIcon, SunIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../hooks/useTheme';
import { useFontSize, FontSizeType } from '../hooks/useFontSize';
import { useToast } from '../hooks/use-toast';

export const SettingsPage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { fontSize, changeFontSize, fontSizeClasses, getFontSizeFromSlider, getSliderValueFromFontSize } = useFontSize();
  const { toast } = useToast();
  const [sliderValue, setSliderValue] = useState<number>(getSliderValueFromFontSize(fontSize));

  // fontSize가 변경될 때 sliderValue도 업데이트
  useEffect(() => {
    setSliderValue(getSliderValueFromFontSize(fontSize));
  }, [fontSize, getSliderValueFromFontSize]);

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    setSliderValue(newValue);
    const newFontSize = getFontSizeFromSlider(newValue);
    changeFontSize(newFontSize);
    
    // 슬라이더 변경 시 자동으로 토스트 알림 표시
    toast({
      title: "✅ 설정 저장 완료",
      description: "글씨 크기 설정이 성공적으로 저장되었습니다.",
    });
  };

  const fontSizeLabels = [
    '매우 작게',
    '작게', 
    '보통',
    '크게',
    '매우 크게'
  ];

  return (
    <Layout title="환경설정">
      <div className="space-y-8">
        {/* 글씨 크기 설정 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">글씨 크기 설정</h2>
          <div className="p-6 border rounded-lg bg-card">
            <div className="space-y-6">
              <div>
                <p className="font-medium mb-2">텍스트 크기</p>
                <p className="text-sm text-muted-foreground mb-4">
                  슬라이더를 조정하면 자동으로 저장됩니다. 메모와 상용구의 글씨 크기를 조절할 수 있습니다.
                </p>
              </div>
              
              <div className="space-y-4">
                {/* 슬라이더 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">글씨 크기</span>
                    <span className="text-sm text-muted-foreground">
                      {fontSizeLabels[sliderValue - 1]}
                    </span>
                  </div>
                  <Slider
                    value={[sliderValue]}
                    onValueChange={handleSliderChange}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>매우 작게</span>
                    <span>매우 크게</span>
                  </div>
                </div>
              </div>

              {/* 미리보기 */}
              <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <EyeIcon className="h-4 w-4" />
                  <p className="text-sm font-medium">미리보기</p>
                </div>
                <div className="space-y-4">
                  {/* 메모 예시 */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">📝 메모 예시</h4>
                    <div className="space-y-2">
                      <h3 className={`font-semibold ${fontSizeClasses.title}`}>
                        메모 제목 예시
                      </h3>
                      <p className={`text-muted-foreground ${fontSizeClasses.content}`}>
                        이것은 메모 내용의 예시입니다. 글씨 크기가 어떻게 보이는지 확인할 수 있습니다.
                      </p>
                      <p className={`text-muted-foreground ${fontSizeClasses.date}`}>
                        2024년 1월 15일 (14:30)
                      </p>
                    </div>
                  </div>

                  {/* 상용구 예시 */}
                  <div className="space-y-2 pt-3 border-t border-border/30">
                    <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <DocumentTextIcon className="h-3 w-3" />
                      상용구 예시
                    </h4>
                    <div className="space-y-2">
                      <h3 className={`font-semibold ${fontSizeClasses.title}`}>
                        상용구 제목 예시
                      </h3>
                      <p className={`text-muted-foreground ${fontSizeClasses.content}`}>
                        이것은 상용구 내용의 예시입니다. 자주 사용하는 문구의 글씨 크기도 함께 조절됩니다.
                      </p>
                      <p className={`text-muted-foreground ${fontSizeClasses.date}`}>
                        수정: 2024년 1월 15일
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 테마 설정 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">테마 설정</h2>
          <div className="p-6 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">다크모드</p>
                <p className="text-sm text-muted-foreground">
                  {isDark ? '다크 테마가 활성화되어 있습니다.' : '라이트 테마가 활성화되어 있습니다.'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="flex items-center gap-2"
              >
                {isDark ? (
                  <>
                    <SunIcon className="h-4 w-4" />
                    라이트모드
                  </>
                ) : (
                  <>
                    <MoonIcon className="h-4 w-4" />
                    다크모드
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}; 