import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BeakerIcon, 
  ArrowsRightLeftIcon, 
  AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline';

function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Valgrind UI
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A modern interface for memory debugging, memory leak detection, and profiling using Valgrind
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <FeatureCard
            title="Basic Analysis"
            description="Perform fundamental memory analysis with detailed categorization of errors and memory leaks."
            icon={BeakerIcon}
            link="/basic-analysis"
        />
        <FeatureCard
            title="Compare Files"
            description="Compare memory analysis between different versions of your code to track improvements."
            icon={ArrowsRightLeftIcon}
            link="/compare"
        />
        <FeatureCard
            title="Custom Analysis"
            description="Configure specific error types to focus on particular aspects of memory usage."
            icon={AdjustmentsHorizontalIcon}
            link="/custom-analysis"
        />
        </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-12">
        <h2 className="text-2xl font-bold mb-4">About Valgrind</h2>
        <p className="text-gray-600 mb-4">
          Valgrind is an instrumentation framework for building dynamic analysis tools. 
          It includes a set of debugging and profiling tools that can automatically detect 
          many memory management and threading bugs.
        </p>
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-xl font-semibold mb-3">Key Features</h3>
            <ul className="list-disc pl-5 text-gray-600">
              <li>Memory leak detection</li>
              <li>Memory access error detection</li>
              <li>Uninitialized value usage detection</li>
              <li>Thread error detection</li>
              <li>Heap profiling</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">Supported Error Types</h3>
            <ul className="list-disc pl-5 text-gray-600">
              <li>Memory leaks (definitely lost, indirectly lost)</li>
              <li>Invalid memory access</li>
              <li>Use of uninitialized values</li>
              <li>System call errors</li>
              <li>Invalid free() / delete / delete[]</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon: Icon, link }) {
    return (
      <Link to={link} className="block h-full">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
            <Icon className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 flex-grow">{description}</p>
        </div>
      </Link>
    );
}

export default Home;