import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { CategoryBadge } from '../ui/category-badge';
import { IFirebaseMemo } from '../../types/firebase';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '../../hooks/useDevice';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { useFontSize } from '../../hooks/useFontSize';
import { firestoreService } from '../../services/firebase/firestore';
import { storageService } from '../../services/firebase/storage';
import {
  PhotoIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import { useMemoCard } from '../../hooks/useMemoCard';

interface MemoCardProps {
  memo: IFirebaseMemo;
  onMemoUpdate?: () => void;
}

const MemoCardComponent: React.FC<MemoCardProps> = ({ memo, onMemoUpdate }) => {
  const navigate = useNavigate();
  const { isDesktop, getTemplateSidebarWidth } = useDevice();
  const { toast } = useToast();
  const { fontSizeClasses } = useFontSize();
  const { user } = useAuth();
  const {
    isDeleting,
    isExpanded,
    isSentShare,
    isReceivedShare,
    canDelete,
    canEdit,
    formattedDate,
    truncatedContent,
    getTitleForPC,
    getMobileContent,
    handleClick,
    handleExpandToggle,
    handleCopy,
    handleEdit,
    handleDelete,
    handleStopProcessing
  } = useMemoCard({ memo, onMemoUpdate });

  return (
    <Card
      className={`group cursor-pointer hover:shadow-lg transition-all duration-300 bg-white dark:bg-card border border-border/40 hover:border-border/60 rounded-lg overflow-hidden relative ${isDesktop ? 'h-[364px]' : 'min-h-[220px]'}`}
      onClick={handleClick}
    >
      {/* n8n 처리 중 오버레이 */}
      {memo.isProcessing && (
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 z-20 flex flex-col items-center justify-center backdrop-blur-[2px] transition-all duration-500" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl flex flex-col items-center border border-purple-100 dark:border-purple-900/50">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400 mb-3" />
            <span className="text-sm font-bold text-purple-700 dark:text-purple-300 animate-pulse">n8n 처리 중...</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 mb-3">완료되면 자동으로 업데이트됩니다</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-3 text-[11px] border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleStopProcessing}
            >
              중지
            </Button>
          </div>
        </div>
      )}
      <CardHeader className={`pb-3 pt-4 bg-white dark:bg-card relative ${isDesktop ? 'pb-2 px-4' : 'px-2'}`}>
        {isDesktop ? (
          <>
            {/* PC 모드: 제목 표시 */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors ${fontSizeClasses.title}`}>
                  {getTitleForPC}
                </h3>
              </div>
            </div>

            {/* PC 모드: 상단 바 (카테고리, 공유, 날짜, 액션) */}
            <div className="flex items-center justify-between mt-2 bg-muted/30 dark:bg-muted/20 rounded px-1.5 py-1">
              {/* 왼쪽: 카테고리 뱃지 및 공유 상태 */}
              <div className="flex items-center gap-1.5">
                <CategoryBadge category={memo.category || 'temporary'} size="sm" />
                {!memo.isProcessing && memo.n8nStatus && (
                  <span className={`text-[11px] font-bold px-1 ${memo.n8nStatus === 'success' ? 'text-green-600 dark:text-green-400' : memo.n8nStatus === 'error' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {memo.n8nStatus === 'success' ? '성공' : memo.n8nStatus === 'error' ? '실패' : '시간초과'}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  {isSentShare && (
                    <Badge variant="outline" className="h-5 px-1.5 bg-blue-50 text-blue-600 border-blue-200 gap-0.5 flex items-center whitespace-nowrap">
                      <UsersIcon className="h-3 w-3" />
                      <span className="text-[10px] font-bold">공유</span>
                    </Badge>
                  )}
                  {isReceivedShare && (
                    <Badge variant="outline" className="h-5 px-1.5 bg-green-50 text-green-600 border-green-200 gap-0.5 flex items-center whitespace-nowrap">
                      <ShareIcon className="h-3 w-3" />
                      <span className="text-[10px] font-bold">받음</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* 오른쪽: 날짜 + 액션 버튼들 */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center text-muted-foreground mr-0.5">
                  <span className={`text-[11px] whitespace-nowrap ${fontSizeClasses.date}`}>
                    {formattedDate}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 border-l border-border/30 pl-1.5 ml-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={handleCopy}
                    title="복사"
                  >
                    <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={handleEdit}
                      title="수정"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title="삭제"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>메모 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 메모를 삭제하시겠습니까?
                            {memo.images && memo.images.length > 0 && (
                              <span className="block mt-2 text-destructive">
                                첨부된 이미지 {memo.images.length}개도 함께 삭제됩니다.
                              </span>
                            )}
                            이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                          >
                            {isDeleting ? '삭제 중...' : '삭제'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          // 모바일 모드: 카테고리 뱃지와 액션 버튼을 같은 줄에 배치
          <div className="flex items-center justify-between mb-2 bg-muted/30 dark:bg-muted/20 rounded px-1 py-1">
            {/* 왼쪽: 카테고리 뱃지와 공유 상태 */}
            <div className="flex items-center gap-1">
              <CategoryBadge category={memo.category || 'temporary'} size="xs" />
              {!memo.isProcessing && memo.n8nStatus && (
                <span className={`text-[10px] font-bold px-1 ${memo.n8nStatus === 'success' ? 'text-green-600 dark:text-green-400' : memo.n8nStatus === 'error' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {memo.n8nStatus === 'success' ? '성공' : memo.n8nStatus === 'error' ? '실패' : '시간초과'}
                </span>
              )}
              <div className="flex items-center gap-0.5">
                {isSentShare && (
                  <Badge variant="outline" className="h-4.5 px-1 bg-blue-50 text-blue-600 border-blue-200 gap-0.5 flex items-center whitespace-nowrap">
                    <UsersIcon className="h-2 w-2" />
                    <span className="text-[9px] font-bold">공유</span>
                  </Badge>
                )}
                {isReceivedShare && (
                  <Badge variant="outline" className="h-4.5 px-1 bg-green-50 text-green-600 border-green-200 gap-0.5 flex items-center whitespace-nowrap">
                    <ShareIcon className="h-2 w-2" />
                    <span className="text-[9px] font-bold">받음</span>
                  </Badge>
                )}
              </div>
            </div>

            {/* 오른쪽: 날짜 + 액션 버튼들 */}
            <div className="flex items-center gap-1">
              <div className="flex items-center text-muted-foreground">
                <span className={`text-[10px] leading-none whitespace-nowrap ${fontSizeClasses.date}`}>
                  {formattedDate}
                </span>
              </div>

              <div className="flex items-center gap-0.5 border-l border-border/30 pl-1 ml-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleCopy}
                  title="복사"
                >
                  <DocumentDuplicateIcon className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleEdit}
                  title="수정"
                >
                  <PencilIcon className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      title="삭제"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>메모 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        이 메모를 삭제하시겠습니까?
                        {memo.images && memo.images.length > 0 && (
                          <span className="block mt-2 text-destructive">
                            첨부된 이미지 {memo.images.length}개도 함께 삭제됩니다.
                          </span>
                        )}
                        이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                      >
                        {isDeleting ? '삭제 중...' : '삭제'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className={`pb-4 pt-0 bg-white dark:bg-card relative ${isDesktop ? 'px-4 flex flex-col h-full' : 'px-2 flex flex-col h-full'}`}>

        {/* 내용 미리보기 - 이미지 유무에 따라 다른 레이아웃 */}
        {isDesktop ? (
          // PC 모드: 이미지 유무에 따라 최적화된 레이아웃
          <>
            {memo.images.length === 0 ? (
              // 이미지가 없을 때: 더 큰 고정 높이로 텍스트 영역 설정
              <div className="bg-muted/80 dark:bg-muted/70 rounded-lg p-3 mb-4 relative h-[280px] flex flex-col">
                {memo.n8nError && (
                  <div className="mb-2 p-1.5 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[10px] font-bold">
                    처리 실패: {memo.n8nError}
                  </div>
                )}
                <p className={`text-muted-foreground line-clamp-7 leading-tight whitespace-pre-wrap flex-1 ${fontSizeClasses.content}`}>
                  {truncatedContent}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-[40px] bg-white dark:bg-card rounded-b-lg"></div>
              </div>
            ) : (
              // 이미지가 있을 때: 절대 위치로 이미지를 하단에 고정
              <div className="relative h-full">
                {/* 텍스트 영역 - 고정 높이로 설정 */}
                <div className="h-[220px] pb-22">
                  <div className="bg-muted/80 dark:bg-muted/70 rounded-lg p-3 h-full flex flex-col">
                    {memo.n8nError && (
                      <div className="mb-2 p-1.5 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[10px] font-bold">
                        처리 실패: {memo.n8nError}
                      </div>
                    )}
                    <p className={`text-muted-foreground line-clamp-7 leading-normal whitespace-pre-wrap flex-1 ${fontSizeClasses.content}`}>
                      {truncatedContent}
                    </p>
                  </div>
                </div>

                {/* 이미지 표시 - 절대 위치로 하단에 고정 */}
                <div className="absolute bottom-10 left-0 right-0 bg-white dark:bg-card rounded-lg border border-border/30 p-2 shadow-sm">
                  <div className="flex gap-2 overflow-hidden justify-start">
                    {memo.images.slice(0, 3).map((imageUrl, index) => (
                      <div key={index} className="flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={`이미지 ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-md border border-border/30"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                    {memo.images.length > 3 && (
                      <div className="flex-shrink-0 w-16 h-16 bg-muted/50 rounded-md border border-border/30 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground font-medium">
                          +{memo.images.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* 작성일자 표시 (PC 모드만) */}
                  {isDesktop && (
                    <div className="absolute right-4 -bottom-8 flex items-center gap-2 text-muted-foreground">
                      <ClockIcon className="h-3 w-3" />
                      <span className={fontSizeClasses.date}>{formattedDate}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          // 모바일 모드: flexbox 레이아웃으로 변경
          <>
            {/* 텍스트 영역 - flex-1로 남은 공간 차지 */}
            <div className="flex-1">
              {memo.n8nError && (
                <div className="mb-2 p-1.5 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[10px] font-bold">
                  처리 실패: {memo.n8nError}
                </div>
              )}
              <p className={`text-muted-foreground mb-2 leading-normal ${isExpanded ? 'whitespace-pre-wrap' : 'whitespace-normal'} ${fontSizeClasses.content} ${isExpanded ? '' : 'line-clamp-6'}`}>
                {getMobileContent}
              </p>
              {(memo.content.length > 150 || (memo.content.includes('\n') && !isDesktop)) && (
                <div className="flex justify-end">
                  <button
                    onClick={handleExpandToggle}
                    className="text-primary hover:text-primary/80 text-base font-semibold transition-colors"
                  >
                    {isExpanded ? '접기' : '더보기'}
                  </button>
                </div>
              )}
            </div>

            {/* 이미지 표시 - 하단에 배치 */}
            {memo.images.length > 0 && (
              <div className="mb-2 bg-muted/30 dark:bg-muted/20 rounded-lg border border-border/30 p-1.5">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <PhotoIcon className="h-3.5 w-3.5 text-primary" />
                  <span className={`font-medium ${fontSizeClasses.text}`}>{memo.images.length}개 이미지</span>
                </div>
                <div className="flex gap-2 overflow-hidden">
                  {memo.images.slice(0, 3).map((imageUrl, index) => (
                    <div key={index} className="flex-shrink-0">
                      <img
                        src={imageUrl}
                        alt={`이미지 ${index + 1}`}
                        className="w-12 h-12 object-cover rounded-md border border-border/30"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                  {memo.images.length > 3 && (
                    <div className="flex-shrink-0 w-12 h-12 bg-muted/50 rounded-md border border-border/30 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground font-medium">
                        +{memo.images.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* 하단 정보 */}
        <div className={`flex items-center justify-between pt-2 border-t border-border/30 ${isDesktop ? 'mt-auto' : 'mt-auto'}`}>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`bg-background/50 dark:bg-background/30 ${fontSizeClasses.text}`}>
              {memo.content.length}자
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// React.memo로 컴포넌트 최적화
export const MemoCard = React.memo(MemoCardComponent); 