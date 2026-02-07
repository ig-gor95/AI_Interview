// Centralized Jotai configuration to prevent multiple instances
import { createStore } from 'updated-front-design/src/lib/jotai';

// Create a single store instance
export const store = createStore();

// Re-export commonly used Jotai utilities
export { useAtom, useAtomValue, useSetAtom, atom } from 'updated-front-design/src/lib/jotai';
