import React, { useState, useEffect, useRef } from "react";
import { apiBaseUrl } from "../config";

const FolderView = ({ folderName, onBack }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFiles();
  }, [folderName]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        apiBaseUrl + `/api/folder-contents/${folderName}`
      );
      const data = await response.json();
      if (data.success) {
        setFiles(data.files);
      } else {
        setError("Failed to fetch files");
      }
    } catch (error) {
      setError("Error fetching files: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (fileName) => {
    setDeleteConfirm(fileName);
  };

  const handleDeleteConfirm = async (fileName) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/file/${folderName}/${fileName}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();

      if (data.success) {
        setFiles(files.filter((file) => file.name !== fileName));
      } else {
        setError("Failed to delete file: " + data.error);
      }
    } catch (error) {
      setError("Error deleting file: " + error.message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      await handleFileUpload({ target: { files: droppedFiles } });
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await fetch(apiBaseUrl + `/api/upload/${folderName}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        fetchFiles();
      } else {
        setError("Failed to upload files: " + data.error);
      }
    } catch (error) {
      setError("Error uploading files: " + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEditClick = async (fileName) => {
    try {
      const response = await fetch(
        apiBaseUrl +
          `/api/file-content/${folderName}/${encodeURIComponent(fileName)}`
      );
      const data = await response.json();

      if (data.success) {
        try {
          const jsonContent = JSON.parse(data.content);
          const formattedContent = JSON.stringify(jsonContent, null, 2);
          setFileContent(formattedContent);
        } catch (parseError) {
          setFileContent(data.content);
        }
        setEditingFile(fileName);
        setIsEditModalOpen(true);
      } else {
        setError("Failed to fetch file content");
      }
    } catch (error) {
      setError("Error fetching file content: " + error.message);
    }
  };

  const handleSaveContent = async () => {
    try {
      setLoading(true);
      const encodedFileName = encodeURIComponent(editingFile);

      let contentToSave = fileContent;
      try {
        const parsedContent = JSON.parse(fileContent);
        contentToSave = JSON.stringify(parsedContent);
      } catch (parseError) {
        contentToSave = fileContent;
      }

      const response = await fetch(
        apiBaseUrl + `/api/file-content/${folderName}/${encodedFileName}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: contentToSave }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setIsEditModalOpen(false);
        setEditingFile(null);
        setFileContent("");
      } else {
        setError("Failed to save file content: " + data.error);
      }
    } catch (error) {
      setError("Error saving file content: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = () => {
    // Create a temporary link element to trigger the download
    const link = document.createElement("a");
    link.href = `${apiBaseUrl}/api/download-folder/${encodeURIComponent(
      folderName
    )}`;
    link.download = `${folderName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Folders
        </button>
      </div>

      {/* Folder Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {folderName}
            </h2>
            <p className="text-gray-600 mt-1">Total Files: {files.length}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Grid View"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="List View"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />
            <button
              onClick={handleDownloadAll}
              disabled={files.length === 0}
              className={`px-4 py-2 rounded-lg text-white ${
                files.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } flex items-center gap-2 transition-colors duration-200`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download All
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`px-4 py-2 rounded-lg text-white ${
                uploading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } flex items-center gap-2 transition-colors duration-200`}
            >
              {uploading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Upload File
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Files View */}
      {viewMode === "grid" ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {file.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(file.modifiedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditClick(file.name)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit file"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    {deleteConfirm === file.name ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteConfirm(file.name)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Confirm delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={handleDeleteCancel}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          title="Cancel delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(file.name)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete file"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
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
            {files.map((file, index) => (
              <div
                key={index}
                className="p-4 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">
                        {file.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(file.modifiedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditClick(file.name)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit file"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    {deleteConfirm === file.name ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteConfirm(file.name)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Confirm delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={handleDeleteCancel}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          title="Cancel delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(file.name)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete file"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length === 0 && (
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No files found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload some files to get started!
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit {editingFile}
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-auto">
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="w-full min-h-[500px] h-full p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="File content..."
              />
            </div>
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveContent}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderView;
