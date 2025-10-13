import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, FolderOpen, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { useApp, type Project } from './AppContext';
import { formatDistanceToNow } from 'date-fns';

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:8089';

export function ProjectsSidebar() {
  const { projects, addProject, updateProject, setCurrentProject, currentProject, setCurrentView } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ---- fetch & live-refresh projects from backend ----
  const pollRef = useRef<number | null>(null);

  const mergeProjects = (incoming: Project[]) => {
    const existingById = new Map(projects.map(p => [p.id, p]));
    for (const p of incoming) {
      const prev = existingById.get(p.id);
      if (!prev) {
        // new to client — add
        addProject(p);
      } else {
        // existing — update if anything changed
        const changed =
          prev.updatedAt !== p.updatedAt ||
          prev.status !== p.status ||
          prev.name !== p.name ||
          prev.thumbnail !== p.thumbnail ||
          prev.fileCount !== p.fileCount;
        if (changed) updateProject(p.id, p);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchOnce() {
      try {
        const r = await fetch(`${API_BASE}/v1/projects`, { credentials: 'omit' });
        if (!r.ok) return;
        const data = (await r.json()) as Project[];
        if (!cancelled && Array.isArray(data)) mergeProjects(data);
      } catch {
        // ignore network blips
      }
    }

    // initial load
    fetchOnce();

    // poll every 5s
    pollRef.current = window.setInterval(fetchOnce, 5000);

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // ---- filters/search ----
  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(q) ||
        (project.description?.toLowerCase().includes(q) ?? false);
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="w-4 h-4 text-accent" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'ready':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'processing':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="w-80 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3>Projects</h3>
          <Button
            size="sm"
            onClick={() => setCurrentView('create-project')}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'ready', 'processing', 'draft'].map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={statusFilter === filter ? 'default' : 'outline'}
              onClick={() => setStatusFilter(filter)}
              className="flex-1 text-xs"
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <motion.button
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  setCurrentProject(project);
                  if (project.status === 'ready') {
                    setCurrentView('dashboard');
                  } else if (project.status === 'processing') {
                    setCurrentView('processing');
                  }
                }}
                className={`
                  w-full text-left rounded-lg overflow-hidden transition-all duration-200
                  hover:shadow-md group
                  ${currentProject?.id === project.id ? 'ring-2 ring-primary' : ''}
                `}
              >
                {/* Thumbnail */}
                <div className="relative h-32 bg-muted overflow-hidden">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                      <FolderOpen className="w-12 h-12 text-primary/30" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="secondary"
                      className={`${getStatusColor(project.status)} text-xs gap-1`}
                    >
                      {getStatusIcon(project.status)}
                      {project.status}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 bg-card border border-border group-hover:border-primary/20 transition-colors">
                  <h4 className="text-sm mb-1 truncate">{project.name}</h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project.fileCount || 0} files</span>
                    <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
