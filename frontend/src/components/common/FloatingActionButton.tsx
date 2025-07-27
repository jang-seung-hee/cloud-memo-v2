import React from 'react';
import { Button } from '../ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface FloatingActionButtonProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon = <PlusIcon className="h-6 w-6" />,
  label = '새 메모'
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/create');
    }
  };

  return (
    <Button
      onClick={handleClick}
      className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 md:bottom-6 md:right-6"
      size="lg"
    >
      <span className="sr-only">{label}</span>
      {icon}
    </Button>
  );
}; 