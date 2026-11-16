import React, { useState } from 'react';
import { apiBaseUrl } from '../config';

function RawMatterial() {
  const [inputs, setInputs] = useState({
    limestone: '',
    clay: '',
    ironOre: '',
    sand: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (field, value) => {
    // Allow only numbers
    if (value === '' || /^\d+$/.test(value)) {
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all inputs are filled
    const values = [inputs.limestone, inputs.clay, inputs.ironOre, inputs.sand];
    if (values.some(val => val === '')) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const inputsString = values.join(',');
      const url = `${apiBaseUrl}/api/mqtt/publish?topic=1&message=raw_material_target&inputs=${inputsString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Material targets applied successfully!' });
        // Optionally reset form after successful submission
        // setInputs({ limestone: '', clay: '', ironOre: '', sand: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to apply material targets' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
        setTimeout(() => {
            setMessage({ type: '', text: '' });
        }, 3000);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center p-2">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            Material Targets Configuration
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Input Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {/* Limestone Target */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Limestone Target (g)
              </label>
              
              <input
                type="text"
                value={inputs.limestone}
                onChange={(e) => handleInputChange('limestone', e.target.value)}
                placeholder="Enter weight"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            {/* Clay Target */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Clay Target (g)
              </label>
              <input
                type="text"
                value={inputs.clay}
                onChange={(e) => handleInputChange('clay', e.target.value)}
                placeholder="Enter weight"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            {/* Iron Ore Target */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Iron Ore Target (g)
              </label>
              <input
                type="text"
                value={inputs.ironOre}
                onChange={(e) => handleInputChange('ironOre', e.target.value)}
                placeholder="Enter weight"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            {/* Sand Target */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Sand Target (g)
              </label>
              <input
                type="text"
                value={inputs.sand}
                onChange={(e) => handleInputChange('sand', e.target.value)}
                placeholder="Enter weight"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                required
              />
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              className={`p-2 rounded-md text-xs ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-start pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  <span>Apply Material Targets</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RawMatterial;