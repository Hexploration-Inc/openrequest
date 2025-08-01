import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { Environment, EnvironmentVariable } from '../types';

interface EnvironmentsState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  globalVariables: EnvironmentVariable[];
  
  // Actions
  initializeEnvironments: () => Promise<void>;
  loadEnvironments: () => Promise<void>;
  loadVariables: () => Promise<void>;
  setEnvironments: (environments: Environment[]) => void;
  addEnvironment: (name: string) => Promise<void>;
  updateEnvironment: (id: string, updates: { name?: string }) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActiveEnvironment: (id: string | null) => Promise<void>;
  getActiveEnvironment: () => Environment | null;
  
  // Variable actions
  addVariableToEnvironment: (environmentId: string, key: string, value: string, isSecret?: boolean) => Promise<void>;
  updateEnvironmentVariable: (variableId: string, updates: { key?: string; value?: string; isSecret?: boolean }) => Promise<void>;
  deleteEnvironmentVariable: (variableId: string) => Promise<void>;
  
  // Global variables
  setGlobalVariables: (variables: EnvironmentVariable[]) => void;
  addGlobalVariable: (key: string, value: string, isSecret?: boolean) => Promise<void>;
  updateGlobalVariable: (variableId: string, updates: { key?: string; value?: string; isSecret?: boolean }) => Promise<void>;
  deleteGlobalVariable: (variableId: string) => Promise<void>;
  
  // Variable interpolation
  interpolateVariables: (text: string) => string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptyVariable = (): EnvironmentVariable => ({
  id: generateId(),
  key: '',
  value: '',
  enabled: true,
  isSecret: false,
});

export const useEnvironmentsStore = create<EnvironmentsState>((set, get) => ({
  environments: [],
  activeEnvironmentId: null,
  globalVariables: [],

  initializeEnvironments: async () => {
    try {
      await get().loadEnvironments();
      await get().loadVariables();
    } catch (error) {
      console.error("❌ Failed to initialize environments:", error);
      throw error;
    }
  },

  loadEnvironments: async () => {
    try {
      const environments = await invoke<any[]>("get_environments");
      const activeEnvironment = await invoke<any>("get_active_environment");
      
      // Convert backend environments to frontend format
      const convertedEnvironments: Environment[] = environments.map(env => ({
        id: env.id,
        name: env.name,
        variables: [], // Will be populated when loading variables
        isActive: env.is_active,
        created_at: env.created_at,
        updated_at: env.updated_at,
      }));

      set({ 
        environments: convertedEnvironments,
        activeEnvironmentId: activeEnvironment?.id || null
      });
    } catch (error) {
      console.error("❌ Failed to load environments:", error);
      throw error;
    }
  },

  loadVariables: async () => {
    try {
      // Load global variables
      const globalVariables = await invoke<any[]>("get_variables", { environmentId: null });
      
      // Convert backend variables to frontend format
      const convertedGlobalVariables: EnvironmentVariable[] = globalVariables.map(variable => ({
        id: variable.id,
        key: variable.key,
        value: variable.value,
        enabled: true, // Variables from DB are enabled by default
        isSecret: variable.is_secret,
      }));

      // Load variables for each environment
      const { environments } = get();
      const updatedEnvironments: Environment[] = [];

      for (const env of environments) {
        const envVariables = await invoke<any[]>("get_variables", { environmentId: env.id });
        const convertedEnvVariables: EnvironmentVariable[] = envVariables.map(variable => ({
          id: variable.id,
          key: variable.key,
          value: variable.value,
          enabled: true,
          isSecret: variable.is_secret,
        }));

        updatedEnvironments.push({
          ...env,
          variables: convertedEnvVariables,
        });
      }

      set({ 
        globalVariables: convertedGlobalVariables,
        environments: updatedEnvironments 
      });
    } catch (error) {
      console.error("❌ Failed to load variables:", error);
      throw error;
    }
  },

  setEnvironments: (environments) => {
    set({ environments });
  },

  addEnvironment: async (name: string) => {
    try {
      await invoke("create_environment", { name });
      await get().loadEnvironments();
    } catch (error) {
      console.error("❌ Failed to create environment:", error);
      throw error;
    }
  },

  updateEnvironment: async (id: string, updates: { name?: string }) => {
    try {
      const { environments } = get();
      const environment = environments.find(env => env.id === id);
      if (!environment) throw new Error("Environment not found");

      const updatedEnv = { ...environment, ...updates };
      await invoke("update_environment", { environment: updatedEnv });
      await get().loadEnvironments();
    } catch (error) {
      console.error("❌ Failed to update environment:", error);
      throw error;
    }
  },

  deleteEnvironment: async (id: string) => {
    try {
      await invoke("delete_environment", { id });
      await get().loadEnvironments();
    } catch (error) {
      console.error("❌ Failed to delete environment:", error);
      throw error;
    }
  },

  setActiveEnvironment: async (id: string | null) => {
    try {
      if (id) {
        await invoke("set_active_environment", { id });
      } else {
        // Clear active environment
        await invoke("clear_active_environment");
      }
      await get().loadEnvironments();
    } catch (error) {
      console.error("❌ Failed to set active environment:", error);
      throw error;
    }
  },

  getActiveEnvironment: () => {
    const { environments, activeEnvironmentId } = get();
    return environments.find(env => env.id === activeEnvironmentId) || null;
  },

  addVariableToEnvironment: async (environmentId: string, key: string, value: string, isSecret = false) => {
    try {
      await invoke("create_variable", {
        environmentId: environmentId,
        key,
        value,
        isSecret: isSecret
      });
      await get().loadVariables();
    } catch (error) {
      console.error("❌ Failed to add environment variable:", error);
      throw error;
    }
  },

  updateEnvironmentVariable: async (variableId: string, updates: { key?: string; value?: string; isSecret?: boolean }) => {
    try {
      // Find the variable to get current data
      const { environments, globalVariables } = get();
      let variable = globalVariables.find(v => v.id === variableId);
      let environmentId: string | null = null;
      
      if (!variable) {
        for (const env of environments) {
          const found = env.variables.find(v => v.id === variableId);
          if (found) {
            variable = found;
            environmentId = env.id;
            break;
          }
        }
      }
      
      if (!variable) throw new Error("Variable not found");
      
      const updatedVariable = {
        id: variable.id,
        environment_id: environmentId,
        key: updates.key ?? variable.key,
        value: updates.value ?? variable.value,
        is_secret: updates.isSecret ?? variable.isSecret ?? false,
        created_at: (variable as any).created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await invoke("update_variable", { variable: updatedVariable });
      await get().loadVariables();
    } catch (error) {
      console.error("❌ Failed to update variable:", error);
      throw error;
    }
  },

  deleteEnvironmentVariable: async (variableId: string) => {
    try {
      await invoke("delete_variable", { id: variableId });
      await get().loadVariables();
    } catch (error) {
      console.error("❌ Failed to delete environment variable:", error);
      throw error;
    }
  },

  setGlobalVariables: (variables) => {
    set({ globalVariables: variables });
  },

  addGlobalVariable: async (key: string, value: string, isSecret = false) => {
    try {
      await invoke("create_variable", {
        environmentId: null,
        key,
        value,
        isSecret: isSecret
      });
      await get().loadVariables();
    } catch (error) {
      console.error("❌ Failed to add global variable:", error);
      throw error;
    }
  },

  updateGlobalVariable: async (variableId: string, updates: { key?: string; value?: string; isSecret?: boolean }) => {
    try {
      const { globalVariables } = get();
      const variable = globalVariables.find(v => v.id === variableId);
      if (!variable) throw new Error("Global variable not found");
      
      const updatedVariable = {
        id: variable.id,
        environment_id: null,
        key: updates.key ?? variable.key,
        value: updates.value ?? variable.value,
        is_secret: updates.isSecret ?? variable.isSecret ?? false,
        created_at: (variable as any).created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await invoke("update_variable", { variable: updatedVariable });
      await get().loadVariables();
    } catch (error) {
      console.error("❌ Failed to update global variable:", error);
      throw error;
    }
  },

  deleteGlobalVariable: async (variableId: string) => {
    try {
      await invoke("delete_variable", { id: variableId });
      await get().loadVariables();
    } catch (error) {
      console.error("❌ Failed to delete global variable:", error);
      throw error;
    }
  },

  interpolateVariables: (text: string) => {
    const { environments, activeEnvironmentId, globalVariables } = get();
    const activeEnvironment = environments.find(env => env.id === activeEnvironmentId);
    
    let result = text;
    
    // Replace environment variables first (they take precedence)
    if (activeEnvironment) {
      activeEnvironment.variables.forEach(variable => {
        if (variable.enabled && variable.key) {
          const regex = new RegExp(`{{\\s*${variable.key}\\s*}}`, 'g');
          result = result.replace(regex, variable.value);
        }
      });
    }
    
    // Replace global variables
    globalVariables.forEach(variable => {
      if (variable.enabled && variable.key) {
        const regex = new RegExp(`{{\\s*${variable.key}\\s*}}`, 'g');
        result = result.replace(regex, variable.value);
      }
    });
    
    return result;
  },
}));