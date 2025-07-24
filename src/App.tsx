import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Button } from "./components/ui/button";

function App() {
  return (
    <div>
      <Button variant={"link"} size={"lg"}>
        Hello World
      </Button>
    </div>
  );
}

export default App;
