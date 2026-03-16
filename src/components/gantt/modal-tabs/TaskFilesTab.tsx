import React, { useState, useRef, useEffect } from 'react';
import { Upload, Eye, Download, Trash2, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { openGoogleDrivePicker, openOneDrivePicker, formatFileSize, uploadFileToServer, fetchEntityFiles, getTaskFiles, saveTaskFiles } from '../../../services/cloud-file-picker';
import { useAuth } from '../../../contexts/AuthContext';

interface TaskFilesTabProps {
  task: any;
}

// Brand Logo Components
const GoogleDriveLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M7.71 3.5L1.13 15L4.55 21L11.13 9.5L7.71 3.5Z" fill="#0066DA"/>
    <path d="M14.29 3.5L7.71 15L11.13 21L17.71 9.5L14.29 3.5Z" fill="#00AC47"/>
    <path d="M14.29 3.5H7.71L4.29 9.5H17.71L14.29 3.5Z" fill="#EA4335"/>
    <path d="M4.55 21L7.71 15L1.13 15L4.55 21Z" fill="#00832D"/>
    <path d="M19.45 21L22.87 15L16.29 15L19.45 21Z" fill="#2684FC"/>
    <path d="M11.13 9.5L7.71 15H16.29L19.45 21H4.55L1.13 15L7.71 3.5H14.29L17.71 9.5H11.13Z" fill="#FFBA00"/>
  </svg>
);

const OneDriveLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M13.8 8.5C12.2 7 10.2 6 8 6C4.1 6 1 9.1 1 13C1 16.9 4.1 20 8 20H18C21.3 20 24 17.3 24 14C24 10.9 21.6 8.4 18.6 8.1C17.4 6.9 15.7 6.2 13.8 6.5V8.5Z" fill="#0364B8"/>
    <path d="M13.8 8.5C15.7 8.2 17.4 8.9 18.6 10.1C21.6 10.4 24 12.9 24 16C24 19.3 21.3 22 18 22H8C4.1 22 1 18.9 1 15C1 11.1 4.1 8 8 8C10.2 8 12.2 9 13.8 10.5V8.5Z" fill="#0078D4"/>
    <path d="M13.8 8.5V10.5C12.2 9 10.2 8 8 8C6.3 8 4.8 8.6 3.6 9.7C2.6 10.7 2 12.2 2 13.8C2 14.5 2.1 15.1 2.4 15.7C3.1 17.3 4.8 18.5 6.8 18.8C7.2 18.9 7.6 19 8 19H18C20.2 19 22 17.2 22 15C22 13 20.5 11.3 18.6 11C17.9 9.6 16.5 8.6 14.8 8.5H13.8Z" fill="#1490DF"/>
    <path d="M18.6 11C20.5 11.3 22 13 22 15C22 17.2 20.2 19 18 19H8C7.6 19 7.2 18.9 6.8 18.8C8.4 18.5 9.8 17.6 10.7 16.3C11.4 15.3 11.8 14.2 11.9 13H13.8C15.5 13 17.2 12.3 18.6 11Z" fill="#28A8EA"/>
  </svg>
);

export function TaskFilesTab({ task }: TaskFilesTabProps) {
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: authUser } = useAuth();

  // Load files from localStorage cache first, then try API
  useEffect(() => {
    if (!task?.id) return;
    // Immediately load from localStorage
    const cached = getTaskFiles(task.id);
    if (cached.length > 0) {
      setFiles(cached);
    }
    // Then try to fetch from API (may return newer data)
    fetchEntityFiles(task.id, 'tasks').then(apiFiles => {
      if (apiFiles.length > 0) {
        const mapped = apiFiles.map((f: any) => ({
          id: f.id || f._id,
          name: f.filename || f.name,
          size: f.size ? formatFileSize(Number(f.size)) : '—',
          icon: '📄',
          uploadedTime: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'unknown',
          uploadedBy: f.uploadedBy || 'Team member',
          source: 'computer' as const,
          token: f.fileUrl?.split('/').pop() || f.token || '',
          fileUrl: f.fileUrl || '',
        }));
        setFiles(mapped);
        saveTaskFiles(task.id, mapped);
      }
    }).catch(() => {});
  }, [task?.id]);

  // Persist files to localStorage whenever they change
  useEffect(() => {
    if (task?.id && files.length > 0) {
      saveTaskFiles(task.id, files);
    }
  }, [files, task?.id]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || !task?.id) return;
    setUploading(true);
    try {
      const uploaded: any[] = [];
      for (const file of Array.from(selected)) {
        const result = await uploadFileToServer(file, task.id, 'tasks');
        uploaded.push({
          id: result.id,
          name: result.name,
          size: result.size,
          icon: '📄',
          uploadedTime: 'just now',
          uploadedBy: 'You',
          source: 'computer' as const,
          token: result.token,
          fileUrl: result.fileUrl,
        });
      }
      setFiles(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleUploadOptionClick = async (optionId: string) => {
    setShowUploadMenu(false);
    if (optionId === 'computer') {
      fileInputRef.current?.click();
    } else if (optionId === 'gdrive') {
      try {
        const picked = await openGoogleDrivePicker();
        if (picked.length > 0) {
          const newFiles = picked.map(f => ({
            id: `gdrive-${f.id}`,
            name: f.name,
            size: formatFileSize(f.size),
            icon: '📄',
            uploadedTime: 'just now',
            uploadedBy: 'You',
            source: 'google-drive' as const,
            url: f.url,
          }));
          setFiles(prev => [...prev, ...newFiles]);
          toast.success(`${picked.length} file${picked.length > 1 ? 's' : ''} added from Google Drive`);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to open Google Drive');
      }
    } else if (optionId === 'onedrive') {
      try {
        const picked = await openOneDrivePicker();
        if (picked.length > 0) {
          const newFiles = picked.map(f => ({
            id: `onedrive-${f.id}`,
            name: f.name,
            size: formatFileSize(f.size),
            icon: '📄',
            uploadedTime: 'just now',
            uploadedBy: 'You',
            source: 'onedrive' as const,
            url: f.url,
          }));
          setFiles(prev => [...prev, ...newFiles]);
          toast.success(`${picked.length} file${picked.length > 1 ? 's' : ''} added from OneDrive`);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to open OneDrive');
      }
    }
  };

  const uploadOptions = [
    {
      id: 'computer',
      icon: <Monitor size={20} color="#6B7280" />,
      label: 'Computer'
    },
    {
      id: 'gdrive',
      icon: <GoogleDriveLogo />,
      label: 'Google Drive'
    },
    {
      id: 'onedrive',
      icon: <OneDriveLogo />,
      label: 'OneDrive'
    }
  ];

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Upload Button */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <button
          onClick={() => setShowUploadMenu(!showUploadMenu)}
          style={{
            width: '160px',
            height: '48px',
            background: 'white',
            border: '2px dashed #3B82F6',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#3B82F6',
            cursor: 'pointer',
            transition: 'all 150ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#EFF6FF';
            e.currentTarget.style.borderStyle = 'solid';
          }}
          onMouseLeave={(e) => {
            if (!showUploadMenu) {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderStyle = 'dashed';
            }
          }}
        >
          <Upload size={18} />
          <span>Upload File</span>
        </button>

        {/* Upload Dropdown */}
        {showUploadMenu && (
          <div style={{
            position: 'absolute',
            top: '56px',
            left: 0,
            width: '240px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '8px',
            zIndex: 10
          }}>
            {uploadOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleUploadOptionClick(option.id)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '15px',
                  color: '#0A0A0A',
                  cursor: 'pointer',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Uploading indicator */}
      {uploading && (
        <div style={{ fontSize: '14px', color: '#3B82F6', marginBottom: '16px' }}>
          Uploading...
        </div>
      )}

      {/* File List */}
      {files.length === 0 && !uploading ? (
        // Empty State
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '40px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            opacity: 0.3
          }}>
            📎
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '8px'
          }}>
            No files attached
          </div>
          <div style={{
            fontSize: '14px',
            color: '#9CA3AF'
          }}>
            Upload files from your computer or cloud storage
          </div>
        </div>
      ) : (
        // Files List
        <div>
          {files.map((file) => {
            const openFile = () => {
              if (file.url) {
                window.open(file.url, '_blank');
              } else if (file.token || file.fileUrl) {
                const fileToken = file.token || file.fileUrl?.split('/').pop() || '';
                const baseUrl = import.meta.env.VITE_WORKDECK_API_URL || 'https://test-api.workdeck.com';
                const userId = authUser?.id || '';
                window.open(`${baseUrl}/queries/file/${fileToken}/${userId}`, '_blank');
              }
            };
            return (
            <div
              key={file.id}
              onClick={openFile}
              style={{
                height: '80px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '12px',
                transition: 'all 150ms ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* File Icon */}
              <div style={{
                fontSize: '40px',
                minWidth: '40px'
              }}>
                {file.icon}
              </div>

              {/* File Info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#0A0A0A',
                  marginBottom: '4px'
                }}>
                  {file.name}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#9CA3AF'
                }}>
                  {file.size} • Uploaded {file.uploadedTime} by {file.uploadedBy}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={(e) => { e.stopPropagation(); openFile(); }} style={{
                  width: '36px',
                  height: '36px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#EFF6FF';
                  e.currentTarget.style.borderColor = '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
                >
                  <Eye size={16} color="#3B82F6" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); openFile(); }} style={{
                  width: '36px',
                  height: '36px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#EFF6FF';
                  e.currentTarget.style.borderColor = '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
                >
                  <Download size={16} color="#3B82F6" />
                </button>
                <button onClick={(e) => {
                  e.stopPropagation();
                  setFiles(prev => prev.filter(f => f.id !== file.id));
                  toast.success('File removed');
                }} style={{
                  width: '36px',
                  height: '36px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FEE2E2';
                  e.currentTarget.style.borderColor = '#DC2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
                >
                  <Trash2 size={16} color="#DC2626" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}