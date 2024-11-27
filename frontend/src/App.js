import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BasicAnalysis from './pages/BasicAnalysis';
import CompareFiles from './pages/CompareFiles';
import CustomAnalysis from './pages/CustomAnalysis';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/basic-analysis" element={<BasicAnalysis />} />
            <Route path="/compare" element={<CompareFiles />} />
            <Route path="/custom-analysis" element={<CustomAnalysis />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;