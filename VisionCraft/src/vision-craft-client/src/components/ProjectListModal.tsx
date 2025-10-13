import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FolderOpen, Trash2, Copy, ExternalLink, MoreVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useApp } from './AppContext';
import type { Project } from './AppContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:8089';

interface ProjectListModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProjectListModal({ open, onClose }: ProjectListModalProps) {
  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    setCurrentView,
  } = useApp();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh list from backend when modal opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function fetchProjects() {
      try {
        setIsRefreshing(true);
        const r = await fetch(`${API_BASE}/v1/projects`);
        if (!r.ok) throw new Error(await r.text());
        const data = (await r.json()) as Project[];
        if (cancelled) return;
        // Merge: add new or update changed
        const byId = new Map(projects.map(p => [p.id, p]));
        for (const p of data) {
          const prev = byId.get(p.id);
          if (!prev) {
            addProject(p);
          } else {
            const changed =
              prev.updatedAt !== p.updatedAt ||
              prev.status !== p.status ||
              prev.name !== p.name ||
              prev.thumbnail !== p.thumbnail ||
              prev.fileCount !== p.fileCount;
            if (changed) updateProject(p.id, p);
          }
        }
      } catch (e: any) {
        toast.error('Failed to refresh projects', { description: String(e?.message ?? e) });
      } finally {
        if (!cancelled) setIsRefreshing(false);
      }
    }
    fetchProjects();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      const r = await fetch(`${API_BASE}/v1/projects/${encodeURIComponent(projectToDelete.id)}`, {
        method: 'DELETE',
      });
      if (!r.ok) throw new Error(await r.text());
      deleteProject(projectToDelete.id);
      toast.success(`${projectToDelete.name} deleted`);
    } catch (e: any) {
      toast.error('Delete failed', { description: String(e?.message ?? e) });
    } finally {
      setProjectToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleDuplicate = async (project: Project) => {
    try {
      // Simple duplicate: create a new project with same meta (files not copied here)
      const r = await fetch(`${API_BASE}/v1/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${project.name} (Copy)`,
          description: project.description ?? '',
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const created = (await r.json()) as Project;
      addProject(created);
      toast.success(`${project.name} duplicated`);
    } catch (e: any) {
      toast.error('Duplicate failed', { description: String(e?.message ?? e) });
    }
  };

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    if (project.status === 'ready') {
      setCurrentView('dashboard');
      onClose();
    } else if (project.status === 'processing') {
      setCurrentView('processing');
      onClose();
    }
  };

  if (!open) return null;

  // Stable order: newest updated first
  const ordered = useMemo(
    () =>
      [...projects].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [projects]
  );

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-card border border-border rounded-2xl shadow-elevation-3 w-full max-w-6xl max-h[90vh] max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2>All Projects</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {ordered.length} {ordered.length === 1 ? 'project' : 'projects'}
                  {isRefreshing && <span className="ml-2 text-xs">• refreshing…</span>}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="h-[calc(90vh-140px)]">
              <div className="p-6">
                {ordered.length === 0 ? (
                  <div className="text-center py-20">
                    <FolderOpen className="w-20 h-20 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="mb-2">No Projects Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first project to get started
                    </p>
                    <Button
                      onClick={() => {
                        onClose();
                        setCurrentView('create-project');
                      }}
                    >
                      Create New Project
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ordered.map((project, index) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-elevation-2 transition-all duration-200 hover:border-primary/20"
                      >
                        {/* Thumbnail */}
                        <div className="relative h-48 bg-muted overflow-hidden">
                          {project.thumbnail ? (
                            <img
                              src={project.thumbnail}
                              alt={project.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                              <FolderOpen className="w-16 h-16 text-primary/30" />
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="absolute top-3 right-3">
                            <Badge
                              variant="secondary"
                              className={`
                                ${project.status === 'ready' ? 'bg-accent/90 text-white border-accent' : ''}
                                ${project.status === 'processing' ? 'bg-primary/90 text-white border-primary' : ''}
                                ${project.status === 'error' ? 'bg-destructive/90 text-white border-destructive' : ''}
                              `}
                            >
                              {project.status}
                            </Badge>
                          </div>

                          {/* Actions Menu */}
                          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="rounded-full bg-background/90 backdrop-blur-sm"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => handleOpenProject(project)}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Open Viewer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(project)}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(project)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h3 className="mb-1 truncate">{project.name}</h3>
                          {project.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {project.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                            <span>{project.fileCount || 0} files</span>
                            <span>
                              {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                            </span>
                          </div>

                          <Button
                            className="w-full"
                            onClick={() => handleOpenProject(project)}
                            disabled={project.status === 'error'}
                          >
                            {project.status === 'ready'
                              ? 'Open Viewer'
                              : project.status === 'processing'
                              ? 'View Progress'
                              : 'Cannot Open'}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
