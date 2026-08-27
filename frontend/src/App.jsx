import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home       from "./components/Home.jsx";
import Processing from "./components/Processing.jsx";
import Results    from "./components/Results.jsx";
import Checklist  from "./components/Checklist.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/"                  element={<Home />}       />
      <Route path="/processing"        element={<Processing />} />
      <Route path="/results/:id"       element={<Results />}    />
      <Route path="/checklist/:id"     element={<Checklist />}  />
      <Route path="*"                  element={<Navigate to="/" replace />} />
    </Routes>
  );
}
