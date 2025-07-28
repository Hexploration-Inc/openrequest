import { create } from 'zustand';
import { HttpMethod, KeyValuePair, AuthConfig, BodyType, ApiResponse } from '../types';

export interface RequestTab {
  id: string;
  name: string;
  isUnsaved: boolean;
  requestId: string | null; // null for new unsaved requests
  collectionId: string | null;
  createdAt: string | null;
  
  // Request data
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  bodyType: BodyType;
  bodyContent: string;
  auth: AuthConfig;
  activeTab: 'params' | 'headers' | 'body' | 'auth';
  
  // Request state
  isLoading?: boolean;
  isSaving?: boolean;
  response?: ApiResponse | null;
}

interface TabsState {
  tabs: RequestTab[];
  activeTabId: string | null;
  
  // Actions
  openRequestInTab: (request: any) => void;
  openNewTab: () => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabData: (tabId: string, data: Partial<RequestTab>, markUnsaved?: boolean) => void;
  markTabAsUnsaved: (tabId: string) => void;
  markTabAsSaved: (tabId: string) => void;
  getActiveTab: () => RequestTab | null;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptyKeyValuePair = (): KeyValuePair => ({
  id: generateId(),
  key: '',
  value: '',
  enabled: true,
});

const createEmptyTab = (name = 'New Request'): RequestTab => ({
  id: generateId(),
  name,
  isUnsaved: true,
  requestId: null,
  collectionId: null,
  createdAt: null,
  method: 'GET',
  url: '',
  params: [createEmptyKeyValuePair()],
  headers: [createEmptyKeyValuePair()],
  bodyType: 'none',
  bodyContent: '',
  auth: { type: 'none', data: {} },
  activeTab: 'params',
  isLoading: false,
  isSaving: false,
  response: null,
});

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openRequestInTab: (request) => {
    const { tabs } = get();
    
    // Check if request is already open in a tab
    const existingTab = tabs.find(tab => tab.requestId === request.id);
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

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

    const newTab: RequestTab = {
      id: generateId(),
      name: request.name,
      isUnsaved: false,
      requestId: request.id,
      collectionId: request.collection_id,
      createdAt: request.created_at,
      method: request.method as HttpMethod,
      url: request.url,
      params: paramsArray,
      headers: headersArray,
      bodyType: request.body_type as BodyType || 'none',
      bodyContent: request.body_str || '',
      auth: authConfig,
      activeTab: 'params',
    };

    set({
      tabs: [...tabs, newTab],
      activeTabId: newTab.id,
    });
  },

  openNewTab: () => {
    const { tabs } = get();
    const newTab = createEmptyTab();
    
    set({
      tabs: [...tabs, newTab],
      activeTabId: newTab.id,
    });
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    
    let newActiveTabId = activeTabId;
    if (activeTabId === tabId) {
      // If closing the active tab, switch to the last remaining tab
      newActiveTabId = updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1].id : null;
    }
    
    set({
      tabs: updatedTabs,
      activeTabId: newActiveTabId,
    });
  },

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
  },

  updateTabData: (tabId, data, markUnsaved = true) => {
    const { tabs } = get();
    const updatedTabs = tabs.map(tab =>
      tab.id === tabId ? { 
        ...tab, 
        ...data, 
        isUnsaved: markUnsaved ? true : tab.isUnsaved 
      } : tab
    );
    
    set({ tabs: updatedTabs });
  },

  markTabAsUnsaved: (tabId) => {
    const { tabs } = get();
    const updatedTabs = tabs.map(tab =>
      tab.id === tabId ? { ...tab, isUnsaved: true } : tab
    );
    
    set({ tabs: updatedTabs });
  },

  markTabAsSaved: (tabId) => {
    const { tabs } = get();
    const updatedTabs = tabs.map(tab =>
      tab.id === tabId ? { ...tab, isUnsaved: false } : tab
    );
    
    set({ tabs: updatedTabs });
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find(tab => tab.id === activeTabId) || null;
  },
}));