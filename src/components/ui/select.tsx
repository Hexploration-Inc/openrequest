import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'minimal';
}

export function Select({ 
  value, 
  onValueChange, 
  options, 
  placeholder = "Select option...",
  className = "",
  disabled = false,
  variant = 'default'
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'POST': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'PUT': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'DELETE': return 'text-red-600 bg-red-50 border-red-200';
      case 'PATCH': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'HEAD': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'OPTIONS': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const isMethodSelect = options.some(opt => ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(opt.value));

  const getMinimalMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-emerald-600 dark:text-emerald-400';
      case 'POST': return 'text-blue-600 dark:text-blue-400';
      case 'PUT': return 'text-amber-600 dark:text-amber-400';
      case 'DELETE': return 'text-red-600 dark:text-red-400';
      case 'PATCH': return 'text-purple-600 dark:text-purple-400';
      case 'HEAD': return 'text-slate-600 dark:text-slate-400';
      case 'OPTIONS': return 'text-slate-600 dark:text-slate-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  if (variant === 'minimal') {
    return (
      <div ref={selectRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            flex items-center gap-1.5 px-2 py-1.5 text-sm font-semibold
            bg-transparent border border-slate-200 dark:border-[#404040]
            rounded-md
            transition-all duration-200
            ${disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'hover:bg-slate-50 dark:hover:bg-[#2a2a2a] hover:border-slate-300 dark:hover:border-[#505050] focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-[#505050]'
            }
            ${isOpen ? 'bg-slate-50 dark:bg-[#2a2a2a] border-slate-300 dark:border-[#505050]' : ''}
            ${isMethodSelect && selectedOption ? getMinimalMethodColor(selectedOption.value) : 'text-slate-700 dark:text-[#e8eaed]'}
          `}
        >
          <span className="min-w-0">
            {selectedOption?.value || placeholder}
          </span>
          <ChevronDown 
            className={`w-3 h-3 opacity-60 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isOpen && (
          <div className="absolute z-[60] top-full left-0 mt-1 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#404040] rounded-md shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 min-w-[80px]">
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-3 py-1.5 text-sm font-semibold text-left
                    transition-colors duration-150
                    ${value === option.value 
                      ? 'bg-slate-100 dark:bg-[#2a2a2a]' 
                      : 'hover:bg-slate-50 dark:hover:bg-[#2a2a2a]'
                    }
                    ${isMethodSelect ? getMinimalMethodColor(option.value) : 'text-slate-700 dark:text-[#e8eaed]'}
                  `}
                >
                  <span>{option.value}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          px-3 h-10 text-sm font-medium
          bg-white dark:bg-[#1e1e1e] border border-slate-300 dark:border-[#404040]
          rounded-lg
          transition-all duration-200
          ${disabled 
            ? 'cursor-not-allowed opacity-50 bg-slate-50 dark:bg-[#2a2a2a]' 
            : 'hover:border-slate-400 dark:hover:border-[#505050] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500'
          }
          ${isOpen ? 'border-orange-500 ring-2 ring-orange-500/20' : ''}
        `}
      >
        <span className={`flex items-center gap-2 ${
          selectedOption ? 'text-slate-900 dark:text-[#e8eaed]' : 'text-slate-500 dark:text-[#9aa0a6]'
        }`}>
          {isMethodSelect && selectedOption && (
            <span className={`px-2 py-1 text-xs font-bold rounded border ${getMethodColor(selectedOption.value)}`}>
              {selectedOption.value}
            </span>
          )}
          {!isMethodSelect && (selectedOption?.label || placeholder)}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 dark:text-[#9aa0a6] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-[60] w-full mt-1 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#404040] rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full flex items-center justify-between
                  px-3 py-2.5 text-sm text-left
                  transition-colors duration-150
                  ${value === option.value 
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' 
                    : 'text-slate-900 dark:text-[#e8eaed] hover:bg-slate-50 dark:hover:bg-[#2a2a2a]'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  {isMethodSelect && (
                    <span className={`px-2 py-1 text-xs font-bold rounded border ${getMethodColor(option.value)}`}>
                      {option.value}
                    </span>
                  )}
                  {!isMethodSelect && option.label}
                </span>
                {value === option.value && (
                  <Check className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}