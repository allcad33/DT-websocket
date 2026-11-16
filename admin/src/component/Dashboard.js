import React, { useState, useEffect } from 'react';
import FolderView from './FolderView';
import { apiBaseUrl, ignoreFolders, pocName } from '../config';

const Dashboard = ({isAuthenticated, onAuthChange }) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [loginCredentials, setLoginCredentials] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      onAuthChange(true);
      fetchFolders();
    }
  }, [onAuthChange]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(apiBaseUrl+'/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginCredentials),
      });
      
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('authToken', data.user.id);
        onAuthChange(true);
        fetchFolders();
      } else {
        setError('Login failed: ' + data.error);
      }
    } catch (error) {
      setError('Login error: ' + error.message);
    }
  };

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiBaseUrl+'/api/folders');
      const data = await response.json();
      if (data.success) {
        setFolders(data.folders);
      } else {
        setError('Failed to fetch folders');
      }
    } catch (error) {
      setError('Error fetching folders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (folderName) => {
    setDeleteConfirm(folderName);
  };

  const handleDeleteConfirm = async (folderName) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/folder/${folderName}`,
        {
          method: 'DELETE',
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setFolders(folders.filter(folder => folder.name !== folderName));
      } else {
        setError('Failed to delete folder: ' + data.error);
      }
    } catch (error) {
      setError('Error deleting folder: ' + error.message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const filteredFolders = folders
    .filter(folder => !ignoreFolders.includes(folder.name))
    .filter(folder => 
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div>
            <img src={"/allcad_logo-1-200x52.png"} alt="logo" className="h-10 w-50 mx-auto" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to API Dashboard
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={loginCredentials.username}
                  onChange={(e) => setLoginCredentials({...loginCredentials, username: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={loginCredentials.password}
                  onChange={(e) => setLoginCredentials({...loginCredentials, password: e.target.value})}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg shadow-sm">
        {error}
      </div>
    );
  }

  if (selectedFolder) {
    return <FolderView 
      folderName={selectedFolder} 
      onBack={() => setSelectedFolder(null)} 
    />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Folder Overview</h2>
            <p className="text-gray-600 mt-1">Total Folders: {filteredFolders.length}</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Folders View */}
      {viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFolders.map((folder, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{folder.name}</h3>
                      <p className="text-sm text-gray-500">{folder.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedFolder(folder.name)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="View folder contents"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredFolders.map((folder, index) => (
              <div
                key={index}
                className="p-4 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">{folder.name}</h3>
                      <p className="text-sm text-gray-500">{folder.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedFolder(folder.name)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="View folder contents"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredFolders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No folders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search query.' : 'Create some folders to get started!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 