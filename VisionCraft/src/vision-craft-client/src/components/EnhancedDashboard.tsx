import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TopBar } from './TopBar';
import { ProjectsSidebar } from './ProjectsSidebar';
import { EnhancedThreeViewer } from './EnhancedThreeViewer';
import { EnhancedToolsPanel } from './EnhancedToolsPanel';
import { BottomToolbar } from './BottomToolbar';
import { ImageGalleryPanel } from './ImageGalleryPanel';
// If you use these, uncomment their usage below
// import { InteractiveTour } from './InteractiveTour';
// import { TourFloatingButton } from './TourFloatingButton';
import { ExportModal } from './modals/ExportModal';
import { ShareModal } from './modals/ShareModal';
import { KeyboardShortcutsModal } from './modals/KeyboardShortcutsModal';
import { KeyboardShortcuts, useKeyboardShortcuts } from './KeyboardShortcuts';
import { useApp } from './AppContext';
import * as THREE from 'three';

export interface Measurement {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  distance: number;
}

export interface Annotation {
  id: string;
  position: THREE.Vector3;
  text: string;
}

export function EnhancedDashboard() {
  // ✅ bring currentProject into scope so we can pass its modelUrl to the viewer
  const { setCurrentView, currentProject } = useApp();
  const shortcuts = useKeyboardShortcuts();

  const [modelType, setModelType] = useState('industrial');
  const [showGrid, setShowGrid] = useState(false);
  const [showShadows, setShowShadows] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
  const [modelOpacity, setModelOpacity] = useState(1);
  const [roughness, setRoughness] = useState(0.3);
  const [metalness, setMetalness] = useState(0.7);
  const [slicePosition, setSlicePosition] = useState<number | undefined>(undefined);
  const [sliceAxis, setSliceAxis] = useState<'x' | 'y' | 'z'>('y');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<string>('measure');

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Listen to keyboard shortcut events
  useEffect(() => {
    const handleToolActivation = (e: any) => setActiveTool(e.detail);
    const handleToggleGrid = () => setShowGrid(prev => !prev);
    const handleToggleWireframe = () => setShowWireframe(prev => !prev);
    const handleOpenExportModal = () => setExportModalOpen(true);
    const handleOpenShareModal = () => setShareModalOpen(true);
    const handleOpenShortcutsModal = () => setShortcutsModalOpen(true);
    const handleRegenerateModel = () => setCurrentView('processing');

    window.addEventListener('activate-tool', handleToolActivation);
    window.addEventListener('toggle-grid', handleToggleGrid);
    window.addEventListener('toggle-wireframe', handleToggleWireframe);
    window.addEventListener('open-export-modal', handleOpenExportModal);
    window.addEventListener('open-share-modal', handleOpenShareModal);
    window.addEventListener('open-shortcuts-modal', handleOpenShortcutsModal);
    window.addEventListener('regenerate-model', handleRegenerateModel);

    return () => {
      window.removeEventListener('activate-tool', handleToolActivation);
      window.removeEventListener('toggle-grid', handleToggleGrid);
      window.removeEventListener('toggle-wireframe', handleToggleWireframe);
      window.removeEventListener('open-export-modal', handleOpenExportModal);
      window.removeEventListener('open-share-modal', handleOpenShareModal);
      window.removeEventListener('open-shortcuts-modal', handleOpenShortcutsModal);
      window.removeEventListener('regenerate-model', handleRegenerateModel);
    };
  }, [setCurrentView]);

  // Tool panel handlers
  const handleAddMeasurement = () => {
    const m: Measurement = {
      id: Date.now().toString(),
      start: new THREE.Vector3(Math.random() * 2 - 1, 1, Math.random() * 2 - 1),
      end: new THREE.Vector3(Math.random() * 2 - 1, 2, Math.random() * 2 - 1),
      distance: 0,
    };
    m.distance = m.start.distanceTo(m.end);
    setMeasurements(prev => [...prev, m]);
  };

  const handleRemoveMeasurement = (id: string) =>
    setMeasurements(prev => prev.filter(m => m.id !== id));

  const handleAddAnnotation = (text: string) => {
    const a: Annotation = {
      id: Date.now().toString(),
      position: new THREE.Vector3(Math.random() * 2 - 1, 1 + Math.random(), Math.random() * 2 - 1),
      text,
    };
    setAnnotations(prev => [...prev, a]);
  };

  const handleRemoveAnnotation = (id: string) =>
    setAnnotations(prev => prev.filter(a => a.id !== id));

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      {/* Keyboard Shortcuts Handler */}
      {/* <KeyboardShortcuts shortcuts={shortcuts} /> */}

      {/* Interactive Tour */}
      {/* <InteractiveTour /> */}

      {/* Floating Tour Button */}
      {/* <TourFloatingButton /> */}

      {/* Top Bar */}
      <div data-tour="topbar">
        <TopBar
          onExport={() => setExportModalOpen(true)}
          onShare={() => setShareModalOpen(true)}
          onShortcuts={() => setShortcutsModalOpen(true)}
          onStartTour={() => {
            localStorage.removeItem('visioncraft_tour_completed');
            if ((window as any).startVisionCraftTour) (window as any).startVisionCraftTour();
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Projects */}
        <div data-tour="projects-sidebar">
          <ProjectsSidebar />
        </div>

        {/* Main Viewer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 relative"
          data-tour="viewer"
        >
          <EnhancedThreeViewer
            modelUrl={currentProject?.outputs?.modelUrl}
            modelType={modelType}
            showGrid={showGrid}
            showShadows={showShadows}
            showWireframe={showWireframe}
            opacity={modelOpacity}
            roughness={roughness}
            metalness={metalness}
            measurements={measurements}
            annotations={annotations}
            slicePosition={slicePosition}
            sliceAxis={sliceAxis}
          />

          {/* Bottom Toolbar */}
          <div data-tour="bottom-toolbar">
            <BottomToolbar />
          </div>

          {/* Image Gallery Panel */}
          <ImageGalleryPanel onRegenerateModel={() => setCurrentView('processing')} />
        </motion.div>

        {/* Right Panel - Tools */}
        <div data-tour="tools-panel">
          <EnhancedToolsPanel
            activeTool={activeTool}
            onActiveToolChange={setActiveTool}
            modelType={modelType}
            onModelTypeChange={setModelType}
            showGrid={showGrid}
            onShowGridChange={setShowGrid}
            showShadows={showShadows}
            onShowShadowsChange={setShowShadows}
            showWireframe={showWireframe}
            onShowWireframeChange={setShowWireframe}
            modelOpacity={modelOpacity}
            onModelOpacityChange={setModelOpacity}
            roughness={roughness}
            onRoughnessChange={setRoughness}
            metalness={metalness}
            onMetalnessChange={setMetalness}
            slicePosition={slicePosition}
            onSlicePositionChange={setSlicePosition}
            sliceAxis={sliceAxis}
            onSliceAxisChange={setSliceAxis}
            measurements={measurements}
            onAddMeasurement={handleAddMeasurement}
            onRemoveMeasurement={handleRemoveMeasurement}
            annotations={annotations}
            onAddAnnotation={handleAddAnnotation}
            onRemoveAnnotation={handleRemoveAnnotation}
          />
        </div>
      </div>

      {/* Modals */}
      <ExportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />
      <ShareModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} />
      <KeyboardShortcutsModal open={shortcutsModalOpen} onClose={() => setShortcutsModalOpen(false)} />
    </div>
  );
}
