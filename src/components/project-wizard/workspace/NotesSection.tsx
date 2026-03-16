import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, List, Code, Link, Save, Loader2, Check } from 'lucide-react';

interface NotesSectionProps {
  projectData?: any;
  projectId?: string;
  onUpdate?: (notes: string) => void;
}

export function NotesSection({ projectData, projectId, onUpdate }: NotesSectionProps) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize notes from project data
  useEffect(() => {
    if (projectData?.observations) {
      setNotes(projectData.observations);
    }
  }, [projectData]);

  // Auto-save after 3 seconds of no typing
  useEffect(() => {
    if (!hasChanges) return;
    
    const timer = setTimeout(() => {
      saveNotes();
    }, 3000);

    return () => clearTimeout(timer);
  }, [notes, hasChanges]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
    onUpdate?.(value);
  };

  const saveNotes = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    try {
      // Simulate save delay - TODO: implement actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Not saved yet';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return lastSaved.toLocaleTimeString();
  };

  // Text formatting helpers
  const insertFormatting = (before: string, after: string = before) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);
    const newText = notes.substring(0, start) + before + selectedText + after + notes.substring(end);
    
    handleNotesChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#E5E7EB]">
        <h2 className="text-[#111827] text-lg font-semibold">Notes</h2>
        <p className="text-sm text-[#6B7280] mt-1">Project notes and documentation</p>
      </div>

      {/* Editor Toolbar */}
      <div className="px-6 py-3 border-b border-[#E5E7EB] flex items-center gap-1">
        <button
          onClick={() => insertFormatting('**')}
          className="w-8 h-8 flex items-center justify-center text-[#4B5563] hover:bg-[#F3F4F6] rounded transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4 stroke-[1.5]" />
        </button>
        <button
          onClick={() => insertFormatting('\n- ', '')}
          className="w-8 h-8 flex items-center justify-center text-[#4B5563] hover:bg-[#F3F4F6] rounded transition-colors"
          title="List"
        >
          <List className="w-4 h-4 stroke-[1.5]" />
        </button>
        <button
          onClick={() => insertFormatting('`')}
          className="w-8 h-8 flex items-center justify-center text-[#4B5563] hover:bg-[#F3F4F6] rounded transition-colors"
          title="Code"
        >
          <Code className="w-4 h-4 stroke-[1.5]" />
        </button>
        <button
          onClick={() => insertFormatting('[', '](url)')}
          className="w-8 h-8 flex items-center justify-center text-[#4B5563] hover:bg-[#F3F4F6] rounded transition-colors"
          title="Link"
        >
          <Link className="w-4 h-4 stroke-[1.5]" />
        </button>
        
        <div className="flex-1" />
        
        {/* Save status */}
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
          {saving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </>
          ) : hasChanges ? (
            <span className="text-amber-500">Unsaved changes</span>
          ) : lastSaved ? (
            <>
              <Check className="w-3 h-3 text-green-500" />
              Saved {formatLastSaved()}
            </>
          ) : null}
        </div>
      </div>

      {/* Text Editor */}
      <div className="p-6">
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          className="w-full min-h-[500px] p-4 bg-[#FAFAFC] border border-[#E5E7EB] rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none resize-none text-sm text-[#374151] leading-relaxed"
          placeholder="Start typing your notes..."
        />
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-[#9CA3AF]">
            {hasChanges ? 'Changes will be auto-saved' : formatLastSaved()}
          </p>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={saveNotes}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
