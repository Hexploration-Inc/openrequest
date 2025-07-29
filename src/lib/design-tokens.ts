import { HttpMethod } from './types';

/**
 * Design token utilities for consistent styling across the application
 */

export const colors = {
  brand: {
    50: 'var(--color-brand-50)',
    100: 'var(--color-brand-100)',
    500: 'var(--color-brand-500)',
    600: 'var(--color-brand-600)',
  },
  status: {
    success: 'var(--color-status-success)',
    successBg: 'var(--color-status-success-bg)',
    warning: 'var(--color-status-warning)',
    warningBg: 'var(--color-status-warning-bg)',
    error: 'var(--color-status-error)',
    errorBg: 'var(--color-status-error-bg)',
    info: 'var(--color-status-info)',
    infoBg: 'var(--color-status-info-bg)',
  },
  methods: {
    get: 'var(--color-method-get)',
    getBg: 'var(--color-method-get-bg)',
    post: 'var(--color-method-post)',
    postBg: 'var(--color-method-post-bg)',
    put: 'var(--color-method-put)',
    putBg: 'var(--color-method-put-bg)',
    delete: 'var(--color-method-delete)',
    deleteBg: 'var(--color-method-delete-bg)',
    patch: 'var(--color-method-patch)',
    patchBg: 'var(--color-method-patch-bg)',
  },
} as const;

export const spacing = {
  px: 'var(--spacing-px)',
  0: 'var(--spacing-0)',
  1: 'var(--spacing-1)',
  2: 'var(--spacing-2)',
  3: 'var(--spacing-3)',
  4: 'var(--spacing-4)',
  6: 'var(--spacing-6)',
  8: 'var(--spacing-8)',
  12: 'var(--spacing-12)',
  16: 'var(--spacing-16)',
} as const;

export const typography = {
  fontSans: 'var(--font-family-sans)',
  fontMono: 'var(--font-family-mono)',
  fontDisplay: 'var(--font-family-display)',
  weights: {
    normal: 'var(--font-weight-normal)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
    bold: 'var(--font-weight-bold)',
  },
  sizes: {
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    base: 'var(--font-size-base)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
  },
} as const;

export const shadows = {
  sm: 'var(--shadow-sm)',
  default: 'var(--shadow-default)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
} as const;

export const transitions = {
  fast: 'var(--transition-fast)',
  base: 'var(--transition-base)',
  slow: 'var(--transition-slow)',
} as const;

/**
 * Get HTTP method color classes
 */
export function getMethodColorClasses(method: HttpMethod): string {
  switch (method) {
    case 'GET':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'POST':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'PUT':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'DELETE':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'PATCH':
      return 'text-purple-700 bg-purple-50 border-purple-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

/**
 * Get HTTP status color classes
 */
export function getStatusColorClasses(status: number): string {
  if (status >= 200 && status < 300) {
    return 'text-green-800 bg-green-100';
  }
  if (status >= 300 && status < 400) {
    return 'text-yellow-800 bg-yellow-100';
  }
  if (status >= 400 && status < 500) {
    return 'text-red-800 bg-red-100';
  }
  if (status >= 500) {
    return 'text-red-800 bg-red-100';
  }
  return 'text-gray-800 bg-gray-100';
}

/**
 * Consistent button size classes
 */
export const buttonSizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
} as const;

/**
 * Consistent input size classes
 */
export const inputSizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
} as const;

/**
 * Layout constants
 */
export const layout = {
  sidebarWidthCollapsed: 'var(--sidebar-width-collapsed)',
  sidebarWidthExpanded: 'var(--sidebar-width-expanded)',
  headerHeight: 'var(--header-height)',
  tabHeight: 'var(--tab-height)',
} as const;