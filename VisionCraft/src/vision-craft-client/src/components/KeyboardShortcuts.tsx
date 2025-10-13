import { useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { toast } from 'sonner';

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface KeyboardShortcutsProps {
  shortcuts: ShortcutAction[];
}

export function KeyboardShortcuts({ shortcuts }: KeyboardShortcutsProps) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const matchedShortcut = shortcuts.find((shortcut) => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matchedShortcut) {
        if (matchedShortcut.preventDefault !== false) {
          event.preventDefault();
        }
        matchedShortcut.action();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return null;
}

// Helper function to format shortcut display
export function formatShortcut(shortcut: {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}): string {
  const parts: string[] = [];
  
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
}

// Hook for using shortcuts in components
export function useKeyboardShortcuts() {
  const { setCurrentView } = useApp();

  const dashboardShortcuts: ShortcutAction[] = [
    // Help
    {
      key: '?',
      action: () => {
        const event = new CustomEvent('open-shortcuts-modal');
        window.dispatchEvent(event);
      },
      description: 'Show keyboard shortcuts'
    },

    // View Controls
    {
      key: '1',
      action: () => {
        const event = new CustomEvent('camera-preset', { detail: 'front' });
        window.dispatchEvent(event);
        toast.info('Camera: Front view');
      },
      description: 'Front view'
    },
    {
      key: '2',
      action: () => {
        const event = new CustomEvent('camera-preset', { detail: 'right' });
        window.dispatchEvent(event);
        toast.info('Camera: Right view');
      },
      description: 'Right view'
    },
    {
      key: '3',
      action: () => {
        const event = new CustomEvent('camera-preset', { detail: 'top' });
        window.dispatchEvent(event);
        toast.info('Camera: Top view');
      },
      description: 'Top view'
    },
    {
      key: '4',
      action: () => {
        const event = new CustomEvent('camera-preset', { detail: 'iso' });
        window.dispatchEvent(event);
        toast.info('Camera: Isometric view');
      },
      description: 'Isometric view'
    },
    {
      key: 'Home',
      action: () => {
        const event = new CustomEvent('camera-reset');
        window.dispatchEvent(event);
        toast.info('Camera reset');
      },
      description: 'Reset camera'
    },
    {
      key: 'f',
      action: () => {
        const event = new CustomEvent('camera-focus');
        window.dispatchEvent(event);
        toast.info('Focus on model');
      },
      description: 'Focus on model'
    },

    // Tools
    {
      key: 'm',
      action: () => {
        const event = new CustomEvent('activate-tool', { detail: 'measure' });
        window.dispatchEvent(event);
        toast.info('Measurement tool activated');
      },
      description: 'Measurement tool'
    },
    {
      key: 'a',
      action: () => {
        const event = new CustomEvent('activate-tool', { detail: 'annotate' });
        window.dispatchEvent(event);
        toast.info('Annotation tool activated');
      },
      description: 'Annotation tool'
    },
    {
      key: 's',
      action: () => {
        const event = new CustomEvent('activate-tool', { detail: 'slice' });
        window.dispatchEvent(event);
        toast.info('Slice tool activated');
      },
      description: 'Slice tool'
    },
    {
      key: 'l',
      action: () => {
        const event = new CustomEvent('activate-tool', { detail: 'layers' });
        window.dispatchEvent(event);
        toast.info('Layers panel activated');
      },
      description: 'Layers panel'
    },

    // File Operations
    {
      key: 's',
      ctrl: true,
      action: () => {
        toast.success('Project saved');
      },
      description: 'Save project'
    },
    {
      key: 'e',
      ctrl: true,
      action: () => {
        const event = new CustomEvent('open-export-modal');
        window.dispatchEvent(event);
      },
      description: 'Export model'
    },
    {
      key: 's',
      ctrl: true,
      shift: true,
      action: () => {
        const event = new CustomEvent('open-share-modal');
        window.dispatchEvent(event);
      },
      description: 'Share project'
    },
    {
      key: 'n',
      ctrl: true,
      action: () => {
        setCurrentView('create-project');
      },
      description: 'New project'
    },
    {
      key: 'i',
      ctrl: true,
      action: () => {
        const event = new CustomEvent('add-images');
        window.dispatchEvent(event);
        toast.info('Add images to dataset');
      },
      description: 'Add images'
    },
    {
      key: 'r',
      ctrl: true,
      action: () => {
        const event = new CustomEvent('regenerate-model');
        window.dispatchEvent(event);
        toast.info('Starting model regeneration...');
      },
      description: 'Regenerate model'
    },

    // Edit
    {
      key: 'z',
      ctrl: true,
      action: () => {
        toast.info('Undo last action');
      },
      description: 'Undo'
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      action: () => {
        toast.info('Redo last action');
      },
      description: 'Redo'
    },

    // Display
    {
      key: 'g',
      action: () => {
        const event = new CustomEvent('toggle-grid');
        window.dispatchEvent(event);
      },
      description: 'Toggle grid'
    },
    {
      key: 'w',
      action: () => {
        const event = new CustomEvent('toggle-wireframe');
        window.dispatchEvent(event);
      },
      description: 'Toggle wireframe'
    },
    {
      key: 'h',
      action: () => {
        const event = new CustomEvent('toggle-ui');
        window.dispatchEvent(event);
        toast.info('UI visibility toggled');
      },
      description: 'Toggle UI visibility'
    },

    // Escape
    {
      key: 'Escape',
      action: () => {
        const event = new CustomEvent('cancel-action');
        window.dispatchEvent(event);
      },
      description: 'Cancel/Close',
      preventDefault: false
    }
  ];

  return dashboardShortcuts;
}
