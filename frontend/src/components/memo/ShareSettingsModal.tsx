import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { MagnifyingGlassIcon, UserPlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { firestoreService } from '../../services/firebase/firestore';
import { ISharedUser, IUserProfile } from '../../types/firebase';
import { useToast } from '../../hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ShareSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sharedWith: ISharedUser[];
    onUpdateSharedWith: (sharedWith: ISharedUser[]) => void;
    memoId?: string;
    memoTitle?: string;
    currentUser?: IUserProfile | null;
}

export const ShareSettingsModal: React.FC<ShareSettingsModalProps> = ({
    isOpen,
    onClose,
    sharedWith,
    onUpdateSharedWith,
    memoId,
    memoTitle,
    currentUser
}) => {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<IUserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [localSharedWith, setLocalSharedWith] = useState<ISharedUser[]>(sharedWith);

    useEffect(() => {
        setLocalSharedWith(sharedWith);
    }, [sharedWith, isOpen]);

    const handleSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await firestoreService.searchUsers(query);
            setSearchResults(results);
        } catch (error) {
            console.error('검색 오류:', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // 자동완성/추천 검색을 위한 디바운싱 처리
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                handleSearch(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 300); // 300ms 대기 후 검색 실행

        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const handleAddUser = (user: IUserProfile) => {
        if (localSharedWith.some(u => u.uid === user.id)) {
            toast({
                title: "이미 추가된 사용자",
                description: "이미 공유 목록에 있는 사용자입니다."
            });
            return;
        }

        const newUser: ISharedUser = {
            uid: user.id,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            permissions: {
                edit: true,
                delete: false
            }
        };

        setLocalSharedWith(prev => [...prev, newUser]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleRemoveUser = (uid: string) => {
        setLocalSharedWith(prev => prev.filter(u => u.uid !== uid));
    };

    const handlePermissionChange = (uid: string, permission: 'edit' | 'delete', value: boolean) => {
        setLocalSharedWith(prev => prev.map(u =>
            u.uid === uid
                ? { ...u, permissions: { ...u.permissions, [permission]: value } }
                : u
        ));
    };

    const handleSave = async () => {
        // 새로 추가된 사용자 찾기
        const newlyAddedUsers = localSharedWith.filter(
            newUser => !sharedWith.some(oldUser => oldUser.uid === newUser.uid)
        );

        onUpdateSharedWith(localSharedWith);
        onClose();

        // 새 사용자에게 알림 전송
        if (memoId && currentUser && newlyAddedUsers.length > 0) {
            try {
                await Promise.all(newlyAddedUsers.map(targetUser =>
                    firestoreService.createNotification({
                        type: 'share',
                        title: '새로운 메모 공유',
                        body: `${currentUser.displayName}님이 '${memoTitle || '제목 없음'}' 메모를 공유했습니다.`,
                        senderId: currentUser.userId,
                        senderName: currentUser.displayName,
                        receiverId: targetUser.uid,
                        memoId: memoId
                    })
                ));
            } catch (error) {
                console.error('알림 전송 중 오류 발생:', error);
            }
        }

        toast({
            title: "공유 설정 변경됨",
            description: "메모를 저장할 때 공유 설정이 반영됩니다."
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>공유 설정</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* 사용자 검색 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">사용자 초대</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="이메일 또는 이름으로 검색..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 검색 결과 */}
                    {searchResults.length > 0 && (
                        <div className="border rounded-md overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                            <ScrollArea className="h-[150px]">
                                <div className="p-2 space-y-1">
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-2 hover:bg-white dark:hover:bg-gray-800 rounded cursor-pointer transition-colors"
                                            onClick={() => handleAddUser(user)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.photoURL} />
                                                    <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{user.displayName}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <UserPlusIcon className="h-5 w-5 text-blue-500" />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* 공유된 사용자 목록 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            공유 대상 ({localSharedWith.length}명)
                        </label>
                        <ScrollArea className="h-[200px] border rounded-md p-2">
                            {localSharedWith.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                                    <UserPlusIcon className="h-10 w-10 mb-2 opacity-20" />
                                    <p className="text-sm">공유된 사용자가 없습니다.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {localSharedWith.map(user => (
                                        <div key={user.uid} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border shadow-sm">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                    <AvatarImage src={user.photoURL} />
                                                    <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Checkbox
                                                            id={`edit-${user.uid}`}
                                                            checked={user.permissions.edit}
                                                            onCheckedChange={(checked) => handlePermissionChange(user.uid, 'edit', !!checked)}
                                                        />
                                                        <label htmlFor={`edit-${user.uid}`} className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">수정</label>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Checkbox
                                                            id={`delete-${user.uid}`}
                                                            checked={user.permissions.delete}
                                                            onCheckedChange={(checked) => handlePermissionChange(user.uid, 'delete', !!checked)}
                                                        />
                                                        <label htmlFor={`delete-${user.uid}`} className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">삭제</label>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveUser(user.uid)}
                                                    className="h-8 w-8 p-0 text-gray-400 hover:text-destructive"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>취소</Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                        적용
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
