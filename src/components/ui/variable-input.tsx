import { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Eye, EyeOff } from 'lucide-react';
import { useEnvironmentsStore } from '../../lib/stores/environments';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}

export function VariableInput({ value, onChange, placeholder, className, type }: VariableInputProps) {
  const [showInterpolated, setShowInterpolated] = useState(false);
  const { interpolateVariables } = useEnvironmentsStore();

  const hasVariables = /\{\{.*?\}\}/.test(value);
  const interpolatedValue = hasVariables ? interpolateVariables(value) : value;
  const isInterpolated = hasVariables && value !== interpolatedValue;

  return (
    <div className="relative">
      <Input
        type={type}
        value={showInterpolated && isInterpolated ? interpolatedValue : value}
        onChange={(e) => !showInterpolated && onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className} ${hasVariables ? 'pr-10' : ''}`}
        readOnly={showInterpolated && isInterpolated}
      />
      
      {hasVariables && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isInterpolated && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setShowInterpolated(!showInterpolated)}
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-[#383838]"
              title={showInterpolated ? 'Show raw value' : 'Show interpolated value'}
            >
              {showInterpolated ? (
                <EyeOff className="h-3 w-3 text-blue-500" />
              ) : (
                <Eye className="h-3 w-3 text-blue-500" />
              )}
            </Button>
          )}
          <div className="w-2 h-2 bg-blue-500 rounded-full" title="Contains variables" />
        </div>
      )}
    </div>
  );
}