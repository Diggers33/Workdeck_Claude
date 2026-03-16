/**
 * Cloud File Picker Service
 * Google Drive Picker API + Microsoft OneDrive File Picker SDK
 * + Local file upload to Workdeck API (Google Cloud Storage)
 */

import { apiClient } from './api-client';
import { ENDPOINTS } from '../config/api';

export interface CloudFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  source: 'google-drive' | 'onedrive';
  iconUrl?: string;
}

// ── Environment config ───────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID   = import.meta.env.VITE_GOOGLE_CLIENT_ID   || '';
const GOOGLE_API_KEY     = import.meta.env.VITE_GOOGLE_API_KEY     || '';
const GOOGLE_APP_ID      = import.meta.env.VITE_GOOGLE_APP_ID      || '';
const ONEDRIVE_CLIENT_ID = import.meta.env.VITE_ONEDRIVE_CLIENT_ID || '';

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      // Already loaded or currently loading
      if (existing.dataset.loaded === '1') { resolve(); return; }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load: ${src}`)));
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => { el.dataset.loaded = '1'; resolve(); };
    el.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(el);
  });
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Event Attachments Persistence (localStorage) ────────────────────────────

const ATTACHMENTS_STORAGE_KEY = 'workdeck-event-attachments';

function getAllStoredAttachments(): Record<string, any[]> {
  try {
    return JSON.parse(localStorage.getItem(ATTACHMENTS_STORAGE_KEY) || '{}');
  } catch { return {}; }
}

export function getEventAttachments(eventId: string): any[] {
  return getAllStoredAttachments()[eventId] || [];
}

export function saveEventAttachments(eventId: string, attachments: any[]): void {
  const all = getAllStoredAttachments();
  if (attachments.length > 0) {
    all[eventId] = attachments;
  } else {
    delete all[eventId];
  }
  localStorage.setItem(ATTACHMENTS_STORAGE_KEY, JSON.stringify(all));
}

// ── Generic Entity File Persistence (localStorage) ──────────────────────────

const TASK_FILES_STORAGE_KEY = 'workdeck-task-files';
const PROJECT_FILES_STORAGE_KEY = 'workdeck-project-files';

function getStoredEntityFiles(storageKey: string): Record<string, any[]> {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch { return {}; }
}

export function getTaskFiles(taskId: string): any[] {
  return getStoredEntityFiles(TASK_FILES_STORAGE_KEY)[taskId] || [];
}

export function saveTaskFiles(taskId: string, files: any[]): void {
  const all = getStoredEntityFiles(TASK_FILES_STORAGE_KEY);
  if (files.length > 0) {
    all[taskId] = files;
  } else {
    delete all[taskId];
  }
  localStorage.setItem(TASK_FILES_STORAGE_KEY, JSON.stringify(all));
}

export function getProjectFiles(projectId: string): any[] {
  return getStoredEntityFiles(PROJECT_FILES_STORAGE_KEY)[projectId] || [];
}

export function saveProjectFiles(projectId: string, files: any[]): void {
  const all = getStoredEntityFiles(PROJECT_FILES_STORAGE_KEY);
  if (files.length > 0) {
    all[projectId] = files;
  } else {
    delete all[projectId];
  }
  localStorage.setItem(PROJECT_FILES_STORAGE_KEY, JSON.stringify(all));
}

// ── File Upload to Workdeck API (Google Cloud Storage) ──────────────────────

const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40 MB

export interface UploadedFile {
  id: string;          // fileId from API
  name: string;
  size: string;
  type: string;
  date: string;
  fileUrl: string;     // /queries/file/:token for download
  token: string;       // file token for building download URL
  source: 'computer';
}

/**
 * Upload a local file to Workdeck via signed Google Cloud Storage URL.
 * Flow: POST /commands/sync/upload-url → PUT file to signed URL
 */
export async function uploadFileToServer(
  file: File,
  entityId: string,
  entityType: 'tasks' | 'events' | 'projects'
): Promise<UploadedFile> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File "${file.name}" exceeds the 40 MB limit`);
  }

  // Step 1: Get signed upload URL from API
  const result = await apiClient.post<{
    id: string;
    filename: string;
    fileUrl: string;
    uploadUrl: string;
    createdAt: string;
  }>(ENDPOINTS.UPLOAD_URL, {
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    id: entityId,
    type: entityType,
  });

  // Step 2: PUT the actual file bytes to the signed URL
  await fetch(result.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });

  // Extract token from fileUrl (format: /queries/file/:token)
  const token = result.fileUrl?.split('/').pop() || '';

  return {
    id: result.id,
    name: file.name,
    size: formatFileSize(file.size),
    type: getFileType(file.name),
    date: result.createdAt || new Date().toISOString(),
    fileUrl: result.fileUrl,
    token,
    source: 'computer',
  };
}

/**
 * Fetch files for an entity from the API
 */
export async function fetchEntityFiles(
  entityId: string,
  entityType: 'tasks' | 'events' | 'projects'
): Promise<any[]> {
  const endpointFn = entityType === 'events' ? ENDPOINTS.EVENT_FILES
    : entityType === 'tasks' ? ENDPOINTS.TASK_FILES
    : ENDPOINTS.PROJECT_FILES;
  try {
    return await apiClient.get<any[]>(endpointFn(entityId));
  } catch { return []; }
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext || '')) return 'Document';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return 'Image';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) return 'Video';
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) return 'Audio';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return 'Archive';
  return 'File';
}

// ── Google Drive Picker ──────────────────────────────────────────────────────

let gPickerReady = false;
let gTokenClient: any = null;

// Track whether user has already authorized (consent given)
function hasGoogleConsent(): boolean {
  return sessionStorage.getItem('workdeck-gdrive-consented') === '1';
}

// Persist token in sessionStorage so it survives HMR reloads
function getStoredGoogleToken(): string | null {
  try {
    const stored = sessionStorage.getItem('workdeck-gdrive-token');
    if (!stored) return null;
    const { token, expiresAt } = JSON.parse(stored);
    if (Date.now() > expiresAt) {
      sessionStorage.removeItem('workdeck-gdrive-token');
      return null;
    }
    return token;
  } catch { return null; }
}

function storeGoogleToken(token: string) {
  sessionStorage.setItem('workdeck-gdrive-token', JSON.stringify({
    token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  }));
  sessionStorage.setItem('workdeck-gdrive-consented', '1');
}

async function ensureGooglePickerLoaded(): Promise<void> {
  if (gPickerReady) return;
  await loadScript('https://apis.google.com/js/api.js');
  await new Promise<void>((resolve) => {
    (window as any).gapi.load('picker', { callback: () => { gPickerReady = true; resolve(); } });
  });
}

async function ensureTokenClient(): Promise<void> {
  if (gTokenClient) return;
  await loadScript('https://accounts.google.com/gsi/client');
  gTokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.file',
    callback: () => {}, // overridden per-call
  });
}

async function getGoogleToken(): Promise<string> {
  // Return cached token if still valid
  const cached = getStoredGoogleToken();
  if (cached) return cached;

  await ensureTokenClient();

  return new Promise<string>((resolve, reject) => {
    gTokenClient.callback = (resp: any) => {
      if (resp.error) { reject(new Error(resp.error_description || resp.error)); return; }
      storeGoogleToken(resp.access_token);
      resolve(resp.access_token);
    };

    if (hasGoogleConsent()) {
      // User already consented — silently refresh without popup
      gTokenClient.requestAccessToken({ prompt: '' });
    } else {
      // First time — show consent screen
      gTokenClient.requestAccessToken();
    }
  });
}

export async function openGoogleDrivePicker(): Promise<CloudFile[]> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      'Google Drive is not configured. Set VITE_GOOGLE_CLIENT_ID in .env and add your domain to Authorized JavaScript Origins in Google Cloud Console.'
    );
  }

  await ensureGooglePickerLoaded();
  const token = await getGoogleToken();
  const g = (window as any).google;

  return new Promise<CloudFile[]>((resolve) => {
    const docsView = new g.picker.DocsView()
      .setIncludeFolders(false)
      .setSelectFolderEnabled(false);

    const builder = new g.picker.PickerBuilder()
      .addView(docsView)
      .addView(g.picker.ViewId.RECENTLY_PICKED)
      .setOAuthToken(token)
      .setTitle('Select files from Google Drive')
      .enableFeature(g.picker.Feature.MULTISELECT_ENABLED)
      .setCallback((data: any) => {
        if (data.action === g.picker.Action.PICKED) {
          resolve(data.docs.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            size: doc.sizeBytes || 0,
            mimeType: doc.mimeType || '',
            url: doc.url,
            source: 'google-drive' as const,
            iconUrl: doc.iconUrl,
          })));
        } else if (data.action === g.picker.Action.CANCEL) {
          resolve([]);
        }
      });

    if (GOOGLE_API_KEY) builder.setDeveloperKey(GOOGLE_API_KEY);
    if (GOOGLE_APP_ID) builder.setAppId(GOOGLE_APP_ID);

    builder.build().setVisible(true);
  });
}

// ── OneDrive File Picker ─────────────────────────────────────────────────────

export async function openOneDrivePicker(): Promise<CloudFile[]> {
  if (!ONEDRIVE_CLIENT_ID) {
    throw new Error(
      'OneDrive is not configured. Set VITE_ONEDRIVE_CLIENT_ID in .env and add your domain as a redirect URI (SPA) in Azure Portal.'
    );
  }

  await loadScript('https://js.live.net/v7.2/OneDrive.js');

  return new Promise<CloudFile[]>((resolve) => {
    (window as any).OneDrive.open({
      clientId: ONEDRIVE_CLIENT_ID,
      action: 'share',
      multiSelect: true,
      advanced: {
        redirectUri: window.location.origin,
      },
      success: (resp: any) => {
        resolve((resp.value || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          size: f.size || 0,
          mimeType: f.file?.mimeType || '',
          url: f.webUrl || f['@microsoft.graph.downloadUrl'] || '',
          source: 'onedrive' as const,
        })));
      },
      cancel: () => resolve([]),
      error: (err: any) => {
        console.error('OneDrive picker error:', err);
        resolve([]);
      },
    });
  });
}
