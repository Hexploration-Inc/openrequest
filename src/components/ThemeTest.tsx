import { useTheme } from '../lib/theme-context';

export function ThemeTest() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Theme Test Component
        </h2>
        
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Current theme: <span className="font-semibold capitalize">{theme}</span>
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This is a sample card that changes appearance based on the current theme.
              The background, text colors, and borders should all switch between light and dark modes.
            </p>
          </div>
          
          <button
            onClick={toggleTheme}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors duration-200 font-medium"
          >
            Toggle to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="h-16 bg-red-100 dark:bg-red-900 rounded border-2 border-red-300 dark:border-red-700 flex items-center justify-center">
              <span className="text-red-800 dark:text-red-200 text-xs font-medium">Red</span>
            </div>
            <div className="h-16 bg-green-100 dark:bg-green-900 rounded border-2 border-green-300 dark:border-green-700 flex items-center justify-center">
              <span className="text-green-800 dark:text-green-200 text-xs font-medium">Green</span>
            </div>
            <div className="h-16 bg-yellow-100 dark:bg-yellow-900 rounded border-2 border-yellow-300 dark:border-yellow-700 flex items-center justify-center">
              <span className="text-yellow-800 dark:text-yellow-200 text-xs font-medium">Yellow</span>
            </div>
            <div className="h-16 bg-purple-100 dark:bg-purple-900 rounded border-2 border-purple-300 dark:border-purple-700 flex items-center justify-center">
              <span className="text-purple-800 dark:text-purple-200 text-xs font-medium">Purple</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}