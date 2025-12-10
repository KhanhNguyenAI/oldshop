import React from 'react';
import type { FreeItemStatus } from '../../types/freeItem';
import { STATUS_LABELS } from '../../types/freeItem';

interface FreeItemStatusBadgeProps {
  status: FreeItemStatus;
  className?: string;
}

export const FreeItemStatusBadge: React.FC<FreeItemStatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  const colorClasses = {
    available: 'bg-green-100 text-green-800 border-green-300',
    reserved: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    completed: 'bg-gray-100 text-gray-800 border-gray-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClasses[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
};

