import React from 'react';
import type { FreeItemCondition } from '../../types/freeItem';
import { CONDITION_LABELS } from '../../types/freeItem';

interface FreeItemConditionBadgeProps {
  condition: FreeItemCondition;
  className?: string;
}

export const FreeItemConditionBadge: React.FC<FreeItemConditionBadgeProps> = ({ 
  condition, 
  className = '' 
}) => {
  const colorClasses = {
    new_unused: 'bg-green-100 text-green-800 border-green-300',
    like_new: 'bg-blue-100 text-blue-800 border-blue-300',
    no_damage: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    minor_damage: 'bg-orange-100 text-orange-800 border-orange-300',
    has_damage: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClasses[condition]} ${className}`}
    >
      {CONDITION_LABELS[condition]}
    </span>
  );
};

