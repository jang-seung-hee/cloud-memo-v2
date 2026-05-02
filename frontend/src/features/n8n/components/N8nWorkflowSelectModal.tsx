import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { useN8nWorkflows } from '../hooks/useN8nWorkflows';
import { useNavigate } from 'react-router-dom';
import { BoltIcon, ShieldCheckIcon, LinkIcon } from '@heroicons/react/24/outline';

interface N8nWorkflowSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobileLightMode: boolean;
}

export const N8nWorkflowSelectModal: React.FC<N8nWorkflowSelectModalProps> = ({ 
  isOpen, 
  onClose,
  isMobileLightMode
}) => {
  const { workflows, isLoading } = useN8nWorkflows();
  const navigate = useNavigate();

  const handleSelectWorkflow = (workflowId: string) => {
    onClose();
    navigate(`/create-n8n/${workflowId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`w-[calc(100vw-2rem)] sm:max-w-md rounded-xl ${isMobileLightMode ? 'bg-white border-gray-200 shadow-xl' : 'shadow-2xl'}`}>
        <DialogHeader className="pr-6">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <BoltIcon className="h-5 w-5 text-purple-500 shrink-0" />
            <span className="truncate">n8n 자동화 작성</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base leading-snug">
            메모를 전송할 워크플로우를 선택해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 sm:py-4">
          {isLoading ? (
            <div className="text-center py-10 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">워크플로우를 불러오는 중...</p>
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-xl text-muted-foreground flex flex-col items-center gap-3 px-4">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full">
                <BoltIcon className="h-6 w-6 opacity-20" />
              </div>
              <p className="text-sm">등록된 워크플로우가 없습니다.</p>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => {
                onClose();
                navigate('/settings');
              }}>설정에서 등록하기</Button>
            </div>
          ) : (
            <div className="grid gap-2.5 max-h-[60vh] sm:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {workflows.map((workflow) => (
                <button
                  key={workflow.id}
                  onClick={() => handleSelectWorkflow(workflow.id)}
                  className={`w-full text-left flex items-start flex-col gap-1.5 p-3.5 border rounded-xl transition-all active:scale-[0.98] sm:hover:scale-[1.01] ${
                    isMobileLightMode 
                      ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-purple-300' 
                      : 'bg-card border-border hover:bg-accent hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <span className="font-bold text-sm sm:text-base truncate flex-1 leading-tight">{workflow.name}</span>
                    {workflow.token && (
                      <ShieldCheckIcon className="h-4 w-4 text-green-500 shrink-0" title="보안 토큰 적용됨" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground w-full min-w-0">
                    <LinkIcon className="h-3 w-3 shrink-0 opacity-60" />
                    <span className="truncate opacity-70 flex-1">{workflow.url}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
