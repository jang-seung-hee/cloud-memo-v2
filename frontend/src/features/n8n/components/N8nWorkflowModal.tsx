import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { IN8nWorkflow, N8nWorkflowCreateData } from '../../../types/n8n';
import { KeyIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface N8nWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: N8nWorkflowCreateData) => Promise<void>;
  editingWorkflow?: IN8nWorkflow | null;
}

/**
 * n8n 워크플로우 등록 및 수정을 위한 모달 컴포넌트
 */
export const N8nWorkflowModal: React.FC<N8nWorkflowModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingWorkflow,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (editingWorkflow) {
      setName(editingWorkflow.name);
      setUrl(editingWorkflow.url);
      setToken(editingWorkflow.token || '');
    } else {
      setName('');
      setUrl('');
      setToken('');
    }
  }, [editingWorkflow, isOpen]);

  // 랜덤 토큰 생성 함수
  const generateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setToken(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        url: url.trim(),
        token: token.trim(),
      });
      onClose();
    } catch (error) {
      console.error('워크플로우 저장 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editingWorkflow ? '워크플로우 수정' : '새 워크플로우 등록'}</DialogTitle>
            <DialogDescription>
              n8n 워크플로우의 이름과 Webhook URL을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">워크플로우 이름</Label>
              <Input
                id="name"
                placeholder="예: 카톡 상담 분석"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="url">Webhook URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://n8n.your-domain.com/webhook/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="token" className="flex items-center gap-1">
                  <KeyIcon className="h-3 w-3" />
                  인증 토큰 (선택사항)
                </Label>
                <button
                  type="button"
                  onClick={generateRandomToken}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ArrowPathIcon className="h-3 w-3" />
                  랜덤 생성
                </button>
              </div>
              <Input
                id="token"
                placeholder="보안을 위한 비밀 토큰 입력"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                * n8n 측에서도 동일한 토큰을 체크하도록 설정해야 보안이 강화됩니다.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : (editingWorkflow ? '수정 완료' : '등록하기')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
