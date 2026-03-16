import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { InvoiceFormData } from './InvoiceCreationFlow';
import { TimeEntry, Expense, Milestone, AdditionalItem } from '../../contexts/BillingContext';

interface InvoiceLineItemsStepProps {
  formData: InvoiceFormData;
  updateFormData: (data: Partial<InvoiceFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
}

// Initial empty arrays — populated from form data or project data
const emptyTimeEntries: TimeEntry[] = [];
const emptyExpenses: Expense[] = [];
const emptyMilestones: Milestone[] = [];

export const InvoiceLineItemsStep: React.FC<InvoiceLineItemsStepProps> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
  onSaveDraft,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    timeEntries: true,
    expenses: true,
    milestones: true,
    additional: true,
  });

  // Initialize with empty arrays if not yet set
  useEffect(() => {
    if (!formData.timeEntries || formData.timeEntries.length === 0) {
      updateFormData({
        timeEntries: emptyTimeEntries,
        expenses: emptyExpenses,
        milestones: emptyMilestones,
        additionalItems: [],
      });
    }
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleAllTimeEntries = (selected: boolean) => {
    const updated = (formData.timeEntries || []).map(entry => ({ ...entry, selected }));
    updateFormData({ timeEntries: updated });
  };

  const toggleTimeEntry = (id: string) => {
    const updated = (formData.timeEntries || []).map(entry =>
      entry.id === id ? { ...entry, selected: !entry.selected } : entry
    );
    updateFormData({ timeEntries: updated });
  };

  const toggleAllExpenses = (selected: boolean) => {
    const updated = (formData.expenses || []).map(exp => ({ ...exp, selected }));
    updateFormData({ expenses: updated });
  };

  const toggleExpense = (id: string) => {
    const updated = (formData.expenses || []).map(exp =>
      exp.id === id ? { ...exp, selected: !exp.selected } : exp
    );
    updateFormData({ expenses: updated });
  };

  const toggleExpenseTaxable = (id: string) => {
    const updated = (formData.expenses || []).map(exp =>
      exp.id === id ? { ...exp, taxable: !exp.taxable } : exp
    );
    updateFormData({ expenses: updated });
  };

  const toggleAllMilestones = (selected: boolean) => {
    const updated = (formData.milestones || []).map(m => ({ ...m, selected }));
    updateFormData({ milestones: updated });
  };

  const toggleMilestone = (id: string) => {
    const updated = (formData.milestones || []).map(m =>
      m.id === id ? { ...m, selected: !m.selected } : m
    );
    updateFormData({ milestones: updated });
  };

  const updateMilestoneAmount = (id: string, amount: number) => {
    const updated = (formData.milestones || []).map(m =>
      m.id === id ? { ...m, amount } : m
    );
    updateFormData({ milestones: updated });
  };

  const addAdditionalItem = () => {
    const newItem: AdditionalItem = {
      id: `add-${Date.now()}`,
      description: '',
      amount: 0,
      taxable: true,
    };
    updateFormData({ additionalItems: [...(formData.additionalItems || []), newItem] });
  };

  const updateAdditionalItem = (id: string, updates: Partial<AdditionalItem>) => {
    const updated = (formData.additionalItems || []).map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    updateFormData({ additionalItems: updated });
  };

  const deleteAdditionalItem = (id: string) => {
    const updated = (formData.additionalItems || []).filter(item => item.id !== id);
    updateFormData({ additionalItems: updated });
  };

  // Calculate totals
  const timeEntriesTotal = (formData.timeEntries || [])
    .filter(entry => entry.selected)
    .reduce((sum, entry) => sum + entry.amount, 0);

  const expensesTotal = (formData.expenses || [])
    .filter(exp => exp.selected)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const milestonesTotal = (formData.milestones || [])
    .filter(m => m.selected)
    .reduce((sum, m) => sum + m.amount, 0);

  const additionalTotal = (formData.additionalItems || [])
    .reduce((sum, item) => sum + item.amount, 0);

  const subtotal = timeEntriesTotal + expensesTotal + milestonesTotal + additionalTotal;
  const taxAmount = subtotal * ((formData.taxRate || 0) / 100);
  const total = subtotal + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Content area with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 px-24 py-20 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Time Entries Section */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <button
                onClick={() => toggleSection('timeEntries')}
                className="w-full flex items-center justify-between px-16 py-10 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-10">
                  {expandedSections.timeEntries ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                  <div className="flex items-baseline gap-8">
                    <span className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>Time Entries</span>
                    <span className="text-gray-500 text-xs">
                      {(formData.timeEntries || []).filter(e => e.selected).length} of {(formData.timeEntries || []).length} selected
                    </span>
                  </div>
                </div>
                <span className="text-gray-900 tabular-nums" style={{ fontSize: '14px', fontWeight: 600 }}>
                  {formatCurrency(timeEntriesTotal)}
                </span>
              </button>

              {expandedSections.timeEntries && (
                <div>
                  <div className="px-16 py-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex gap-12 text-xs">
                      <button
                        onClick={() => toggleAllTimeEntries(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => toggleAllTimeEntries(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr style={{ height: '36px' }}>
                        <th className="px-16 text-left" style={{ width: '40px' }}></th>
                        <th className="px-12 text-left text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Date</th>
                        <th className="px-12 text-left text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Person</th>
                        <th className="px-12 text-left text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Task</th>
                        <th className="px-12 text-right text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Hours</th>
                        <th className="px-12 text-right text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Rate</th>
                        <th className="px-16 text-right text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.timeEntries || []).map((entry, index) => (
                        <tr 
                          key={entry.id} 
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors group" 
                          style={{ height: '40px' }}
                        >
                          <td className="px-16">
                            <input
                              type="checkbox"
                              checked={entry.selected || false}
                              onChange={() => toggleTimeEntry(entry.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              style={{ width: '16px', height: '16px' }}
                            />
                          </td>
                          <td className="px-12 text-gray-600 text-xs">{entry.date}</td>
                          <td className="px-12 text-gray-900 text-xs">{entry.personName}</td>
                          <td className="px-12 text-gray-900 text-xs">{entry.taskName}</td>
                          <td className="px-12 text-right text-gray-900 text-xs tabular-nums">{entry.hours}</td>
                          <td className="px-12 text-right text-gray-900 text-xs tabular-nums">${entry.rate}</td>
                          <td className="px-16 text-right text-gray-900 text-xs tabular-nums" style={{ fontWeight: 500 }}>
                            {formatCurrency(entry.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Expenses Section */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <button
                onClick={() => toggleSection('expenses')}
                className="w-full flex items-center justify-between px-16 py-10 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-10">
                  {expandedSections.expenses ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                  <div className="flex items-baseline gap-8">
                    <span className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>Expenses</span>
                    <span className="text-gray-500 text-xs">
                      {(formData.expenses || []).filter(e => e.selected).length} of {(formData.expenses || []).length} selected
                    </span>
                  </div>
                </div>
                <span className="text-gray-900 tabular-nums" style={{ fontSize: '14px', fontWeight: 600 }}>
                  {formatCurrency(expensesTotal)}
                </span>
              </button>

              {expandedSections.expenses && (
                <div>
                  <div className="px-16 py-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex gap-12 text-xs">
                      <button
                        onClick={() => toggleAllExpenses(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => toggleAllExpenses(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr style={{ height: '36px' }}>
                        <th className="px-16 text-left" style={{ width: '40px' }}></th>
                        <th className="px-12 text-left text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Date</th>
                        <th className="px-12 text-left text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Description</th>
                        <th className="px-12 text-right text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Amount</th>
                        <th className="px-16 text-center text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px', width: '80px' }}>Taxable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.expenses || []).map((expense) => (
                        <tr 
                          key={expense.id} 
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors" 
                          style={{ height: '40px' }}
                        >
                          <td className="px-16">
                            <input
                              type="checkbox"
                              checked={expense.selected || false}
                              onChange={() => toggleExpense(expense.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              style={{ width: '16px', height: '16px' }}
                            />
                          </td>
                          <td className="px-12 text-gray-600 text-xs">{expense.date}</td>
                          <td className="px-12 text-gray-900 text-xs">{expense.description}</td>
                          <td className="px-12 text-right text-gray-900 text-xs tabular-nums" style={{ fontWeight: 500 }}>
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-16 text-center">
                            <input
                              type="checkbox"
                              checked={expense.taxable}
                              onChange={() => toggleExpenseTaxable(expense.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              style={{ width: '16px', height: '16px' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Milestones Section */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <button
                onClick={() => toggleSection('milestones')}
                className="w-full flex items-center justify-between px-16 py-10 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-10">
                  {expandedSections.milestones ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                  <div className="flex items-baseline gap-8">
                    <span className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>Milestones</span>
                    <span className="text-gray-500 text-xs">
                      {(formData.milestones || []).filter(m => m.selected).length} of {(formData.milestones || []).length} selected
                    </span>
                  </div>
                </div>
                <span className="text-gray-900 tabular-nums" style={{ fontSize: '14px', fontWeight: 600 }}>
                  {formatCurrency(milestonesTotal)}
                </span>
              </button>

              {expandedSections.milestones && (
                <div>
                  <div className="px-16 py-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex gap-12 text-xs">
                      <button
                        onClick={() => toggleAllMilestones(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => toggleAllMilestones(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr style={{ height: '36px' }}>
                        <th className="px-16 text-left" style={{ width: '40px' }}></th>
                        <th className="px-12 text-left text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Milestone</th>
                        <th className="px-12 text-left text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Delivery Date</th>
                        <th className="px-12 text-right text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Amount</th>
                        <th className="px-16 text-center text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px', width: '80px' }}>Taxable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.milestones || []).map((milestone) => (
                        <tr 
                          key={milestone.id} 
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors" 
                          style={{ height: '40px' }}
                        >
                          <td className="px-16">
                            <input
                              type="checkbox"
                              checked={milestone.selected || false}
                              onChange={() => toggleMilestone(milestone.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              style={{ width: '16px', height: '16px' }}
                            />
                          </td>
                          <td className="px-12 text-gray-900 text-xs">{milestone.name}</td>
                          <td className="px-12 text-gray-600 text-xs">{milestone.deliveryDate}</td>
                          <td className="px-12 text-right">
                            <input
                              type="number"
                              value={milestone.amount}
                              onChange={(e) => updateMilestoneAmount(milestone.id, parseFloat(e.target.value) || 0)}
                              className="w-full text-right px-8 py-4 border border-gray-300 rounded text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          </td>
                          <td className="px-16 text-center">
                            <input
                              type="checkbox"
                              checked={milestone.taxable}
                              disabled
                              className="rounded border-gray-300 text-blue-600"
                              style={{ width: '16px', height: '16px' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Additional Items Section */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <button
                onClick={() => toggleSection('additional')}
                className="w-full flex items-center justify-between px-16 py-10 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-10">
                  {expandedSections.additional ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                  <div className="flex items-baseline gap-8">
                    <span className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>Additional Items</span>
                    <span className="text-gray-500 text-xs">{(formData.additionalItems || []).length} items</span>
                  </div>
                </div>
                <span className="text-gray-900 tabular-nums" style={{ fontSize: '14px', fontWeight: 600 }}>
                  {formatCurrency(additionalTotal)}
                </span>
              </button>

              {expandedSections.additional && (
                <div>
                  <div className="px-16 py-10 bg-gray-50 border-b border-gray-200">
                    <button
                      onClick={addAdditionalItem}
                      className="flex items-center gap-6 px-10 py-5 text-blue-600 hover:bg-blue-50 rounded text-xs transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <Plus size={14} />
                      Add Item
                    </button>
                  </div>

                  {(formData.additionalItems || []).length > 0 && (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr style={{ height: '36px' }}>
                          <th className="px-16 text-left text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px' }}>Description</th>
                          <th className="px-12 text-right text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px', width: '140px' }}>Amount</th>
                          <th className="px-12 text-center text-gray-600 text-xs uppercase tracking-wider" style={{ fontWeight: 600, letterSpacing: '0.6px', width: '80px' }}>Taxable</th>
                          <th className="px-16 text-right" style={{ width: '60px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.additionalItems || []).map((item) => (
                          <tr 
                            key={item.id} 
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors" 
                            style={{ height: '40px' }}
                          >
                            <td className="px-16">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateAdditionalItem(item.id, { description: e.target.value })}
                                placeholder="Enter description..."
                                className="w-full px-8 py-4 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                              />
                            </td>
                            <td className="px-12">
                              <input
                                type="number"
                                value={item.amount}
                                onChange={(e) => updateAdditionalItem(item.id, { amount: parseFloat(e.target.value) || 0 })}
                                className="w-full text-right px-8 py-4 border border-gray-300 rounded text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
                              />
                            </td>
                            <td className="px-12 text-center">
                              <input
                                type="checkbox"
                                checked={item.taxable}
                                onChange={(e) => updateAdditionalItem(item.id, { taxable: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                style={{ width: '16px', height: '16px' }}
                              />
                            </td>
                            <td className="px-16 text-right">
                              <button
                                onClick={() => deleteAdditionalItem(item.id)}
                                className="p-4 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Sidebar - Sticky */}
        <div className="flex-none border-l border-gray-200 bg-white overflow-y-auto" style={{ width: '300px' }}>
          <div className="sticky top-0 p-20">
            <div className="mb-16">
              <h3 className="text-gray-900 text-sm mb-2" style={{ fontWeight: 600 }}>Invoice Total</h3>
              <div className="text-gray-900 tabular-nums" style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px' }}>
                {formatCurrency(total)}
              </div>
            </div>
            
            <div className="space-y-10 pb-16 mb-16 border-b border-gray-200">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Time Entries</span>
                <span className="text-gray-900 tabular-nums">{formatCurrency(timeEntriesTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Expenses</span>
                <span className="text-gray-900 tabular-nums">{formatCurrency(expensesTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Milestones</span>
                <span className="text-gray-900 tabular-nums">{formatCurrency(milestonesTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Additional</span>
                <span className="text-gray-900 tabular-nums">{formatCurrency(additionalTotal)}</span>
              </div>
            </div>

            <div className="space-y-10 pb-16 mb-16 border-b border-gray-200">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Tax ({formData.taxRate}%)</span>
                <span className="text-gray-900 tabular-nums">{formatCurrency(taxAmount)}</span>
              </div>
            </div>

            {formData.dueDate && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Due Date</span>
                <span className="text-gray-900">
                  {new Date(formData.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - 48px */}
      <div
        className="flex-none border-t bg-white flex items-center justify-between"
        style={{
          borderColor: '#E5E7EB',
          height: '48px',
          padding: '0 24px',
        }}
      >
        <button
          onClick={onBack}
          className="px-12 py-6 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <div className="flex gap-8">
          <button
            onClick={onSaveDraft}
            className="px-12 py-6 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={onNext}
            className="px-16 py-6 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
            style={{ fontWeight: 600 }}
          >
            Preview Invoice
          </button>
        </div>
      </div>
    </div>
  );
};