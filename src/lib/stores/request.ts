import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { HttpMethod, KeyValuePair, AuthConfig, BodyType, ApiResponse } from '../types';

interface RequestState {
  // Current request being built
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  bodyType: BodyType;
  bodyContent: string;
  auth: AuthConfig;
  
  // Response data
  response: ApiResponse | null;
  isLoading: boolean;
  
  // UI state
  activeTab: 'params' | 'headers' | 'body' | 'auth';
  
  // Actions
  setMethod: (method: HttpMethod) => void;
  setUrl: (url: string) => void;
  setActiveTab: (tab: 'params' | 'headers' | 'body' | 'auth') => void;
  
  // Params management
  addParam: () => void;
  updateParam: (id: string, key: string, value: string, enabled: boolean) => void;
  removeParam: (id: string) => void;
  
  // Headers management
  addHeader: () => void;
  updateHeader: (id: string, key: string, value: string, enabled: boolean) => void;
  removeHeader: (id: string) => void;
  
  // Body management
  setBodyType: (type: BodyType) => void;
  setBodyContent: (content: string) => void;
  
  // Auth management
  setAuth: (auth: AuthConfig) => void;
  
  // Send request
  sendRequest: () => Promise<void>;
  
  // Load request from saved data
  loadRequest: (request: any) => void;
  
  // Reset
  resetRequest: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptyKeyValuePair = (): KeyValuePair => ({
  id: generateId(),
  key: '',
  value: '',
  enabled: true,
});

export const useRequestStore = create<RequestState>((set, get) => ({
  // Initial state
  method: 'GET',
  url: '',
  params: [createEmptyKeyValuePair()],
  headers: [createEmptyKeyValuePair()],
  bodyType: 'none',
  bodyContent: '',
  auth: { type: 'none', data: {} },
  response: null,
  isLoading: false,
  activeTab: 'params',

  // Basic setters
  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),
  setActiveTab: (activeTab) => set({ activeTab }),

  // Params management
  addParam: () => {
    const { params } = get();
    set({ params: [...params, createEmptyKeyValuePair()] });
  },

  updateParam: (id, key, value, enabled) => {
    const { params } = get();
    const updatedParams = params.map(param =>
      param.id === id ? { ...param, key, value, enabled } : param
    );
    set({ params: updatedParams });
  },

  removeParam: (id) => {
    const { params } = get();
    if (params.length > 1) {
      set({ params: params.filter(param => param.id !== id) });
    }
  },

  // Headers management
  addHeader: () => {
    const { headers } = get();
    set({ headers: [...headers, createEmptyKeyValuePair()] });
  },

  updateHeader: (id, key, value, enabled) => {
    const { headers } = get();
    const updatedHeaders = headers.map(header =>
      header.id === id ? { ...header, key, value, enabled } : header
    );
    set({ headers: updatedHeaders });
  },

  removeHeader: (id) => {
    const { headers } = get();
    if (headers.length > 1) {
      set({ headers: headers.filter(header => header.id !== id) });
    }
  },

  // Body management
  setBodyType: (bodyType) => set({ bodyType }),
  setBodyContent: (bodyContent) => set({ bodyContent }),

  // Auth management
  setAuth: (auth) => set({ auth }),

  // Send request
  sendRequest: async () => {
    const { method, url, params, headers, bodyContent, auth } = get();
    
    if (!url.trim()) {
      throw new Error('URL is required');
    }

    set({ isLoading: true, response: null });
    
    try {
      const startTime = Date.now();
      
      // Convert params and headers to the format expected by backend
      const paramsObj: Record<string, string> = {};
      params.filter(p => p.enabled && p.key.trim()).forEach(p => {
        paramsObj[p.key] = p.value;
      });

      const headersObj: Record<string, string> = {};
      headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
        headersObj[h.key] = h.value;
      });

      // Prepare auth data
      let authType: string | undefined;
      let authData: string | undefined;
      
      if (auth.type !== 'none') {
        authType = auth.type;
        authData = JSON.stringify(auth.data);
      }

      // Only include body for methods that support it
      const bodyAllowedMethods = ['POST', 'PUT', 'PATCH'];
      const requestBody = bodyAllowedMethods.includes(method) && bodyContent ? bodyContent : null;

      const apiRequest = {
        method,
        url,
        params: paramsObj,
        headers: headersObj,
        body: requestBody,
        auth_type: authType,
        auth_data: authData,
      };

      const response = await invoke<ApiResponse>('send_api_request', {
        request: apiRequest,
      });

      const responseTime = Date.now() - startTime;
      const size = new Blob([response.body]).size;

      set({
        response: {
          ...response,
          responseTime,
          size,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Request failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Load request from saved data
  loadRequest: (request) => {
    try {
      // Parse stored params and headers
      const parsedParams = request.params ? JSON.parse(request.params) : {};
      const parsedHeaders = request.headers ? JSON.parse(request.headers) : {};
      
      // Convert to KeyValuePair arrays
      const paramsArray = Object.keys(parsedParams).length > 0 
        ? Object.entries(parsedParams).map(([key, value]) => ({
            id: generateId(),
            key,
            value: value as string,
            enabled: true,
          }))
        : [createEmptyKeyValuePair()];

      const headersArray = Object.keys(parsedHeaders).length > 0
        ? Object.entries(parsedHeaders).map(([key, value]) => ({
            id: generateId(),
            key,
            value: value as string,
            enabled: true,
          }))
        : [createEmptyKeyValuePair()];

      // Parse auth data
      let authConfig: AuthConfig = { type: 'none', data: {} };
      if (request.auth_type && request.auth_data) {
        try {
          const authData = JSON.parse(request.auth_data);
          authConfig = {
            type: request.auth_type as AuthConfig['type'],
            data: authData,
          };
        } catch (e) {
          console.warn('Failed to parse auth data:', e);
        }
      }

      set({
        method: request.method as HttpMethod,
        url: request.url,
        params: paramsArray,
        headers: headersArray,
        bodyType: request.body_type as BodyType || 'none',
        bodyContent: request.body_str || '',
        auth: authConfig,
        response: null,
        isLoading: false,
        activeTab: 'params',
      });
    } catch (error) {
      console.error('Failed to load request:', error);
    }
  },

  // Reset request
  resetRequest: () => {
    set({
      method: 'GET',
      url: '',
      params: [createEmptyKeyValuePair()],
      headers: [createEmptyKeyValuePair()],
      bodyType: 'none',
      bodyContent: '',
      auth: { type: 'none', data: {} },
      response: null,
      isLoading: false,
      activeTab: 'params',
    });
  },
}));