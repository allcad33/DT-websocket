import React, { useState, useEffect } from 'react';
import { apiBaseUrl } from '../config';

const CreateFolder = () => {
  const [folderName, setFolderName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(''); // 'success' or 'error'
  const [folders, setFolders] = useState([]);

  // Fetch existing folders
  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await fetch(apiBaseUrl+'/api/folders');
      const data = await response.json();
      if (data.success) {
        setFolders(data.folders);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setMessage('Please enter a folder name');
      setStatus('error');
      return;
    }

    try {
      const response = await fetch(apiBaseUrl+'/api/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderName }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Folder created successfully!');
        setStatus('success');
        setFolderName('');
        fetchFolders(); // Refresh folder list
      } else {
        setMessage(data.message || 'Error creating folder');
        setStatus('error');
      }
    } catch (error) {
      setMessage('Error creating folder: ' + error.message);
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Create New Folder</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700">
              Folder Name
            </label>
            <input
              type="text"
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter folder name"
            />
          </div>
          
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Folder
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-md ${
            status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Display existing folders */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Existing Folders</h3>
        {folders.length > 0 ? (
          <ul className="space-y-2">
            {folders.map((folder, index) => (
              <li 
                key={index}
                className="p-3 bg-gray-50 rounded-md flex justify-between items-center"
              >
                <span className="text-gray-700">{folder.name}</span>
                <span className="text-sm text-gray-500">{folder.path}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No folders created yet.</p>
        )}
      </div>
    </div>
  );
};

export default CreateFolder; 