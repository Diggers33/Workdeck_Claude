import React, { useState, useRef, useEffect } from 'react';
import { Upload, Eye, Download, Trash2, Monitor, Search, Grid, List as ListIcon, Maximize2, X } from 'lucide-react';
import { toast } from 'sonner';
import { openGoogleDrivePicker, openOneDrivePicker, formatFileSize, uploadFileToServer, fetchEntityFiles, getProjectFiles, saveProjectFiles } from '../../../services/cloud-file-picker';
import { useAuth } from '../../../contexts/AuthContext';

interface ProjectFilesTabProps {
  projectId?: string;
}

const GoogleDriveLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M7.71 3.5L1.13 15L4.55 21L11.13 9.5L7.71 3.5Z" fill="#0066DA"/>
    <path d="M14.29 3.5L7.71 15L11.13 21L17.71 9.5L14.29 3.5Z" fill="#00AC47"/>
    <path d="M14.29 3.5H7.71L4.29 9.5H17.71L14.29 3.5Z" fill="#EA4335"/>
  </svg>
);

const OneDriveLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M13.8 8.5C15.7 8.2 17.4 8.9 18.6 10.1C21.6 10.4 24 12.9 24 16C24 19.3 21.3 22 18 22H8C4.1 22 1 18.9 1 15C1 11.1 4.1 8 8 8C10.2 8 12.2 9 13.8 10.5V8.5Z" fill="#0078D4"/>
  </svg>
);

export function ProjectFilesTab({ projectId }: ProjectFilesTabProps) {
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: authUser } = useAuth();

  const getFileIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return '📕';
    if (['doc', 'docx', 'txt'].includes(ext || '')) return '📄';
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return '📊';
    if (['ppt', 'pptx'].includes(ext || '')) return '📙';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return '🖼️';
    if (['zip', 'rar', '7z'].includes(ext || '')) return '📦';
    return '📄';
  };

  // Load files from localStorage cache first, then try API
  useEffect(() => {
    if (!projectId) return;
    // Immediately load from localStorage
    const cached = getProjectFiles(projectId);
    if (cached.length > 0) {
      setFiles(cached);
    }
    // Then try to fetch from API
    fetchEntityFiles(projectId, 'projects').then(apiFiles => {
      if (apiFiles.length > 0) {
        const mapped = apiFiles.map((f: any) => ({
          id: f.id || f._id,
          name: f.filename || f.name,
          size: f.size ? formatFileSize(Number(f.size)) : '—',
          icon: getFileIcon(f.filename || f.name || ''),
          uploadedTime: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'unknown',
          uploadedBy: f.uploadedBy || 'Team member',
          source: 'computer' as const,
          token: f.fileUrl?.split('/').pop() || f.token || '',
          fileUrl: f.fileUrl || '',
        }));
        setFiles(mapped);
        saveProjectFiles(projectId, mapped);
      }
    }).catch(() => {});
  }, [projectId]);

  // Persist files to localStorage whenever they change
  useEffect(() => {
    if (projectId && files.length > 0) {
      saveProjectFiles(projectId, files);
    }
  }, [files, projectId]);

  const openFile = (file: any) => {
    if (file.url) {
      window.open(file.url, '_blank');
    } else if (file.token || file.fileUrl) {
      const fileToken = file.token || file.fileUrl?.split('/').pop() || '';
      const baseUrl = import.meta.env.VITE_WORKDECK_API_URL || 'https://test-api.workdeck.com';
      const userId = authUser?.id || '';
      window.open(`${baseUrl}/queries/file/${fileToken}/${userId}`, '_blank');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || !projectId) return;
    setUploading(true);
    try {
      const uploaded: any[] = [];
      for (const file of Array.from(selected)) {
        const result = await uploadFileToServer(file, projectId, 'projects');
        uploaded.push({
          id: result.id,
          name: result.name,
          size: result.size,
          icon: getFileIcon(result.name),
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
            icon: getFileIcon(f.name),
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
            icon: getFileIcon(f.name),
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

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFileCard = (file: any) => (
    <div
      key={file.id}
      onClick={() => openFile(file)}
      style={{
        minHeight: '80px',
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
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
        fontSize: '32px',
        minWidth: '32px',
        alignSelf: 'flex-start'
      }}>
        {file.icon}
      </div>

      {/* File Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#0A0A0A',
          marginBottom: '6px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {file.name}
        </div>
        {/* Task Badge */}
        {file.taskId && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '4px',
            marginBottom: '6px'
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#1D4ED8'
            }}>
              {file.taskName}
            </span>
          </div>
        )}
        <div style={{
          fontSize: '12px',
          color: '#9CA3AF',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {file.source === 'google-drive' && (<GoogleDriveLogo />)}
          {file.source === 'onedrive' && (<OneDriveLogo />)}
          {file.source === 'computer' && (<Monitor size={12} color="#9CA3AF" />)}
          <span>{file.size} • Uploaded {file.uploadedTime} by {file.uploadedBy}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
        <button onClick={(e) => { e.stopPropagation(); openFile(file); }} style={{
          width: '32px',
          height: '32px',
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
          <Eye size={14} color="#3B82F6" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); openFile(file); }} style={{
          width: '32px',
          height: '32px',
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
          <Download size={14} color="#3B82F6" />
        </button>
        <button onClick={(e) => {
          e.stopPropagation();
          setFiles(prev => prev.filter(f => f.id !== file.id));
          toast.success('File removed');
        }} style={{
          width: '32px',
          height: '32px',
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
          <Trash2 size={14} color="#DC2626" />
        </button>
      </div>
    </div>
  );

  const renderContent = () => (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Top Actions Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        gap: '12px'
      }}>
        {/* Upload Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUploadMenu(!showUploadMenu)}
            style={{
              height: '40px',
              padding: '0 16px',
              background: '#3B82F6',
              border: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'white',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
          >
            <Upload size={16} />
            <span>Upload</span>
          </button>

          {/* Upload Dropdown */}
          {showUploadMenu && (
            <div style={{
              position: 'absolute',
              top: '48px',
              left: 0,
              width: '200px',
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
                    height: '44px',
                    padding: '12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
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

        {/* Search Bar */}
        <div style={{
          flex: 1,
          position: 'relative',
          maxWidth: '300px'
        }}>
          <Search size={16} color="#9CA3AF" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)'
          }} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              padding: '0 12px 0 40px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#0A0A0A',
              outline: 'none'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
          />
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          style={{
            width: '40px',
            height: '40px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 150ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB';
            e.currentTarget.style.borderColor = '#3B82F6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#E5E7EB';
          }}
        >
          {isFullscreen ? <X size={16} color="#3B82F6" /> : <Maximize2 size={16} color="#3B82F6" />}
        </button>

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: '#F9FAFB',
          padding: '4px',
          borderRadius: '6px'
        }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: viewMode === 'grid' ? 'white' : 'transparent',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            <Grid size={16} color={viewMode === 'grid' ? '#3B82F6' : '#6B7280'} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: viewMode === 'list' ? 'white' : 'transparent',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            <ListIcon size={16} color={viewMode === 'list' ? '#3B82F6' : '#6B7280'} />
          </button>
        </div>
      </div>

      {/* File Count */}
      <div style={{
        fontSize: '13px',
        color: '#6B7280',
        marginBottom: '16px'
      }}>
        {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
        {uploading && <span style={{ color: '#3B82F6', marginLeft: '12px' }}>Uploading...</span>}
      </div>

      {/* Files List */}
      {viewMode === 'list' ? (
        <div>
          {filteredFiles.map((file) => renderFileCard(file))}
        </div>
      ) : (
        /* Grid View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: isFullscreen ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
          gap: '16px'
        }}>
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => openFile(file)}
              style={{
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '16px',
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
              {/* File Icon - Centered */}
              <div style={{
                fontSize: '48px',
                textAlign: 'center',
                marginBottom: '12px'
              }}>
                {file.icon}
              </div>

              {/* File Name */}
              <div style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#0A0A0A',
                marginBottom: '8px',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {file.name}
              </div>

              {/* File Meta */}
              <div style={{
                fontSize: '11px',
                color: '#9CA3AF',
                textAlign: 'center',
                marginBottom: '12px'
              }}>
                {file.size}
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <button onClick={(e) => { e.stopPropagation(); openFile(file); }} style={{
                  width: '32px',
                  height: '32px',
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
                  <Eye size={14} color="#3B82F6" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); openFile(file); }} style={{
                  width: '32px',
                  height: '32px',
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
                  <Download size={14} color="#3B82F6" />
                </button>
                <button onClick={(e) => {
                  e.stopPropagation();
                  setFiles(prev => prev.filter(f => f.id !== file.id));
                  toast.success('File removed');
                }} style={{
                  width: '32px',
                  height: '32px',
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
                  <Trash2 size={14} color="#DC2626" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '60px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            opacity: 0.3
          }}>
            📁
          </div>
          <div style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '8px'
          }}>
            No files found
          </div>
          <div style={{
            fontSize: '13px',
            color: '#9CA3AF'
          }}>
            Try adjusting your search
          </div>
        </div>
      )}
    </>
  );

  if (isFullscreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'white',
        zIndex: 2000,
        overflowY: 'auto'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '40px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '32px'
          }}>
            Project Repository
          </div>
          {renderContent()}
        </div>
      </div>
    );
  }

  return <div style={{ padding: '24px' }}>{renderContent()}</div>;
}