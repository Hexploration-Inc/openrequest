import "./App.css";
import { MainLayout } from "./components/Layout";
import { ThemeProvider } from "./lib/theme-context";
import { ThemeTest } from "./components/ThemeTest";

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <ThemeTest />
        <MainLayout />
      </div>
    </ThemeProvider>
  );
}

export default App;
