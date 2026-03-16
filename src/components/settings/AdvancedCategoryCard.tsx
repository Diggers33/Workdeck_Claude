import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AdvancedCategoryConfig } from '../../data/settings-categories';

interface AdvancedCategoryCardProps {
  category: AdvancedCategoryConfig;
  onClick: () => void;
}

export function AdvancedCategoryCard({ category, onClick }: AdvancedCategoryCardProps) {
  const Icon = category.icon;
  
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg p-4 text-left hover:shadow-md transition-all border border-[#E5E7EB] hover:border-[#0066FF] group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-[#F9FAFB] flex items-center justify-center group-hover:bg-[#F0F4FF] transition-colors flex-shrink-0">
          <Icon className="w-5 h-5 text-[#6B7280] group-hover:text-[#0066FF] transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-medium text-[#1F2937] mb-1">
            {category.name}
          </h3>
          <p className="text-[12px] text-[#6B7280] mb-2">
            {category.description}
          </p>
        </div>
      </div>
      
      <div className="bg-[#F9FAFB] rounded px-3 py-2 mb-2">
        <p className="text-[11px] text-[#6B7280]">
          <span className="font-medium text-[#1F2937]">When: </span>
          {category.trigger}
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#9CA3AF]">
          {category.defaultState}
        </span>
        <ArrowRight className="w-3 h-3 text-[#D1D5DB] group-hover:text-[#0066FF] transition-colors" />
      </div>
    </button>
  );
}
