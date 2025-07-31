import { create } from 'zustand';
import { Environment, EnvironmentVariable } from '../types';

interface EnvironmentsState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  globalVariables: EnvironmentVariable[];
  
  // Actions
  setEnvironments: (environments: Environment[]) => void;
  addEnvironment: (environment: Environment) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
  setActiveEnvironment: (id: string | null) => void;
  getActiveEnvironment: () => Environment | null;
  
  // Variable actions
  addVariableToEnvironment: (environmentId: string, variable: EnvironmentVariable) => void;
  updateEnvironmentVariable: (environmentId: string, variableId: string, updates: Partial<EnvironmentVariable>) => void;
  deleteEnvironmentVariable: (environmentId: string, variableId: string) => void;
  
  // Global variables
  setGlobalVariables: (variables: EnvironmentVariable[]) => void;
  addGlobalVariable: (variable: EnvironmentVariable) => void;
  updateGlobalVariable: (variableId: string, updates: Partial<EnvironmentVariable>) => void;
  deleteGlobalVariable: (variableId: string) => void;
  
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

  setEnvironments: (environments) => {
    set({ environments });
  },

  addEnvironment: (environment) => {
    const { environments } = get();
    set({ environments: [...environments, environment] });
  },

  updateEnvironment: (id, updates) => {
    const { environments } = get();
    const updatedEnvironments = environments.map(env =>
      env.id === id ? { ...env, ...updates } : env
    );
    set({ environments: updatedEnvironments });
  },

  deleteEnvironment: (id) => {
    const { environments, activeEnvironmentId } = get();
    const updatedEnvironments = environments.filter(env => env.id !== id);
    const newActiveId = activeEnvironmentId === id ? null : activeEnvironmentId;
    set({ 
      environments: updatedEnvironments,
      activeEnvironmentId: newActiveId 
    });
  },

  setActiveEnvironment: (id) => {
    set({ activeEnvironmentId: id });
  },

  getActiveEnvironment: () => {
    const { environments, activeEnvironmentId } = get();
    return environments.find(env => env.id === activeEnvironmentId) || null;
  },

  addVariableToEnvironment: (environmentId, variable) => {
    const { environments } = get();
    const updatedEnvironments = environments.map(env =>
      env.id === environmentId
        ? { ...env, variables: [...env.variables, variable] }
        : env
    );
    set({ environments: updatedEnvironments });
  },

  updateEnvironmentVariable: (environmentId, variableId, updates) => {
    const { environments } = get();
    const updatedEnvironments = environments.map(env =>
      env.id === environmentId
        ? {
            ...env,
            variables: env.variables.map(variable =>
              variable.id === variableId ? { ...variable, ...updates } : variable
            ),
          }
        : env
    );
    set({ environments: updatedEnvironments });
  },

  deleteEnvironmentVariable: (environmentId, variableId) => {
    const { environments } = get();
    const updatedEnvironments = environments.map(env =>
      env.id === environmentId
        ? {
            ...env,
            variables: env.variables.filter(variable => variable.id !== variableId),
          }
        : env
    );
    set({ environments: updatedEnvironments });
  },

  setGlobalVariables: (variables) => {
    set({ globalVariables: variables });
  },

  addGlobalVariable: (variable) => {
    const { globalVariables } = get();
    set({ globalVariables: [...globalVariables, variable] });
  },

  updateGlobalVariable: (variableId, updates) => {
    const { globalVariables } = get();
    const updatedVariables = globalVariables.map(variable =>
      variable.id === variableId ? { ...variable, ...updates } : variable
    );
    set({ globalVariables: updatedVariables });
  },

  deleteGlobalVariable: (variableId) => {
    const { globalVariables } = get();
    const updatedVariables = globalVariables.filter(variable => variable.id !== variableId);
    set({ globalVariables: updatedVariables });
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