import React, { useState } from 'react';
import { FaUpload, FaMemory, FaBug, FaExclamationTriangle, FaCog, FaDownload } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const BasicAnalysis = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to analyze');
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/basic-analysis`, {
        method: 'POST',
        body: formData,
      });

      console.log("Response:", response);

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('analysis-content');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('valgrind-analysis.pdf');
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'memoryLeaks':
        return <FaMemory className="text-red-500" />;
      case 'invalidAccess':
        return <FaBug className="text-yellow-500" />;
      case 'uninitializedValues':
        return <FaExclamationTriangle className="text-orange-500" />;
      case 'systemCalls':
        return <FaCog className="text-blue-500" />;
      default:
        return null;
    }
  };

  const prepareChartData = (summary) => {
    if (!summary?.categoryCounts) return [];
    return Object.entries(summary.categoryCounts)
      .map(([category, count]) => ({
        name: category,
        errors: count,
      }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Basic Analysis</h2>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File for Analysis
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-700 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                  <FaUpload className="text-2xl mb-2" />
                  <span className="text-sm">
                    {file ? file.name : 'Select a file'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".c,.cpp"
                  />
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {analysis && (
          <div id="analysis-content" className="space-y-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <FaDownload /> Download Report
              </button>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-medium text-gray-600">Total Errors</h4>
                  <p className="text-2xl font-bold">{analysis.summary.totalErrors}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-medium text-gray-600">Runtime</h4>
                  <p className="text-2xl font-bold">{analysis.summary.runtime}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-medium text-gray-600">Heap Usage</h4>
                  <div className="text-sm">
                    <p>Allocations: {analysis.summary.heapUsage.allocations}</p>
                    <p>Frees: {analysis.summary.heapUsage.frees}</p>
                    <p>Bytes: {analysis.summary.heapUsage.bytesAllocated}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Error Distribution</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <BarChart data={prepareChartData(analysis.summary)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="errors" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Detailed Analysis</h3>
              {Object.entries(analysis.categories).map(([category, errors]) => (
                errors.length > 0 && (
                  <div key={category} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIcon(category)}
                      <h4 className="text-lg font-medium capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      {errors.map((error, index) => (
                        <div key={index} className="mb-2 last:mb-0">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700">
                            {error}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicAnalysis;