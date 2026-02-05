import React, { useState, useMemo } from 'react';
import { useTemplates } from '../hooks/useFirestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { XMarkIcon, DocumentDuplicateIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useToast } from '../hooks/use-toast';

export const SnippetsPage: React.FC = () => {
    const { data: templates, loading } = useTemplates();
    const { toast } = useToast();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Extract unique categories
    const categories = useMemo(() => {
        const uniqueCategories = new Set(templates.map(t => t.category || '기타'));
        return ['all', ...Array.from(uniqueCategories)];
    }, [templates]);

    // Filter templates
    const filteredTemplates = useMemo(() => {
        return templates.filter(template => {
            const matchesCategory = selectedCategory === 'all' || (template.category || '기타') === selectedCategory;
            const matchesSearch = (template.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (template.content || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [templates, selectedCategory, searchQuery]);

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content).then(() => {
            toast({
                title: "복사되었습니다",
                description: "클립보드에 저장되었습니다.",
                duration: 2000,
            });
        }).catch(() => {
            toast({
                title: "복사 실패",
                description: "클립보드 접근 권한을 확인해주세요.",
                variant: "destructive",
            });
        });
    };

    const handleClose = () => {
        window.close();
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center">
            <div className="w-full max-w-[800px] flex flex-col h-screen">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                    <h1 className="text-lg font-bold">상용구</h1>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-shrink-0">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {category === 'all' ? '전체' : category}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative flex-shrink-0">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="상용구 검색..."
                            className="pl-9 bg-white border-gray-200"
                        />
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {loading ? (
                            <div className="text-center py-10 text-gray-500">로딩 중...</div>
                        ) : filteredTemplates.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">검색 결과가 없습니다.</div>
                        ) : (
                            filteredTemplates.map(template => (
                                <div key={template.id} className="bg-white border boundary-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-base truncate flex-1">{template.title}</h3>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-normal">
                                                {template.category || '기타'}
                                            </Badge>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopy(template.content);
                                                }}
                                                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                                                title="클립보드 복사"
                                            >
                                                <DocumentDuplicateIcon className="h-3 w-3" />
                                                복사
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-sm line-clamp-3 mb-3 whitespace-pre-wrap leading-relaxed">
                                        {template.content}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <Button
                                            onClick={() => handleCopy(template.content)}
                                            size="sm"
                                            className="bg-green-100 text-green-700 hover:bg-green-200 border-none shadow-none gap-1.5 h-8 px-3"
                                        >
                                            <DocumentDuplicateIcon className="w-4 h-4" />
                                            {/* Icon only on mobile maybe? kept text for clarity */}
                                        </Button>
                                        <button className="text-xs text-blue-600 font-medium hover:underline px-2 py-1">
                                            더보기
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
