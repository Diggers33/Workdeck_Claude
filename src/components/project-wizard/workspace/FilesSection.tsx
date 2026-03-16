import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Image, File, Download, Trash2, MoreVertical, X, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api-client';

interface FileItem {
  id: string;
  name: string;
  type: 'document' | 'image' | 'other';
  size: string;
  uploadedBy: string;
  uploadedDate: string;
  url?: string;
}

interface FilesSectionProps {
  projectData?: any;
  projectId?: string;
  onUpdate?: (files: FileItem[]) => void;
}

export function FilesSection({ projectData, projectId, onUpdate }: FilesSectionProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files from project data or API
  useEffect(() => {
    if (projectId) {
      loadFiles();
    }
  }, [projectId]);

  const loadFiles = async () => {
    try {
      const response = await apiClient.get(`/queries/files/projects/${projectId}`);
      if (response.result) {
        const mappedFiles: FileItem[] = response.result.map((f: any) => ({
          id: f.id,
          name: f.name || f.filename,
          type: getFileType(f.name || f.filename),
          size: formatFileSize(f.size),
          uploadedBy: f.uploadedBy?.displayName || f.user?.firstName || 'Unknown',
          uploadedDate: f.createdAt || f.uploadedAt,
          url: f.url,
        }));
        setFiles(mappedFiles);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const getFileType = (filename: string): 'document' | 'image' | 'other' => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext || '')) {
      return 'document';
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return 'image';
    }
    return 'other';
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document':
        return FileText;
      case 'image':
        return Image;
      default:
        return File;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      handleUpload(Array.from(selectedFiles));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles) {
      handleUpload(Array.from(droppedFiles));
    }
  };

  const handleUpload = async (filesToUpload: globalThis.File[]) => {
    setUploading(true);
    
    for (const file of filesToUpload) {
      try {
        // Create a new file entry locally first
        const newFile: FileItem = {
          id: `temp-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: getFileType(file.name),
          size: formatFileSize(file.size),
          uploadedBy: 'You',
          uploadedDate: new Date().toISOString(),
        };
        
        setFiles(prev => [...prev, newFile]);
        
        // TODO: Implement actual file upload when API endpoint is available
        // const formData = new FormData();
        // formData.append('file', file);
        // formData.append('projectId', projectId);
        // await apiClient.upload('/commands/sync/upload-url', formData);
        
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }
    
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      // TODO: Implement actual file deletion when API endpoint is available
      // await apiClient.post('/commands/sync/delete-file', { id: fileId });
      
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      onUpdate?.(updatedFiles);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const downloadFile = (file: FileItem) => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="text-[#111827] text-lg font-semibold">Files</h2>
          <p className="text-sm text-[#6B7280] mt-1">Project documents and attachments</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2 stroke-[1.5]" />
          )}
          Upload File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Files Grid */}
      <div className="p-6">
        {files.length === 0 ? (
          <div
            className={`text-center py-12 border-2 border-dashed rounded-lg transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-[#E5E7EB]'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-[#9CA3AF]" />
            </div>
            <p className="text-[#6B7280] mb-2">No files uploaded yet</p>
            <p className="text-[#9CA3AF] text-sm mb-4">Drag and drop files here, or click to upload</p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2 stroke-[1.5]" />
              Upload First File
            </Button>
          </div>
        ) : (
          <>
            {/* Drop zone */}
            {dragOver && (
              <div
                className="mb-4 p-8 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg text-center"
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-blue-600">Drop files here to upload</p>
              </div>
            )}
            
            <div 
              className="grid grid-cols-4 gap-4"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            >
              {files.map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    className="group p-4 rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] hover:shadow-md transition-all"
                  >
                    {/* File Icon */}
                    <div className="w-12 h-12 bg-[#F3F4F6] rounded-lg flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6 text-[#9CA3AF] stroke-[1.5]" />
                    </div>

                    {/* File Info */}
                    <p className="text-sm text-[#111827] font-medium truncate mb-1" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-[#6B7280] mb-2">{file.size}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {file.uploadedBy} • {formatDate(file.uploadedDate)}
                    </p>

                    {/* Actions - Show on hover */}
                    <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => downloadFile(file)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs text-[#4B5563] hover:bg-[#F3F4F6] rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5 stroke-[1.5]" />
                        Download
                      </button>
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="w-7 h-7 flex items-center justify-center text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
