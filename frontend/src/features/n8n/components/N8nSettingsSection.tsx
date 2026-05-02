import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { useN8nWorkflows } from '../hooks/useN8nWorkflows';
import { N8nWorkflowModal } from './N8nWorkflowModal';
import { IN8nWorkflow, N8nWorkflowCreateData } from '../../../types/n8n';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  LinkIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';

interface N8nSettingsSectionProps {
  isMobileLightMode: boolean;
  isDesktop: boolean;
}

/**
 * 환경설정 페이지에 표시될 n8n 연동 설정 섹션
 */
export const N8nSettingsSection: React.FC<N8nSettingsSectionProps> = ({ isMobileLightMode, isDesktop }) => {
  const { workflows, isLoading, addWorkflow, updateWorkflow, deleteWorkflow } = useN8nWorkflows();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<IN8nWorkflow | null>(null);

  const handleOpenAddModal = () => {
    setEditingWorkflow(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (workflow: IN8nWorkflow) => {
    setEditingWorkflow(workflow);
    setIsModalOpen(true);
  };

  const handleSave = async (data: N8nWorkflowCreateData) => {
    if (editingWorkflow) {
      await updateWorkflow(editingWorkflow.id, data);
    } else {
      await addWorkflow(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('정말로 이 워크플로우를 삭제하시겠습니까?')) {
      await deleteWorkflow(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${
          isMobileLightMode ? 'text-gray-800' : 'text-foreground'
        }`}>n8n 연동 설정</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleOpenAddModal}
          className="flex items-center gap-1"
        >
          <PlusIcon className="h-4 w-4" />
          추가
        </Button>
      </div>

      <div className={`p-4 sm:p-6 border rounded-lg overflow-hidden ${
        isMobileLightMode 
          ? 'bg-white border-gray-200 shadow-sm' 
          : 'bg-card border-border'
      }`}>
        <div className="space-y-6">
          <div>
            <p className={`font-medium mb-2 ${
              isMobileLightMode ? 'text-gray-700' : 'text-foreground'
            }`}>워크플로우 관리</p>
            <p className={`text-sm mb-4 ${
              isMobileLightMode ? 'text-gray-600' : 'text-muted-foreground'
            }`}>
              메모를 분석하고 자산화하기 위한 n8n 워크플로우를 등록합니다.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              설정을 불러오는 중...
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
              등록된 워크플로우가 없습니다.
            </div>
          ) : (
            <div className="grid gap-3">
              {workflows.map((workflow) => (
                <div 
                  key={workflow.id} 
                  className={`flex items-center justify-between p-3 sm:p-4 border rounded-md transition-colors w-full overflow-hidden ${
                    isMobileLightMode 
                      ? 'bg-gray-50 border-gray-100 hover:bg-gray-100' 
                      : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium truncate ${
                        isMobileLightMode ? 'text-gray-800' : 'text-foreground'
                      }`} title={workflow.name}>
                        {isDesktop ? workflow.name : (workflow.name.length > 15 ? `${workflow.name.slice(0, 15)}..` : workflow.name)}
                      </span>
                      {workflow.token && (
                        <ShieldCheckIcon className="h-4 w-4 text-green-500 shrink-0" title="보안 토큰 사용 중" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground overflow-hidden w-full">
                      <LinkIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate opacity-70 min-w-0">
                        {isDesktop ? workflow.url : (workflow.url.length > 20 ? `${workflow.url.slice(0, 20)}...` : workflow.url)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-0 sm:gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleOpenEditModal(workflow)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(workflow.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <N8nWorkflowModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingWorkflow={editingWorkflow}
      />
    </div>
  );
};
