import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PhotogrammetryParams } from './EngineParams';
import {
  API_BASE,
  type Project as ApiProject,
  listProjects as apiListProjects,
  getProject as apiGetProject,
  deleteProject as apiDeleteProject,
  objectUrlFromKey,
} from '../lib/api';

// ---------------- Types kept compatible with your UI ----------------

export interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string; // used in cards
  status: 'draft' | 'processing' | 'ready' | 'error';
  createdAt: string;
  updatedAt: string;
  fileCount?: number;
  type?: 'photogrammetry' | 'lidar' | 'mixed';
  // engine info (used by CreateProjectModal -> sidebar badges etc.)
  engineId?: string;
  engineKind?: 'local' | 'saas';
  params?: PhotogrammetryParams;
  // outputs (ThreeViewer reads from here if present)
  outputs?: { key?: string; modelUrl?: string };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: string;
  projectId?: string;
  read: boolean;
}

interface AppContextType {
  // navigation
  currentView: string;
  setCurrentView: (view: string) => void;
  setProjectAndView: (project: Project | null, view?: string) => void;

  // projects
  projects: Project[];
  isLoadingProjects: boolean;
  refreshProjects: () => Promise<void>;

  addProject: (project: Project) => void;                    // still supported (optimistic insert)
  updateProject: (id: string, updates: Partial<Project>) => void; // optimistic update
  deleteProject: (id: string) => Promise<void>;              // now calls API if possible

  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // notifications (pure client-side)
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // debug
  apiBase: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --------- helpers to map server Project -> client Project ---------

function mapApiProject(p: ApiProject): Project {
  // prefer server-supplied modelUrl; otherwise build from key (if you expose a public route)
  const modelUrl =
    p.outputs?.modelUrl ?? (p.outputs?.key ? objectUrlFromKey(p.outputs.key) : undefined);

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    fileCount: p.fileCount,
    type: p.type as Project['type'],

    // keep thumbnail if your server returns it; otherwise leave undefined
    thumbnail: (p as any).thumbnail,

    outputs: { key: p.outputs?.key, modelUrl },

    // keep passthrough fields if your server returns them; harmless if undefined
    engineId: (p as any).engineId,
    engineKind: (p as any).engineKind,
    params: (p as any).params,
  };
}

// --------------------------- Provider ------------------------------

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState('landing');

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initial load
  useEffect(() => {
    refreshProjects().catch(() => void 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- API-backed actions ----

  async function refreshProjects() {
    setIsLoadingProjects(true);
    try {
      const list = await apiListProjects();
      const mapped = list.map(mapApiProject);
      setProjects(mapped);

      // keep currentProject in sync if present
      if (currentProject) {
        const updated = mapped.find(p => p.id === currentProject.id);
        if (updated) setCurrentProject(updated);
      }
    } catch (err) {
      // Non-fatal: keep UI usable even if API is down
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  }

  // keep old signature for compatibility — it’s just an optimistic insert
  const addProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    if (currentProject?.id === id) setCurrentProject({ ...currentProject, ...updates });
  };

  async function deleteProject(id: string) {
    // optimistic remove
    const prev = projects;
    setProjects(prev.filter(p => p.id !== id));
    if (currentProject?.id === id) setCurrentProject(null);

    try {
      await apiDeleteProject(id);
    } catch (e) {
      // rollback on failure
      console.error('Delete failed, rolling back:', e);
      setProjects(prev);
    }
  }

  // ---- notifications (client-only) ----

  const addNotification: AppContextType['addNotification'] = (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => setNotifications([]);

  // ---- small convenience for navigation ----

  const setProjectAndView = (project: Project | null, view?: string) => {
    setCurrentProject(project);
    if (view) setCurrentView(view);
  };

  const value: AppContextType = useMemo(
    () => ({
      currentView,
      setCurrentView,
      setProjectAndView,

      projects,
      isLoadingProjects,
      refreshProjects,

      addProject,
      updateProject,
      deleteProject,

      currentProject,
      setCurrentProject,

      notifications,
      addNotification,
      markNotificationRead,
      clearNotifications,

      apiBase: API_BASE,
    }),
    [
      currentView,
      projects,
      isLoadingProjects,
      currentProject,
      notifications,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
