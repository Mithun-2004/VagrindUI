import React, { useState } from 'react';
import { FaUpload, FaMemory, FaBug, FaExclamationTriangle, FaCog, FaDownload } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CustomAnalysis = () => {
  const [file, setFile] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const errorTypes = [
    { id: 'memoryLeaks', label: 'Memory Leaks', icon: <FaMemory className="text-red-500" /> },
    { id: 'invalidAccess', label: 'Invalid Access', icon: <FaBug className="text-yellow-500" /> },
    { id: 'uninitializedValues', label: 'Uninitialized Values', icon: <FaExclamationTriangle className="text-orange-500" /> },
    { id: 'systemCalls', label: 'System Calls', icon: <FaCog className="text-blue-500" /> }
  ];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleTypeToggle = (typeId) => {
    setSelectedTypes(prev => 
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to analyze');
      return;
    }
    if (selectedTypes.length === 0) {
      setError('Please select at least one error type');
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('errorTypes', JSON.stringify(selectedTypes));

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/custom-analysis`, {
        method: 'POST',
        body: formData,
      });

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
    pdf.save('custom-analysis.pdf');
  };

  const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE'];

  const preparePieChartData = (summary) => {
    if (!summary?.categoryCounts) return [];
    return Object.entries(summary.categoryCounts).map(([category, count]) => ({
      name: category.replace(/([A-Z])/g, ' $1').trim(),
      value: count,
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Custom Analysis</h2>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="space-y-4">
            <div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Error Types to Analyze
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {errorTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeToggle(type.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border ${
                      selectedTypes.includes(type.id)
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700'
                    } hover:bg-blue-50`}
                  >
                    {type.icon}
                    <span className="text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
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
              <h3 className="text-xl font-semibold mb-4">Analysis Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow flex items-center justify-center">
                <div className="w-full max-w-sm">
                  <h4 className="font-medium text-gray-600 mb-2 text-center">Error Distribution</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={preparePieChartData(analysis.summary)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius="90%"
                          innerRadius="50%"
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {preparePieChartData(analysis.summary).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend layout="vertical" align="right" verticalAlign="middle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>


                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-medium text-gray-600 mb-2">Summary Statistics</h4>
                  <div className="space-y-2">
                    <p className="text-lg">
                      Total Errors: <span className="font-bold">{analysis.summary.totalErrors}</span>
                    </p>
                    {Object.entries(analysis.summary.categoryCounts).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Detailed Error Analysis</h3>
              <div className="space-y-4">
                {Object.entries(analysis.categories).map(([category, errors]) => (
                  errors.length > 0 && (
                    <div key={category} className="bg-white rounded-lg p-4 shadow">
                      <div className="flex items-center gap-2 mb-3">
                        {errorTypes.find(type => type.id === category)?.icon}
                        <h4 className="text-lg font-medium capitalize">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <span className="text-sm text-gray-500">({errors.length} issues)</span>
                      </div>
                      <div className="space-y-2">
                        {errors.map((error, index) => (
                          <div key={index} className="text-sm text-gray-700 border-l-4 border-blue-500 pl-3 py-1">
                            <pre className="whitespace-pre-wrap font-mono text-xs">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomAnalysis;