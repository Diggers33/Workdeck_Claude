import React from 'react';
import { BarChart3 } from 'lucide-react';

export function TaskOverviewWidget() {
  const categories: any[] = [];

  const total = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div 
      className="bg-white rounded-lg relative overflow-hidden" 
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.06)', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Colored top accent */}
      <div className="absolute left-0 right-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, #6366F1 0%, #818CF8 100%)' }}></div>
      
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#E5E7EB]" style={{ minHeight: '36px' }}>
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-[#6366F1]" />
          <h3 className="text-[14px] font-medium text-[#1F2937]">Task Overview</h3>
        </div>
      </div>

      {/* 2x2 Grid */}
      <div className="p-2.5" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {categories.map((category, idx) => (
          <div 
            key={idx}
            className="bg-[#FAFAFA] rounded-lg p-2.5 border border-[#F3F4F6] cursor-pointer hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }}></div>
              <span className="text-[10px] text-[#6B7280] font-medium">{category.label}</span>
            </div>
            <div className="text-[28px] font-bold text-[#1F2937] mb-2 leading-none">{category.count}</div>
            <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${(category.count / total) * 100}%`,
                  backgroundColor: category.color
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-[#E5E7EB] flex items-center justify-between" style={{ minHeight: '30px' }}>
        <button className="text-[10px] text-[#3B82F6] hover:text-[#2563EB]">
          All tasks →
        </button>
        <span className="text-[10px] text-[#9CA3AF] font-medium">Total: {total}</span>
      </div>
    </div>
  );
}