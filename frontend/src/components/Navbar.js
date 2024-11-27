import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'bg-indigo-700' : '';
  };

  return (
    <nav className="bg-indigo-600 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <span className="text-white text-xl font-bold">Valgrind UI</span>
          </Link>
          
          <div className="flex space-x-4">
            <Link
              to="/"
              className={`text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 ${isActive('/')}`}
            >
              Home
            </Link>
            <Link
              to="/basic-analysis"
              className={`text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 ${isActive('/basic-analysis')}`}
            >
              Basic Analysis
            </Link>
            <Link
              to="/compare"
              className={`text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 ${isActive('/compare')}`}
            >
              Compare Files
            </Link>
            <Link
              to="/custom-analysis"
              className={`text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 ${isActive('/custom-analysis')}`}
            >
              Custom Analysis
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;