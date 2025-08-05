import React from 'react';

// 링크를 감지하고 스타일링하는 유틸리티 함수
export const formatLinksInText = (text: string): React.ReactNode[] => {
  // URL 패턴 매칭 (http, https, www로 시작하는 링크)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // 링크인 경우
      const url = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-800 dark:text-blue-400 font-bold hover:underline"
        >
          {part}
        </a>
      );
    }
    // 일반 텍스트인 경우
    return part;
  });
}; 