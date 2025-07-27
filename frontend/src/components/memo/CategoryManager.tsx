import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { firestoreService } from '../../services/firebase/firestore';
import { ICategory } from '../../types/template';
import { useDevice } from '../../hooks/useDevice';
import { useTheme } from '../../hooks/useTheme';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdate: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
  onCategoriesUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isDesktop } = useDevice();
  const { isDark } = useTheme();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 모바일 + 라이트 모드일 때의 스타일 조건
  const isMobileLightMode = !isDesktop && !isDark;

  // 카테고리 슬롯 초기화 (5개)
  const initializeCategories = () => {
    const slots: ICategory[] = [];
    for (let i = 0; i < 5; i++) {
      slots.push({
        id: `slot-${i}`,
        name: '',
        isActive: true, // 기본적으로 활성화
        order: i,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return slots;
  };

  // 카테고리 로드
  const loadCategories = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const firebaseCategories = await firestoreService.getCategoriesByUserId(user.uid);
      
      // Firebase 데이터를 ICategory 형식으로 변환
      const convertedCategories: ICategory[] = firebaseCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        isActive: cat.isActive,
        order: cat.order,
        createdAt: cat.createdAt.toDate(),
        updatedAt: cat.updatedAt.toDate()
      }));

      // 5개 슬롯으로 초기화하고 기존 데이터 채우기
      const slots = initializeCategories();
      convertedCategories.forEach((cat, index) => {
        if (index < 5) {
          slots[index] = cat;
        }
      });

      setCategories(slots);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      toast({
        title: "카테고리 로드 실패",
        description: "카테고리를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리 저장
  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      
      // 활성화된 카테고리만 필터링
      const activeCategories = categories.filter(cat => cat.isActive && cat.name.trim());
      
      // 기존 카테고리 삭제
      const existingCategories = await firestoreService.getCategoriesByUserId(user.uid);
      for (const cat of existingCategories) {
        await firestoreService.deleteCategory(cat.id);
      }

      // 새 카테고리 생성
      for (const cat of activeCategories) {
        await firestoreService.createCategory(user.uid, {
          name: cat.name.trim(),
          isActive: cat.isActive,
          order: cat.order
        });
      }

      toast({
        title: "저장 완료",
        description: "카테고리가 성공적으로 저장되었습니다."
      });

      onCategoriesUpdate();
      onClose();
    } catch (error) {
      console.error('카테고리 저장 실패:', error);
      toast({
        title: "저장 실패",
        description: "카테고리 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 카테고리 이름 변경
  const handleNameChange = (index: number, name: string) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      name: name.slice(0, 4), // 4자까지만 입력 가능
      updatedAt: new Date()
    };
    setCategories(updatedCategories);
  };

  // 카테고리 활성화/비활성화 (사용 안함 체크)
  const handleActiveChange = (index: number, isActive: boolean) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      isActive: !isActive, // 체크박스가 체크되면 비활성화
      updatedAt: new Date()
    };
    setCategories(updatedCategories);
  };

  // 컴포넌트 마운트 시 카테고리 로드
  useEffect(() => {
    if (isOpen && user) {
      loadCategories();
    }
  }, [isOpen, user]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-lg ${
        isMobileLightMode 
          ? 'bg-white border-gray-200 shadow-lg' 
          : ''
      }`}>
        <DialogHeader>
          <DialogTitle className={`${
            isMobileLightMode 
              ? 'text-gray-800' 
              : 'text-foreground'
          }`}>
            카테고리 관리
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className={`${
                isMobileLightMode 
                  ? 'text-gray-600' 
                  : 'text-muted-foreground'
              }`}>카테고리를 불러오는 중...</div>
            </div>
          ) : (
            <>
              {/* 테이블 헤더 */}
              <div className={`grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2 ${
                isMobileLightMode 
                  ? 'text-gray-600 border-gray-200' 
                  : 'text-muted-foreground border-border'
              }`}>
                <div className="text-center">순서</div>
                <div className="text-center">최대4글자</div>
                <div className={`text-center ${
                  isMobileLightMode 
                    ? 'text-red-600' 
                    : 'text-red-600'
                }`}>사용 안함</div>
              </div>

              {/* 카테고리 슬롯들 */}
              <div className="space-y-3">
                {categories.map((category, index) => (
                  <div key={category.id} className="grid grid-cols-3 gap-4 items-center">
                    {/* 순서 */}
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-medium ${
                        isMobileLightMode 
                          ? 'bg-gray-100 text-gray-700' 
                          : 'bg-muted text-foreground'
                      }`}>
                        {index + 1}번
                      </div>
                    </div>
                    
                    {/* 명칭 입력 */}
                    <div className="text-center">
                      <Input
                        type="text"
                        placeholder="카테고리명"
                        value={category.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(index, e.target.value)}
                        maxLength={4}
                        className={`text-center ${
                          isMobileLightMode 
                            ? 'border-gray-300 focus:border-blue-500 bg-white' 
                            : ''
                        }`}
                        disabled={!category.isActive}
                      />
                    </div>
                    
                    {/* 사용 안함 체크박스 */}
                    <div className="text-center">
                      <Checkbox
                        id={`disable-${index}`}
                        checked={!category.isActive}
                        onCheckedChange={(checked: boolean | string) => 
                          handleActiveChange(index, checked as boolean)
                        }
                        className="mx-auto"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 저장 버튼 */}
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  className={`w-full ${
                    isMobileLightMode 
                      ? 'bg-gradient-to-r from-[#87ceeb] to-[#4682b4] hover:from-[#7bb8d9] hover:to-[#3d6b9a] text-white shadow-md' 
                      : ''
                  }`}
                  disabled={isSaving}
                >
                  {isSaving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 