import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/services/api-client';

interface Budget {
  id: string;
  type: string;
  costTypeId?: string;
  office: string;
  officeId?: string;
  department: string;
  linkedTo: string;
  linkedActivityId?: string;
  description: string;
  amount: number;
}

interface BudgetSectionProps {
  projectData?: any;
  projectId?: string;
  onUpdate?: (budgets: Budget[]) => void;
}

export function BudgetSection({ projectData, projectId, onUpdate }: BudgetSectionProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [costTypes, setCostTypes] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [newBudget, setNewBudget] = useState<Partial<Budget>>({
    type: '',
    office: '',
    department: '',
    linkedTo: '',
    description: '',
    amount: 0,
  });

  // Get activities for linking
  const activities = projectData?.activities || [];
  const linkedOptions = activities.map((a: any) => ({
    value: a.id,
    label: a.name,
  }));

  // Load cost types and offices
  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [costTypesRes, officesRes] = await Promise.all([
        apiClient.get('/queries/cost-types').catch(() => ({ result: [] })),
        apiClient.get('/queries/offices').catch(() => ({ result: [] })),
      ]);
      setCostTypes(costTypesRes.result || []);
      setOffices(officesRes.result || []);
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
  };

  // Initialize budgets from projectData
  useEffect(() => {
    if (projectData?.budgets) {
      const mappedBudgets: Budget[] = projectData.budgets.map((b: any) => ({
        id: b.id,
        type: b.costType?.name || '',
        costTypeId: b.costType?.id,
        office: b.office?.name || '',
        officeId: b.office?.id,
        department: b.department || '',
        linkedTo: b.activity?.name || '',
        linkedActivityId: b.activity?.id,
        description: b.description || '',
        amount: parseFloat(b.amount) || 0,
      }));
      setBudgets(mappedBudgets);
    }
  }, [projectData]);

  const addBudget = () => {
    if (!newBudget.type || !newBudget.amount) return;

    const budget: Budget = {
      id: `new-${Date.now()}`,
      type: newBudget.type,
      office: newBudget.office || '',
      department: newBudget.department || '',
      linkedTo: newBudget.linkedTo || '',
      description: newBudget.description || '',
      amount: newBudget.amount,
    };

    const updatedBudgets = [...budgets, budget];
    setBudgets(updatedBudgets);
    onUpdate?.(updatedBudgets);
    
    setIsDialogOpen(false);
    setNewBudget({
      type: '',
      office: '',
      department: '',
      linkedTo: '',
      description: '',
      amount: 0,
    });
  };

  const deleteBudget = (id: string) => {
    const updatedBudgets = budgets.filter((b) => b.id !== id);
    setBudgets(updatedBudgets);
    onUpdate?.(updatedBudgets);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const contractValue = parseFloat(projectData?.contractValue) || 0;

  // Get unique departments from project members
  const departments = [...new Set(
    (projectData?.members || [])
      .map((m: any) => m.user?.department)
      .filter(Boolean)
  )];

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="text-[#111827] text-lg font-semibold">Budget & Expenditures</h2>
          <p className="text-sm text-[#6B7280] mt-1">Track project costs and expenses</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2 stroke-[1.5]" />
          Add Expenditure
        </Button>
      </div>

      {/* Summary Cards */}
      {(contractValue > 0 || totalBudget > 0) && (
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-xs text-[#6B7280]">Contract Value</p>
              <p className="text-lg font-semibold text-[#111827]">€{contractValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Total Budgeted</p>
              <p className="text-lg font-semibold text-[#111827]">€{totalBudget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Remaining</p>
              <p className={`text-lg font-semibold ${contractValue - totalBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{(contractValue - totalBudget).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Budget Table */}
      <div className="p-6">
        {budgets.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#4B5563]">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#4B5563]">Office</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#4B5563]">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#4B5563]">Linked To</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#4B5563]">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[#4B5563]">Amount (€)</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => (
                  <tr key={budget.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-4 py-3 text-sm text-[#111827] font-medium">{budget.type}</td>
                    <td className="px-4 py-3 text-sm text-[#4B5563]">{budget.office || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#4B5563]">{budget.department || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#4B5563]">{budget.linkedTo || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#4B5563] max-w-xs truncate">
                      {budget.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#111827] text-right font-mono">
                      €{budget.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteBudget(budget.id)}
                        className="text-[#9CA3AF] hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.5]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F9FAFB] border-t-2 border-[#D1D5DB]">
                  <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-[#111827]">
                    Total Budget
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#111827] text-right font-mono">
                    €{totalBudget.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-7 h-7 text-[#9CA3AF]" />
            </div>
            <p className="text-[#6B7280] mb-4">No expenditures recorded</p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2 stroke-[1.5]" />
              Add First Expenditure
            </Button>
          </div>
        )}
      </div>

      {/* Add Budget Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Expenditure Item</DialogTitle>
            <DialogDescription>Add a new expenditure item to the project budget.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Expenditure Type</Label>
              <Select
                value={newBudget.type}
                onValueChange={(value) => setNewBudget({ ...newBudget, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {costTypes.length > 0 ? (
                    costTypes.map((ct) => (
                      <SelectItem key={ct.id} value={ct.name}>
                        {ct.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Software Licenses">Software Licenses</SelectItem>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Consulting Services">Consulting Services</SelectItem>
                      <SelectItem value="Travel & Accommodation">Travel & Accommodation</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Office</Label>
                <Select
                  value={newBudget.office}
                  onValueChange={(value) => setNewBudget({ ...newBudget, office: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select office" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.length > 0 ? (
                      offices.map((office) => (
                        <SelectItem key={office.id} value={office.name}>
                          {office.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Dublin">Dublin</SelectItem>
                        <SelectItem value="London">London</SelectItem>
                        <SelectItem value="Barcelona">Barcelona</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={newBudget.department}
                  onValueChange={(value) => setNewBudget({ ...newBudget, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length > 0 ? (
                      departments.map((dept: string) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="PMO">PMO</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Linked Activity</Label>
              <Select
                value={newBudget.linkedTo}
                onValueChange={(value) => setNewBudget({ ...newBudget, linkedTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {linkedOptions.map((option: any) => (
                    <SelectItem key={option.value} value={option.label}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newBudget.description}
                onChange={(e) => setNewBudget({ ...newBudget, description: e.target.value })}
                placeholder="Add description"
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Amount (€)</Label>
              <Input
                type="number"
                value={newBudget.amount || ''}
                onChange={(e) => setNewBudget({ ...newBudget, amount: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addBudget} className="bg-blue-600 hover:bg-blue-700">
                Add Expenditure
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
