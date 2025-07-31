import { useState, useEffect, useMemo } from 'react';
import { useEnvironmentsStore } from '../../lib/stores/environments';
import { Environment, EnvironmentVariable } from '../../lib/types';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { KeyValueEditor } from '../RequestBuilder/KeyValueEditor';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';

interface EnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  environmentId?: string | null;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function EnvironmentModal({ isOpen, onClose, environmentId }: EnvironmentModalProps) {
  const {
    environments,
    globalVariables,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setGlobalVariables,
  } = useEnvironmentsStore();

  const [activeTab, setActiveTab] = useState('environments');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [editingGlobalVariables, setEditingGlobalVariables] = useState<EnvironmentVariable[]>([]);

  const environment = useMemo(() => {
    return selectedEnvironment 
      ? environments.find(env => env.id === selectedEnvironment)
      : null;
  }, [environments, selectedEnvironment]);

  useEffect(() => {
    if (isOpen) {
      setEditingGlobalVariables([...globalVariables]);
      if (environmentId) {
        setSelectedEnvironment(environmentId);
        setActiveTab('environments');
      } else if (environments.length > 0) {
        setSelectedEnvironment(environments[0].id);
      }
    }
  }, [isOpen, environmentId, environments, globalVariables]);

  const handleCreateEnvironment = async () => {
    if (!newEnvironmentName.trim()) return;

    const newEnvironment: Environment = {
      id: generateId(),
      name: newEnvironmentName.trim(),
      variables: []
    };

    await addEnvironment(newEnvironment);
    setSelectedEnvironment(newEnvironment.id);
    setNewEnvironmentName('');
  };

  const handleDeleteEnvironment = async (id: string) => {
    if (selectedEnvironment === id) {
      setSelectedEnvironment(null);
    }
    await deleteEnvironment(id);
  };

  const handleEnvironmentVariableChange = (variables: EnvironmentVariable[]) => {
    if (environment) {
      updateEnvironment(environment.id, { ...environment, variables });
    }
  };

  const handleSaveGlobalVariables = () => {
    setGlobalVariables(editingGlobalVariables);
    onClose();
  };

  const toggleVariableSecrecy = (variableId: string, isEnvironmentVariable: boolean) => {
    if (isEnvironmentVariable && environment) {
      const updatedVariables = environment.variables.map(variable =>
        variable.id === variableId 
          ? { ...variable, isSecret: !variable.isSecret }
          : variable
      );
      handleEnvironmentVariableChange(updatedVariables);
    } else {
      const updatedVariables = editingGlobalVariables.map(variable =>
        variable.id === variableId 
          ? { ...variable, isSecret: !variable.isSecret }
          : variable
      );
      setEditingGlobalVariables(updatedVariables);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Environments"
      size="medium"
    >
      <div className="max-h-[70vh]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Simple Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-[#404040] mb-4">
            <TabsList className="w-full bg-gray-50 dark:bg-[#2d2d2d] p-1 rounded-lg">
              <TabsTrigger 
                value="environments" 
                className="flex-1 text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1f1f1f] data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm rounded"
              >
                Environments
              </TabsTrigger>
              <TabsTrigger 
                value="globals" 
                className="flex-1 text-xs py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1f1f1f] data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm rounded"
              >
                Global Variables
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="environments" className="m-0 space-y-4">
            {/* Create New Environment */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-[#e8eaed] mb-2">
                Create New Environment
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Environment name"
                  value={newEnvironmentName}
                  onChange={(e) => setNewEnvironmentName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateEnvironment()}
                  className="flex-1 h-8 text-sm"
                />
                <Button 
                  onClick={handleCreateEnvironment}
                  disabled={!newEnvironmentName.trim()}
                  size="sm"
                  className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create
                </Button>
              </div>
            </div>

            {/* Environment List */}
            {environments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-[#e8eaed] mb-2">
                  Environments ({environments.length})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {environments.map((env) => (
                    <div
                      key={env.id}
                      className={`group flex items-center justify-between p-2 rounded border transition-colors cursor-pointer ${
                        selectedEnvironment === env.id
                          ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-[#404040] hover:bg-gray-50 dark:hover:bg-[#383838]'
                      }`}
                      onClick={() => setSelectedEnvironment(env.id)}
                    >
                      <span className={`text-sm font-medium truncate ${
                        selectedEnvironment === env.id
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-[#e8eaed]'
                      }`}>
                        {env.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEnvironment(env.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-opacity"
                        title="Delete environment"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Environment Variables */}
            {environment ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-[#e8eaed]">
                    Variables for "{environment.name}"
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-[#9aa0a6]">
                    {environment.variables.filter(v => v.enabled).length} active
                  </span>
                </div>
                <div className="border border-gray-200 dark:border-[#404040] rounded-lg">
                  <KeyValueEditor
                    data={environment.variables}
                    onChange={handleEnvironmentVariableChange}
                    showEnabled={true}
                    placeholder={{ key: 'Variable name', value: 'Variable value' }}
                    renderActions={(variable) => (
                      <button
                        onClick={() => toggleVariableSecrecy(variable.id, true)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-[#383838] rounded transition-colors"
                        title={variable.isSecret ? 'Show value' : 'Hide value (secret)'}
                      >
                        {variable.isSecret ? (
                          <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-gray-500" />
                        )}
                      </button>
                    )}
                  />
                </div>
              </div>
            ) : environments.length > 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-[#9aa0a6]">
                <div className="text-2xl mb-2">🔧</div>
                <p className="text-sm">Select an environment above to edit its variables</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-[#9aa0a6]">
                <div className="text-2xl mb-2">🌍</div>
                <p className="text-sm">Create your first environment to get started</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="globals" className="m-0 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-[#e8eaed] mb-1">
                Global Variables
              </h3>
              <p className="text-xs text-gray-600 dark:text-[#9aa0a6] mb-3">
                Available across all environments and requests.
              </p>
            </div>

            <div className="border border-gray-200 dark:border-[#404040] rounded-lg">
              <KeyValueEditor
                data={editingGlobalVariables}
                onChange={setEditingGlobalVariables}
                showEnabled={true}
                placeholder={{ key: 'Variable name', value: 'Variable value' }}
                renderActions={(variable) => (
                  <button
                    onClick={() => toggleVariableSecrecy(variable.id, false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-[#383838] rounded transition-colors"
                    title={variable.isSecret ? 'Show value' : 'Hide value (secret)'}
                  >
                    {variable.isSecret ? (
                      <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-gray-500" />
                    )}
                  </button>
                )}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSaveGlobalVariables}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Global Variables
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Modal>
  );
}