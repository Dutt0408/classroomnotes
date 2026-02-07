// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationForm from './RegistrationForm';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/register/:token" element={<RegistrationForm />} />
          <Route path="/" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center p-8">
                <div className="h-20 w-20 mx-auto mb-6 flex items-center justify-center bg-blue-100 rounded-full">
                  <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Ravisabha Registration Portal</h1>
                <p className="text-gray-600 mb-6">Scan a QR code to register for Ravisabha activities</p>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-700">
                    <strong>How to register:</strong><br />
                    1. Get a QR code from a Ravisabha volunteer<br />
                    2. Scan the QR code with your phone camera<br />
                    3. Fill out the registration form<br />
                    4. Submit and wait for confirmation
                  </p>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;