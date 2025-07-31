import { useState, useRef, useEffect } from 'react';
import { useEnvironmentsStore } from '../../lib/stores/environments';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { ChevronDown, Plus, Settings } from 'lucide-react';
import { EnvironmentModal } from './EnvironmentModal';

export function EnvironmentSelector() {
  const { 
    environments, 
    activeEnvironmentId, 
    setActiveEnvironment, 
    getActiveEnvironment 
  } = useEnvironmentsStore();
  const [showModal, setShowModal] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const activeEnvironment = getActiveEnvironment();

  const environmentOptions = [
    { value: '', label: 'No Environment' },
    ...environments.map(env => ({
      value: env.id,
      label: env.name
    }))
  ];


  const handleManageEnvironments = () => {
    setEditingEnvironment('manage'); // Special flag for manage mode
    setShowModal(true);
  };

  const handleNewEnvironment = () => {
    setEditingEnvironment('new'); // Special flag for new environment
    setShowModal(true);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSelectEnvironment = (envId: string) => {
    setActiveEnvironment(envId || null);
    setShowDropdown(false);
  };

  const handleCreateNew = () => {
    setEditingEnvironment('new');
    setShowModal(true);
    setShowDropdown(false);
  };

  const handleManage = () => {
    setEditingEnvironment('manage');
    setShowModal(true);
    setShowDropdown(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="text-xs text-gray-500 dark:text-[#9aa0a6] shrink-0">
          Environment:
        </span>
        
        {/* Single Environment Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-2 px-3 py-1 text-xs bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] rounded hover:bg-gray-50 dark:hover:bg-[#383838] transition-colors min-w-0"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {activeEnvironment ? (
                <>
                  <span className="font-medium text-gray-700 dark:text-[#e8eaed] truncate">
                    {activeEnvironment.name}
                  </span>
                  {activeEnvironment.variables.length > 0 && (
                    <span className="text-gray-400 dark:text-[#5f6368] shrink-0">
                      ({activeEnvironment.variables.filter(v => v.enabled).length})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-400 dark:text-[#5f6368]">None selected</span>
              )}
            </div>
            <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`} />
          </button>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] rounded-lg shadow-lg z-50">
              {/* Environment Options */}
              <div className="py-1 max-h-48 overflow-y-auto border-b border-gray-200 dark:border-[#404040]">
                {environmentOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelectEnvironment(option.value)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-[#383838] flex items-center justify-between ${
                      (activeEnvironmentId || '') === option.value
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-[#e8eaed]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {(activeEnvironmentId || '') === option.value && (
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Actions */}
              <div className="py-1">
                <button
                  onClick={handleCreateNew}
                  className="w-full text-left px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-[#383838] flex items-center gap-2"
                >
                  <Plus className="h-3 w-3" />
                  Create New Environment
                </button>
                <button
                  onClick={handleManage}
                  className="w-full text-left px-3 py-2 text-xs text-gray-600 dark:text-[#9aa0a6] hover:bg-gray-50 dark:hover:bg-[#383838] flex items-center gap-2"
                >
                  <Settings className="h-3 w-3" />
                  Manage Environments
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <EnvironmentModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEnvironment(null);
        }}
        environmentId={editingEnvironment === 'new' || editingEnvironment === 'manage' ? null : editingEnvironment}
      />
    </>
  );
}