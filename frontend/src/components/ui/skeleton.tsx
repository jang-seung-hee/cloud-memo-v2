import * as React from "react"
import { cn } from "../../lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// 메모 카드 스켈레톤
export const MemoCardSkeleton = () => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <Skeleton className="h-5 w-12 rounded-full ml-2" />
      </div>
      
      <div className="space-y-2 mb-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  </div>
);

// 템플릿 카드 스켈레톤
export const TemplateCardSkeleton = () => (
  <div className="p-4 border rounded-lg space-y-3">
    <div className="flex justify-between items-start">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-12 rounded" />
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
    <Skeleton className="h-3 w-3/4" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-3 w-16" />
      <div className="flex gap-1">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
    </div>
  </div>
);

// 메모 목록 스켈레톤
export const MemoListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <MemoCardSkeleton key={index} />
    ))}
  </div>
);

// 템플릿 목록 스켈레톤
export const TemplateListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <TemplateCardSkeleton key={index} />
    ))}
  </div>
);

// 이미지 업로드 스켈레톤
export const ImageUploadSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full rounded-lg" />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  </div>
);

// 폼 스켈레톤
export const FormSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-32 w-full" />
    </div>
    <div className="flex gap-3">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 flex-1" />
    </div>
  </div>
);

// 헤더 스켈레톤
export const HeaderSkeleton = () => (
  <div className="flex items-center justify-between p-4 border-b">
    <Skeleton className="h-6 w-32" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

// 페이지 스켈레톤
export const PageSkeleton = () => (
  <div className="space-y-6">
    <HeaderSkeleton />
    <div className="p-4">
      <FormSkeleton />
    </div>
  </div>
);

export { Skeleton }
