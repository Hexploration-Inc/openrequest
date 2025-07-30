import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as any)?.contentEditable === 'true'
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = (shortcut.ctrlKey ?? false) === event.ctrlKey;
      const metaMatches = (shortcut.metaKey ?? false) === event.metaKey;
      const shiftMatches = (shortcut.shiftKey ?? false) === event.shiftKey;
      const altMatches = (shortcut.altKey ?? false) === event.altKey;

      // On Mac, treat metaKey as the primary modifier (Cmd key)
      // On other platforms, use ctrlKey
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const primaryModifier = isMac ? event.metaKey : event.ctrlKey;
      const shouldUsePrimaryModifier = shortcut.ctrlKey || shortcut.metaKey;

      if (keyMatches && 
          (!shouldUsePrimaryModifier || primaryModifier) &&
          shiftMatches && 
          altMatches) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export const KEYBOARD_SHORTCUTS = {
  NEW_REQUEST: { key: 'n', ctrlKey: true, description: 'New Request' },
  SAVE_REQUEST: { key: 's', ctrlKey: true, description: 'Save Request' },
  SEND_REQUEST: { key: 'Enter', ctrlKey: true, description: 'Send Request' },
  NEW_COLLECTION: { key: 'n', ctrlKey: true, shiftKey: true, description: 'New Collection' },
  CLOSE_TAB: { key: 'w', ctrlKey: true, description: 'Close Tab' },
  DUPLICATE_TAB: { key: 'd', ctrlKey: true, description: 'Duplicate Tab' },
  TOGGLE_SIDEBAR: { key: 'b', ctrlKey: true, description: 'Toggle Sidebar' },
} as const;