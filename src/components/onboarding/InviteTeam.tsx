import React, { useState } from 'react';
import { UserPlus, Mail, X, ChevronLeft, Upload } from 'lucide-react';

interface InviteTeamProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function InviteTeam({ data, onUpdate, onNext, onBack }: InviteTeamProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Member');
  const [showBulkImport, setShowBulkImport] = useState(false);

  const addTeamMember = () => {
    if (email && email.includes('@')) {
      onUpdate({
        teamMembers: [...data.teamMembers, { email, name: name || email.split('@')[0], role }]
      });
      setEmail('');
      setName('');
      setRole('Member');
    }
  };

  const removeTeamMember = (index: number) => {
    onUpdate({
      teamMembers: data.teamMembers.filter((_: any, i: number) => i !== index)
    });
  };

  const avatarColors = ['#0066FF', '#34D399', '#F472B6', '#FBBF24', '#60A5FA', '#A78BFA'];

  return (
    <div className="bg-white rounded-lg p-8 max-w-2xl w-full" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-medium text-[#0066FF]">Step 3 of 3</span>
          <div className="flex-1 h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div className="h-full bg-[#0066FF] rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0066FF]/10 mb-3">
          <UserPlus className="w-6 h-6 text-[#0066FF]" />
        </div>
        <h2 className="text-[#1F2937] text-[24px] font-medium mb-1">Invite your team</h2>
        <p className="text-[#6B7280] text-[14px]">Collaboration works better together. Add your colleagues.</p>
      </div>

      {/* Add member form */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-[2fr,1.5fr,1fr,auto] gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTeamMember()}
            placeholder="email@company.com"
            className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTeamMember()}
            placeholder="Name (optional)"
            className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
          >
            <option value="Admin">Admin</option>
            <option value="Member">Member</option>
          </select>
          <button
            onClick={addTeamMember}
            disabled={!email || !email.includes('@')}
            className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg font-medium transition-colors disabled:bg-[#D1D5DB] disabled:cursor-not-allowed flex items-center justify-center"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Bulk import toggle */}
        <button
          onClick={() => setShowBulkImport(!showBulkImport)}
          className="text-[12px] text-[#0066FF] hover:text-[#0052CC] font-medium flex items-center gap-1"
        >
          <Upload className="w-3 h-3" />
          {showBulkImport ? 'Hide' : 'Bulk import from CSV'}
        </button>

        {showBulkImport && (
          <div className="border-2 border-dashed border-[#D1D5DB] rounded-lg p-4 text-center">
            <Upload className="w-6 h-6 text-[#9CA3AF] mx-auto mb-2" />
            <p className="text-[12px] text-[#6B7280] mb-2">
              Drop CSV file here or click to upload
            </p>
            <p className="text-[11px] text-[#9CA3AF]">
              Format: email, name, role
            </p>
          </div>
        )}
      </div>

      {/* Team members list */}
      {data.teamMembers.length > 0 && (
        <div className="mb-6">
          <p className="text-[12px] font-medium text-[#6B7280] mb-3">
            {data.teamMembers.length} team member{data.teamMembers.length !== 1 ? 's' : ''} added
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {data.teamMembers.map((member: any, index: number) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-medium flex-shrink-0"
                  style={{ backgroundColor: avatarColors[index % avatarColors.length] }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1F2937] truncate">{member.name}</p>
                  <p className="text-[11px] text-[#9CA3AF] truncate">{member.email}</p>
                </div>
                <span className="text-[11px] font-medium text-[#6B7280] px-2 py-0.5 bg-white rounded border border-[#E5E7EB]">
                  {member.role}
                </span>
                <button
                  onClick={() => removeTeamMember(index)}
                  className="text-[#9CA3AF] hover:text-[#F87171] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {data.teamMembers.length === 0 && (
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-6 text-center mb-6">
          <Mail className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
          <p className="text-[13px] text-[#6B7280]">
            No team members yet. Add colleagues to collaborate.
          </p>
        </div>
      )}

      {/* Info callout */}
      <div className="bg-[#F0F4FF] border border-[#DBEAFE] rounded-lg p-3 mb-6">
        <p className="text-[12px] text-[#1F2937]">
          💡 You can skip this step and invite your team later
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-[#D1D5DB] rounded-lg text-[14px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] text-white py-2 rounded-lg font-medium transition-colors"
        >
          {data.teamMembers.length > 0 ? 'Send invites & continue' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}
