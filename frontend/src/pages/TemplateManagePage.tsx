import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  BookmarkIcon,
  XMarkIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { ITemplate, ITemplateFormData } from '../types/template';
import { firestoreService } from '../services/firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { useCategories } from '../hooks/useCategories';
import { CategoryManager } from '../components/memo/CategoryManager';
import { useDevice } from '../hooks/useDevice';
import { useTheme } from '../hooks/useTheme';

// 기본 템플릿 데이터 제거 - 사용자가 직접 생성하도록 변경
const defaultTemplates: ITemplate[] = [];

export const TemplateManagePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeCategories, categories: userCategories, loading: categoriesLoading, refresh: refreshCategories } = useCategories();
  const { isDesktop } = useDevice();
  const { isDark } = useTheme();
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ITemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<ITemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<ITemplateFormData>({
    title: '',
    content: '',
    category: ''
  });
  
  // 모바일 + 라이트 모드일 때의 스타일 조건
  const isMobileLightMode = !isDesktop && !isDark;

  // 템플릿 데이터 로드
  useEffect(() => {
    const loadTemplates = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔄 TemplateManagePage 템플릿 로드 시작...');
        
        // 로컬 스토리지에서 상용구 관련 데이터 삭제
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.includes('template') || key.includes('상용구') || key.includes('템플릿')
        );
        keysToRemove.forEach(key => {
          console.log('🗑️ 로컬 스토리지 데이터 삭제:', key);
          localStorage.removeItem(key);
        });
        
        const userTemplates = await firestoreService.getTemplatesByUserId(user.uid);
        
        if (userTemplates.length === 0) {
          // 사용자의 템플릿이 없으면 빈 배열로 설정
          console.log('📝 사용자 템플릿이 없습니다.');
          setTemplates([]);
        } else {
          // Firebase에서 로드한 템플릿을 ITemplate 형식으로 변환
          const convertedTemplates: ITemplate[] = userTemplates.map(template => ({
            id: template.id,
            title: template.title,
            content: template.content,
            category: template.category || '기타',
            createdAt: template.createdAt.toDate(),
            updatedAt: template.updatedAt.toDate()
          }));
          
          // 클라이언트에서 정렬 (최신순)
          const sortedTemplates = convertedTemplates.sort((a, b) => {
            return b.updatedAt.getTime() - a.updatedAt.getTime();
          });
          
          setTemplates(sortedTemplates);
        }
      } catch (error) {
        console.error('템플릿 로드 중 오류:', error);
        toast({
          title: "템플릿 로드 실패",
          description: "템플릿을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [user, toast]);

  // 카테고리 목록 생성 (사용자 정의 카테고리 + 전체)
  const categories = ['전체', ...activeCategories.map(cat => cat.name)];

  // 필터링된 템플릿
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 새 템플릿 추가
  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      title: '',
      content: '',
      category: activeCategories.length > 0 ? activeCategories[0].name : ''
    });
    setIsDialogOpen(true);
  };

  // 템플릿 수정
  const handleEditTemplate = (template: ITemplate) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      content: template.content,
      category: template.category
    });
    setIsDialogOpen(true);
  };

  // 카테고리 업데이트 시 템플릿 목록 새로고침
  const handleCategoriesUpdate = () => {
    refreshCategories();
    // 템플릿 목록도 새로고침
    if (user) {
      const loadTemplates = async () => {
        try {
          const userTemplates = await firestoreService.getTemplatesByUserId(user.uid);
          const convertedTemplates: ITemplate[] = userTemplates.map(template => ({
            id: template.id,
            title: template.title,
            content: template.content,
            category: template.category || '기타',
            createdAt: template.createdAt.toDate(),
            updatedAt: template.updatedAt.toDate()
          }));
          
          const sortedTemplates = convertedTemplates.sort((a, b) => {
            return b.updatedAt.getTime() - a.updatedAt.getTime();
          });
          
          setTemplates(sortedTemplates);
        } catch (error) {
          console.error('템플릿 새로고침 실패:', error);
        }
      };
      loadTemplates();
    }
  };

  // 템플릿 삭제 다이얼로그 열기
  const handleDeleteTemplate = (template: ITemplate) => {
    setDeletingTemplate(template);
  };

  // 템플릿 삭제 실행
  const executeDeleteTemplate = async () => {
    if (!user || !deletingTemplate) return;

    setIsDeleting(true);
    try {
      await firestoreService.deleteTemplate(deletingTemplate.id);
      const updatedTemplates = templates.filter(t => t.id !== deletingTemplate.id);
      setTemplates(updatedTemplates);
      toast({
        title: "삭제 완료",
        description: "상용구가 성공적으로 삭제되었습니다."
      });
    } catch (error) {
      console.error('템플릿 삭제 중 오류:', error);
      toast({
        title: "삭제 실패",
        description: "상용구 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeletingTemplate(null);
    }
  };

  // 폼 제출 처리
  const handleSubmit = async () => {
    if (!user) return;
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category.trim()) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingTemplate) {
        // 수정
        await firestoreService.updateTemplate(editingTemplate.id, {
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category.trim()
        });

        const updatedTemplates = templates.map(t => 
          t.id === editingTemplate.id 
            ? { 
                ...t, 
                title: formData.title.trim(),
                content: formData.content.trim(),
                category: formData.category.trim(),
                updatedAt: new Date()
              }
            : t
        );
        setTemplates(updatedTemplates);
        
        toast({
          title: "수정 완료",
          description: "상용구가 성공적으로 수정되었습니다."
        });
      } else {
        // 추가
        const templateId = await firestoreService.createTemplate(user.uid, {
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category.trim(),
          isPublic: false
        });

        const newTemplate: ITemplate = {
          id: templateId,
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category.trim(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setTemplates(prevTemplates => {
          const updatedTemplates = [newTemplate, ...prevTemplates];
          console.log('📝 상용구 추가 후 목록:', updatedTemplates);
          return updatedTemplates;
        });
        
        toast({
          title: "추가 완료",
          description: "상용구가 성공적으로 추가되었습니다."
        });
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData({ title: '', content: '', category: '' });
    } catch (error) {
      console.error('템플릿 저장 중 오류:', error);
      toast({
        title: "저장 실패",
        description: "상용구 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // 폼 취소
  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    setFormData({
      title: '',
      content: '',
      category: ''
    });
  };

  // 카테고리 상태 확인 함수
  const getCategoryStatus = (categoryName: string) => {
    const category = userCategories.find(cat => cat.name === categoryName);
    if (!category) {
      return 'deleted'; // 카테고리가 삭제됨
    }
    if (!category.isActive) {
      return 'inactive'; // 카테고리가 비활성화됨
    }
    return 'active'; // 카테고리가 활성화됨
  };

  // 카테고리 배지 스타일 함수
  const getCategoryBadgeStyle = (categoryName: string) => {
    const status = getCategoryStatus(categoryName);
    switch (status) {
      case 'active':
        return 'text-xs text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded';
      case 'inactive':
        return 'text-xs text-orange-700 bg-orange-100 border border-orange-200 px-2 py-1 rounded';
      case 'deleted':
        return 'text-xs text-red-700 bg-red-100 border border-red-200 px-2 py-1 rounded';
      default:
        return 'text-xs text-muted-foreground bg-muted px-2 py-1 rounded';
    }
  };

  // 카테고리 상태 텍스트 함수
  const getCategoryStatusText = (categoryName: string) => {
    const status = getCategoryStatus(categoryName);
    switch (status) {
      case 'active':
        return categoryName;
      case 'inactive':
        return `${categoryName} (사용안함)`;
      case 'deleted':
        return `${categoryName} (수정권고)`; // '삭제됨'을 '수정권고'로 변경
      default:
        return categoryName;
    }
  };

  if (isLoading) {
    return (
      <Layout title="상용구 관리" showSettingsButton={true}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">로딩 중...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="상용구 관리" showSettingsButton={false}>
      <div className="space-y-6">
        {/* 액션 버튼들, 검색, 카테고리 필터 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={handleAddTemplate}
                  className={`flex items-center gap-2 ${
                    isMobileLightMode 
                      ? 'bg-gradient-to-r from-[#87ceeb] to-[#4682b4] hover:from-[#7bb8d9] hover:to-[#3d6b9a] text-white shadow-md' 
                      : ''
                  }`}
                >
                  <PlusIcon className="h-4 w-4" />
                  새 상용구
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Button
              onClick={() => setIsCategoryManagerOpen(true)}
              variant="outline"
              className={`flex items-center gap-2 ${
                isMobileLightMode 
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900' 
                  : ''
              }`}
            >
              <Cog6ToothIcon className="h-4 w-4" />
              카테고리관리
            </Button>
          </div>
          
          {/* 검색 입력 */}
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                isMobileLightMode 
                  ? 'text-gray-400' 
                  : 'text-muted-foreground'
              }`} />
              <Input
                type="text"
                placeholder="상용구 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${
                  isMobileLightMode 
                    ? 'border-gray-300 focus:border-blue-500 bg-white' 
                    : ''
                }`}
              />
            </div>
          </div>
          
          {/* 카테고리 필터 */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {categories.map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-2 py-1 text-xs flex-1 min-w-0 ${
                    selectedCategory === category ? (
                      isMobileLightMode 
                        ? 'bg-gradient-to-r from-[#87ceeb] to-[#4682b4] hover:from-[#7bb8d9] hover:to-[#3d6b9a] text-white shadow-md' 
                        : ''
                    ) : (
                      isMobileLightMode 
                        ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900' 
                        : ''
                    )
                  }`}
                >
                  <span className="truncate">{category}</span>
                </Button>
              ))}
            </div>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className={`max-w-2xl ${
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
                  {editingTemplate ? '상용구 수정' : '새 상용구 추가'}
                </DialogTitle>
              </DialogHeader>
              <div className="sr-only">
                {editingTemplate ? '기존 상용구를 수정할 수 있습니다.' : '새로운 상용구를 추가할 수 있습니다.'}
              </div>
              
              <div className="space-y-4">
                {/* 제목 입력 */}
                <div className="space-y-2">
                  <label htmlFor="title" className={`text-sm font-medium ${
                    isMobileLightMode 
                      ? 'text-gray-700' 
                      : 'text-foreground'
                  }`}>
                    제목
                  </label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="상용구 제목을 입력하세요"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={isMobileLightMode 
                      ? 'border-gray-300 focus:border-blue-500 bg-white' 
                      : ''
                    }
                  />
                </div>

                {/* 카테고리 선택 */}
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${
                    isMobileLightMode 
                      ? 'text-gray-700' 
                      : 'text-foreground'
                  }`}>
                    카테고리
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {editingTemplate ? (
                      // 수정 시에는 모든 카테고리 표시 (활성/비활성 관계없이)
                      userCategories.length > 0 ? (
                        userCategories.map((cat) => (
                          <Button
                            key={cat.name}
                            type="button"
                            variant={formData.category === cat.name ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, category: cat.name }))}
                            className={`text-xs ${
                              formData.category === cat.name ? (
                                isMobileLightMode 
                                  ? 'bg-gradient-to-r from-[#87ceeb] to-[#4682b4] hover:from-[#7bb8d9] hover:to-[#3d6b9a] text-white shadow-md' 
                                  : ''
                              ) : (
                                isMobileLightMode 
                                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900' 
                                  : ''
                              )
                            }`}
                          >
                            {cat.name}
                          </Button>
                        ))
                      ) : (
                        <div className={`px-4 py-2 text-sm ${
                          isMobileLightMode 
                            ? 'text-gray-500' 
                            : 'text-muted-foreground'
                        }`}>
                          카테고리가 없습니다
                        </div>
                      )
                    ) : (
                      // 새로 추가 시에는 활성 카테고리만 표시
                      activeCategories.length > 0 ? (
                        activeCategories.map((cat) => (
                          <Button
                            key={cat.name}
                            type="button"
                            variant={formData.category === cat.name ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, category: cat.name }))}
                            className={`text-xs ${
                              formData.category === cat.name ? (
                                isMobileLightMode 
                                  ? 'bg-gradient-to-r from-[#87ceeb] to-[#4682b4] hover:from-[#7bb8d9] hover:to-[#3d6b9a] text-white shadow-md' 
                                  : ''
                              ) : (
                                isMobileLightMode 
                                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900' 
                                  : ''
                              )
                            }`}
                          >
                            {cat.name}
                          </Button>
                        ))
                      ) : (
                        <div className={`px-4 py-2 text-sm ${
                          isMobileLightMode 
                            ? 'text-gray-500' 
                            : 'text-muted-foreground'
                        }`}>
                          활성 카테고리가 없습니다
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* 내용 입력 */}
                <div className="space-y-2">
                  <label htmlFor="content" className={`text-sm font-medium ${
                    isMobileLightMode 
                      ? 'text-gray-700' 
                      : 'text-foreground'
                  }`}>
                    내용
                  </label>
                  <Textarea
                    id="content"
                    placeholder="상용구 내용을 입력하세요"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className={`min-h-[200px] resize-y ${
                      isMobileLightMode 
                        ? 'border-gray-300 focus:border-blue-500 bg-white' 
                        : ''
                    }`}
                  />
                </div>

                {/* 액션 버튼들 */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className={`flex-1 ${
                      isMobileLightMode 
                        ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900' 
                        : ''
                    }`}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className={`flex-1 ${
                      isMobileLightMode 
                        ? 'bg-gradient-to-r from-[#87ceeb] to-[#4682b4] hover:from-[#7bb8d9] hover:to-[#3d6b9a] text-white shadow-md' 
                        : ''
                    }`}
                  >
                    {editingTemplate ? '수정' : '추가'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 상용구 목록 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className={`mb-4 ${
                isMobileLightMode 
                  ? 'text-gray-600' 
                  : 'text-muted-foreground'
              }`}>
                <BookmarkIcon className={`h-12 w-12 mx-auto mb-4 opacity-50 ${
                  isMobileLightMode 
                    ? 'text-gray-400' 
                    : 'text-muted-foreground'
                }`} />
                <p className={`text-lg font-medium ${
                  isMobileLightMode 
                    ? 'text-gray-700' 
                    : 'text-foreground'
                }`}>
                  {searchTerm || selectedCategory !== '전체' 
                    ? '검색 결과가 없습니다' 
                    : '상용구가 없습니다'
                  }
                </p>
                <p className={`text-sm ${
                  isMobileLightMode 
                    ? 'text-gray-500' 
                    : 'text-muted-foreground'
                }`}>
                  {searchTerm || selectedCategory !== '전체' 
                    ? '다른 검색어나 카테고리를 시도해보세요.' 
                    : '새 상용구를 추가해보세요!'
                  }
                </p>
                {!searchTerm && selectedCategory === '전체' && (
                  <Button 
                    onClick={handleAddTemplate} 
                    size="sm" 
                    className={`mt-4 ${
                      isMobileLightMode 
                        ? 'bg-gradient-to-r from-[#87ceeb] to-[#4682b4] hover:from-[#7bb8d9] hover:to-[#3d6b9a] text-white shadow-md' 
                        : ''
                    }`}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    첫 번째 상용구 추가하기
                  </Button>
                )}
              </div>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <Card key={template.id} className={`group ${
                isMobileLightMode 
                  ? 'bg-white border-gray-200 shadow-sm hover:shadow-md' 
                  : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className={`text-lg font-semibold line-clamp-2 ${
                        isMobileLightMode 
                          ? 'text-gray-800' 
                          : 'text-foreground'
                      }`}>
                        {template.title}
                      </CardTitle>
                      <span className={getCategoryBadgeStyle(template.category)}>
                        {getCategoryStatusText(template.category)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        className={`h-8 w-8 p-0 ${
                          isMobileLightMode 
                            ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' 
                            : ''
                        }`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template)}
                        className={`h-8 w-8 p-0 text-red-600 hover:text-red-700 ${
                          isMobileLightMode 
                            ? 'hover:bg-red-50' 
                            : ''
                        }`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className={`text-sm line-clamp-3 mb-3 ${
                    isMobileLightMode 
                      ? 'text-gray-600' 
                      : 'text-muted-foreground'
                  }`}>
                    {template.content}
                  </p>
                  <div className={`flex items-center justify-between text-xs ${
                    isMobileLightMode 
                      ? 'text-gray-500' 
                      : 'text-muted-foreground'
                  }`}>
                    <span>
                      {template.updatedAt.getTime() > template.createdAt.getTime() 
                        ? `수정: ${template.updatedAt.toLocaleDateString('ko-KR')} ${template.updatedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                        : `작성: ${template.createdAt.toLocaleDateString('ko-KR')} ${template.createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {/* 삭제 확인 다이얼로그 */}
        <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
          <AlertDialogContent className={isMobileLightMode 
            ? 'bg-white border-gray-200 shadow-lg' 
            : ''
          }>
            <AlertDialogHeader>
              <AlertDialogTitle className={isMobileLightMode 
                ? 'text-gray-800' 
                : 'text-foreground'
              }>상용구 삭제</AlertDialogTitle>
              <AlertDialogDescription className={isMobileLightMode 
                ? 'text-gray-600' 
                : 'text-muted-foreground'
              }>
                "{deletingTemplate?.title}" 상용구를 삭제하시겠습니까?
                <br />
                <span className={isMobileLightMode 
                  ? 'text-red-600' 
                  : 'text-destructive'
                }>
                  이 작업은 되돌릴 수 없습니다.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className={isMobileLightMode 
                ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900' 
                : ''
              }>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={executeDeleteTemplate}
                className={isMobileLightMode 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                }
                disabled={isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* 카테고리 관리 컴포넌트 */}
        <CategoryManager
          isOpen={isCategoryManagerOpen}
          onClose={() => setIsCategoryManagerOpen(false)}
          onCategoriesUpdate={handleCategoriesUpdate}
        />
      </div>
    </Layout>
  );
}; 