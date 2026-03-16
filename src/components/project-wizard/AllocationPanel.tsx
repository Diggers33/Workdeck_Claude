import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AllocationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  taskName: string;
  teamMembers: Array<{ value: string; label: string }>;
  selectedMembers: string[];
  allocations: { [memberId: string]: number };
  onUpdateAllocation: (memberId: string, hours: number) => void;
  onAccept: () => void;
}

export function AllocationPanel({
  isOpen,
  onClose,
  taskName,
  teamMembers,
  selectedMembers,
  allocations,
  onUpdateAllocation,
  onAccept,
}: AllocationPanelProps) {
  if (!isOpen) return null;

  const selectedTeamMembers = teamMembers.filter((member) => selectedMembers.includes(member.value));
  const totalAllocated = Object.values(allocations).reduce((sum, hours) => sum + hours, 0);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="text-[#111827]">Adjust Allocations</h3>
            <p className="text-sm text-[#6B7280] mt-0.5">{taskName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#4B5563] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {selectedTeamMembers.length === 0 ? (
              <p className="text-sm text-[#6B7280] text-center py-8">
                No team members assigned to this task
              </p>
            ) : (
              selectedTeamMembers.map((member) => (
                <div key={member.value} className="space-y-2">
                  <Label className="text-sm text-[#374151]">{member.label}</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={allocations[member.value] || 0}
                      onChange={(e) => onUpdateAllocation(member.value, Number(e.target.value))}
                      className="flex-1"
                      placeholder="0"
                    />
                    <span className="text-sm text-[#6B7280] w-12">hours</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedTeamMembers.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#4B5563]">Total Allocated:</span>
                <span className="text-[#111827]">{totalAllocated} hours</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onAccept} className="bg-blue-600 hover:bg-blue-700">
            Accept
          </Button>
        </div>
      </div>
    </>
  );
}
