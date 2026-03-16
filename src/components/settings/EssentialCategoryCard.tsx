import React from 'react';
import { CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import { CategoryConfig } from '../../data/settings-categories';

interface EssentialCategoryCardProps {
  category: CategoryConfig;
  isNextAction: boolean;
  onClick: () => void;
}

export function EssentialCategoryCard({ category, isNextAction, onClick }: EssentialCategoryCardProps) {
  const Icon = category.icon;
  
  const borderClass = category.completed
    ? 'border-[#34D399] hover:border-[#10B981]'
    : isNextAction
    ? 'border-[#0066FF] hover:border-[#0052CC] shadow-md'
    : 'border-[#E5E7EB] hover:border-[#D1D5DB]';

  const iconBgClass = category.completed
    ? 'bg-[#D1FAE5]'
    : isNextAction
    ? 'bg-[#0066FF] group-hover:scale-110 transition-transform'
    : 'bg-[#F0F4FF]';

  const iconColorClass = category.completed
    ? 'text-[#34D399]'
    : isNextAction
    ? 'text-white'
    : 'text-[#0066FF]';

  const actionColorClass = category.completed
    ? 'text-[#6B7280]'
    : 'text-[#0066FF]';

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-lg p-6 text-left hover:shadow-lg transition-all border-2 group relative ${borderClass}`}
    >
      {/* Priority Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {category.completed ? (
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#34D399] bg-[#D1FAE5] px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Done
          </div>
        ) : isNextAction ? (
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#0066FF] bg-[#F0F4FF] px-2 py-1 rounded-full animate-pulse">
            <ArrowRight className="w-3 h-3" />
            Do this next
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-[#E5E7EB] bg-white flex items-center justify-center">
            <span className="text-[11px] font-medium text-[#9CA3AF]">{category.priority}</span>
          </div>
        )}
      </div>

      {/* Icon */}
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${iconBgClass}`}>
        <Icon className={`w-6 h-6 ${iconColorClass}`} />
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="text-[16px] font-medium text-[#1F2937] mb-1">
          {category.name}
        </h3>
        <p className="text-[13px] text-[#6B7280] mb-2">
          {category.description}
        </p>
        
        <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
          <p className={`text-[13px] font-medium text-[#1F2937] mb-1 ${category.completed ? '' : ''}`}>
            {category.summary}
          </p>
          <p className="text-[12px] text-[#6B7280]">
            {category.details}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[12px] text-[#9CA3AF]">
          <Clock className="w-3 h-3" />
          {category.timeEstimate}
        </div>
        <div className={`flex items-center gap-1 text-[13px] font-medium ${actionColorClass} ${isNextAction ? 'group-hover:gap-2' : ''} transition-all`}>
          {category.action}
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
}
