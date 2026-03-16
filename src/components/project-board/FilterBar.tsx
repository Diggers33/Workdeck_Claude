import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
}

interface ActiveFilter {
  type: string;
  value: string;
  label: string;
}

interface FilterBarProps {
  activeFilters: ActiveFilter[];
  onUpdateFilters: (filters: ActiveFilter[]) => void;
  availableAssignees: FilterOption[];
  availableWorkPackages: FilterOption[];
  availableTags: FilterOption[];
}

export function FilterBar({ 
  activeFilters, 
  onUpdateFilters,
  availableAssignees,
  availableWorkPackages,
  availableTags
}: FilterBarProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const addFilter = (type: string, value: string, label: string) => {
    const newFilters = [...activeFilters, { type, value, label }];
    onUpdateFilters(newFilters);
    setOpenFilter(null);
  };

  const removeFilter = (index: number) => {
    const newFilters = activeFilters.filter((_, i) => i !== index);
    onUpdateFilters(newFilters);
  };

  const clearAll = () => {
    onUpdateFilters([]);
  };

  const FilterDropdown = ({ 
    type, 
    label, 
    options 
  }: { 
    type: string; 
    label: string; 
    options: FilterOption[];
  }) => {
    const isOpen = openFilter === type;

    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpenFilter(isOpen ? null : type)}
          style={{
            height: '32px',
            padding: '0 12px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#6B7280',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {label}
          <ChevronDown size={14} />
        </button>

        {isOpen && (
          <>
            <div
              onClick={() => setOpenFilter(null)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000
              }}
            />
            <div style={{
              position: 'absolute',
              top: '36px',
              left: 0,
              minWidth: '200px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              zIndex: 1001,
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {options.map(option => (
                <div
                  key={option.id}
                  onClick={() => addFilter(type, option.id, option.label)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#1F2937'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{
      padding: '12px 20px',
      borderBottom: '1px solid #E5E7EB',
      background: '#FAFAFA'
    }}>
      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: activeFilters.length > 0 ? '12px' : '0' }}>
        <FilterDropdown 
          type="assignee" 
          label="Assignee" 
          options={availableAssignees}
        />
        <FilterDropdown 
          type="workPackage" 
          label="Work Package" 
          options={availableWorkPackages}
        />
        <FilterDropdown 
          type="tag" 
          label="Tag" 
          options={availableTags}
        />
        <FilterDropdown 
          type="priority" 
          label="Priority" 
          options={[
            { id: 'high', label: 'High' },
            { id: 'medium', label: 'Medium' },
            { id: 'low', label: 'Low' }
          ]}
        />
        <FilterDropdown 
          type="due" 
          label="Due Date" 
          options={[
            { id: 'overdue', label: 'Overdue' },
            { id: 'today', label: 'Due Today' },
            { id: 'week', label: 'Due This Week' },
            { id: 'month', label: 'Due This Month' }
          ]}
        />
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
            Active filters:
          </span>
          {activeFilters.map((filter, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#1E40AF'
              }}
            >
              <span>{filter.type}: {filter.label}</span>
              <button
                onClick={() => removeFilter(index)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#1E40AF'
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={clearAll}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#6B7280',
              fontWeight: 500,
              textDecoration: 'underline'
            }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
