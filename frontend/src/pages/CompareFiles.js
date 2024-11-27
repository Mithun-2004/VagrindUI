import React, { useState } from 'react';
import axios from 'axios';
import { 
  ArrowsRightLeftIcon, 
  ExclamationCircleIcon,
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const formatCategoryTitle = (category) => {
  return category
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

const ErrorCategory = ({ title, errors }) => {
  return (
    <div className="mb-6">
      <h4 className="text-md font-medium text-gray-700 mb-2">{title}</h4>
      <div className="space-y-2">
        {errors.map((error, index) => (
          <div 
            key={index}
            className="p-3 bg-gray-50 rounded-md text-sm text-gray-600 whitespace-pre-wrap"
          >
            {error}
          </div>
        ))}
      </div>
    </div>
  );
};

function CompareFiles() {
  const [files, setFiles] = useState({ older: null, newer: null });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (version, e) => {
    setFiles(prev => ({ ...prev, [version]: e.target.files[0] }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.older || !files.newer) {
      setError('Please select both files');
      return;
    }

    const formData = new FormData();
    formData.append('files', files.older);
    formData.append('files', files.newer);

    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/compare`,
        formData
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
    setLoading(false);
  };

  const downloadPDF = async () => {
    const element = document.getElementById('comparison-result');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('valgrind-comparison.pdf');
  };

  const prepareChartData = (comparison) => {
    if (!comparison) return [];
    
    return Object.entries(comparison.categoryDifferences).map(([category, data]) => ({
      name: formatCategoryTitle(category),
      difference: data.difference,
      percentage: parseFloat(data.percentage) || 0
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Compare Files</h1>
        <p className="text-gray-600">
          Compare memory analysis results between two versions of your code.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Older Version File
              </label>
              <input
                type="file"
                onChange={(e) => handleFileChange('older', e)}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Newer Version File
              </label>
              <input
                type="file"
                onChange={(e) => handleFileChange('newer', e)}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
            </div>
          </div>
          
          {error && (
            <div className="text-red-600 text-sm flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent 
              text-sm font-medium rounded-md text-white bg-indigo-600 
              hover:bg-indigo-700 focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <ArrowsRightLeftIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Comparing...
              </>
            ) : (
              'Compare Files'
            )}
          </button>
        </form>
      </div>

      {result && (
        <div id="comparison-result" className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Comparison Results</h2>
            <button
              onClick={downloadPDF}
              className="inline-flex items-center px-4 py-2 border border-transparent 
                text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 
                hover:bg-indigo-100"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Download PDF
            </button>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Error Differences</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepareChartData(result.comparison)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="difference" name="Error Difference" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">New Errors</h3>
              {Object.entries(result.comparison.newErrors).map(([category, errors]) => (
                errors.length > 0 && (
                  <ErrorCategory
                    key={category}
                    title={formatCategoryTitle(category)}
                    errors={errors}
                  />
                )
              ))}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resolved Errors</h3>
              {Object.entries(result.comparison.resolvedErrors).map(([category, errors]) => (
                errors.length > 0 && (
                  <ErrorCategory
                    key={category}
                    title={formatCategoryTitle(category)}
                    errors={errors}
                  />
                )
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompareFiles;