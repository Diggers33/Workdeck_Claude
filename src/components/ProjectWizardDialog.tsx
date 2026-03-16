import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api-client';
import { ENDPOINTS } from '../config/api';
import { ProjectWorkspace } from './project-wizard/ProjectWorkspace';

interface ProjectWizardDialogProps {
  mode: 'create' | 'edit';
  projectId?: string;
  onClose: () => void;
  onSave?: (data: any) => void;
}

export function ProjectWizardDialog({ mode, projectId, onClose, onSave }: ProjectWizardDialogProps) {
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [projectData, setProjectData] = useState<any>(null);

  useEffect(() => {
    if (mode === 'edit' && projectId) {
      loadProjectData();
    }
  }, [mode, projectId]);

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(ENDPOINTS.PROJECT_DETAIL(projectId!));
      const project = response.result || response;
      console.log('Loaded project data:', project);
      setProjectData(project);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    if (onSave) {
      await onSave(data);
    }
    onClose();
  };

  if (isLoading) {
    return (
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 9999, 
        background: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <ProjectWorkspace
        mode={mode}
        projectId={projectId}
        projectData={projectData}
        onClose={onClose}
        onSave={handleSave}
      />
    </div>
  );
}

export default ProjectWizardDialog;
