import "./App.css";
import { MainLayout } from "./components/Layout";
import { ThemeProvider } from "./lib/theme-context";

function App() {
  return (
    <ThemeProvider>
      <MainLayout />
    </ThemeProvider>
  );
}

export default App;
