import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PresenterView from './components/PresenterView';
import ViewerView from './components/ViewerView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/session/:id" element={<PresenterView />} />
        <Route path="/view/:id" element={<ViewerView />} />
      </Routes>
    </BrowserRouter>
  );
}
