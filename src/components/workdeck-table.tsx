import React from 'react';
import { ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';
import { Checkbox } from './ui/checkbox';

export interface WorkdeckTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export interface WorkdeckTableProps<T> {
  columns: WorkdeckTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectRow?: (key: string) => void;
  onSelectAll?: (selected: boolean) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  className?: string;
}

export function WorkdeckTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectable = false,
  selectedRows = new Set(),
  onSelectRow,
  onSelectAll,
  sortColumn,
  sortDirection,
  onSort,
  className = ''
}: WorkdeckTableProps<T>) {
  const allSelected = data.length > 0 && data.every((item, index) => 
    selectedRows.has(keyExtractor(item, index))
  );
  
  return (
    <div className={`w-full overflow-x-auto border border-[var(--gray-200)] rounded-lg ${className}`}>
      <table className="w-full">
        <thead className="bg-[var(--gray-50)]">
          <tr>
            {selectable && (
              <th className="w-12 px-4 py-4 text-left">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAll?.(checked as boolean)}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-4 text-left text-sm font-semibold text-[var(--gray-700)]"
                style={{ width: column.width }}
              >
                {column.sortable ? (
                  <button
                    onClick={() => onSort?.(column.key)}
                    className="flex items-center gap-2 hover:text-[var(--gray-900)] transition-colors"
                  >
                    {column.header}
                    <span className="flex flex-col">
                      <ChevronUp 
                        className={`w-3 h-3 -mb-1 ${
                          sortColumn === column.key && sortDirection === 'asc' 
                            ? 'text-[var(--primary-blue)]' 
                            : 'text-[var(--gray-400)]'
                        }`}
                      />
                      <ChevronDown 
                        className={`w-3 h-3 ${
                          sortColumn === column.key && sortDirection === 'desc' 
                            ? 'text-[var(--primary-blue)]' 
                            : 'text-[var(--gray-400)]'
                        }`}
                      />
                    </span>
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const key = keyExtractor(item, index);
            const isSelected = selectedRows.has(key);
            
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(item)}
                className={`border-t border-[var(--gray-200)] transition-colors ${
                  isSelected 
                    ? 'bg-[var(--primary-blue-light)]' 
                    : 'hover:bg-[var(--gray-50)]'
                } ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {selectable && (
                  <td className="px-4 py-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectRow?.(key)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-4 text-sm text-[var(--gray-600)]"
                  >
                    {column.render 
                      ? column.render(item) 
                      : String((item as any)[column.key] || '')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export interface WorkdeckTableActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  customActions?: Array<{ label: string; onClick: () => void }>;
}

export function WorkdeckTableActions({ 
  onEdit, 
  onDelete, 
  onView,
  customActions 
}: WorkdeckTableActionsProps) {
  const [open, setOpen] = React.useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1 hover:bg-[var(--gray-100)] rounded transition-colors"
      >
        <MoreVertical className="w-5 h-5 text-[var(--gray-600)]" />
      </button>
      {open && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-[var(--shadow-level-3)] border border-[var(--gray-200)] py-1 z-20">
            {onView && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors"
              >
                View
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-[var(--error-red)] hover:bg-[var(--gray-50)] transition-colors"
              >
                Delete
              </button>
            )}
            {customActions?.map((action, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
