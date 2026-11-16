import React, { useState, useEffect } from "react";
import { apiBaseUrl } from "../config";

function WebsocketConfig() {
  const [configData, setConfigData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingWebsocket, setIsEditingWebsocket] = useState(false);
  const [isEditingFileList, setIsEditingFileList] = useState(false);
  const [editedConfig, setEditedConfig] = useState(null);
  const [saveStatusWebsocket, setSaveStatusWebsocket] = useState(null);
  const [saveStatusFileList, setSaveStatusFileList] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch(apiBaseUrl + "/api/config");
      const data = await response.json();
      if (data.success) {
        setConfigData(data.config);
        setEditedConfig(data.config);
      } else {
        setError("Failed to fetch configuration data");
      }
    } catch (err) {
      setError("Error fetching configuration data");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditWebsocket = () => {
    setIsEditingWebsocket(true);
  };

  const handleCancelWebsocket = () => {
    setIsEditingWebsocket(false);
    setEditedConfig(configData);
    setSaveStatusWebsocket(null);
  };

  const handleChangeWebsocket = (value) => {
    setEditedConfig((prev) => ({
      ...prev,
      websocketUrl: value,
    }));
  };

  const handleSaveWebsocket = async () => {
    try {
      setSaveStatusWebsocket("saving");
      const response = await fetch(apiBaseUrl + "/api/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedConfig),
      });

      const data = await response.json();
      if (data.success) {
        setConfigData(editedConfig);
        setIsEditingWebsocket(false);
        setSaveStatusWebsocket("success");
        setTimeout(() => setSaveStatusWebsocket(null), 3000);
      } else {
        setSaveStatusWebsocket("error");
        setTimeout(() => setSaveStatusWebsocket(null), 3000);
      }
    } catch (err) {
      setSaveStatusWebsocket("error");
      setTimeout(() => setSaveStatusWebsocket(null), 3000);
      console.error("Error saving config:", err);
    }
  };

  const handleEditFileList = () => {
    setIsEditingFileList(true);
  };

  const handleCancelFileList = () => {
    setIsEditingFileList(false);
    setEditedConfig(configData);
    setSaveStatusFileList(null);
  };

  const handleChangeFileList = (value) => {
    setEditedConfig((prev) => ({
      ...prev,
      fileList: value,
    }));
  };

  const handleSaveFileList = async () => {
    try {
      setSaveStatusFileList("saving");
      const response = await fetch(apiBaseUrl + "/api/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedConfig),
      });

      const data = await response.json();
      if (data.success) {
        setConfigData(editedConfig);
        setIsEditingFileList(false);
        setSaveStatusFileList("success");
        setTimeout(() => setSaveStatusFileList(null), 3000);
      } else {
        setSaveStatusFileList("error");
        setTimeout(() => setSaveStatusFileList(null), 3000);
      }
    } catch (err) {
      setSaveStatusFileList("error");
      setTimeout(() => setSaveStatusFileList(null), 3000);
      console.error("Error saving config:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Content */}
          <div className="p-8">
            {configData && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      WebSocket Configuration
                    </h3>
                    <div className="flex space-x-3">
                      {!isEditingWebsocket ? (
                        <button
                          onClick={handleEditWebsocket}
                          className="px-6 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 flex items-center space-x-2 shadow-sm"
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
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>Edit</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleCancelWebsocket}
                            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center space-x-2"
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
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={handleSaveWebsocket}
                            disabled={saveStatusWebsocket === "saving"}
                            className={`px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 ${
                              saveStatusWebsocket === "saving"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {saveStatusWebsocket === "saving" ? (
                              <>
                                <svg
                                  className="animate-spin h-5 w-5"
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
                                <span>Saving...</span>
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
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                <span>Save</span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WebSocket URL
                      </label>
                      {isEditingWebsocket ? (
                        <input
                          type="text"
                          value={editedConfig?.websocketUrl || ""}
                          onChange={(e) =>
                            handleChangeWebsocket(e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter WebSocket URL"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-white rounded-lg border border-gray-200">
                          <span className="text-gray-800">
                            {configData.websocketUrl}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* File List */}
          {/* Content */}
          <div className="p-8">
            {configData && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      File List
                    </h3>
                    <div className="flex space-x-3">
                      {!isEditingFileList ? (
                        <button
                          onClick={handleEditFileList}
                          className="px-6 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 flex items-center space-x-2 shadow-sm"
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
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>Edit</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleCancelFileList}
                            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center space-x-2"
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
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={handleSaveFileList}
                            disabled={saveStatusFileList === "saving"}
                            className={`px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 ${
                              saveStatusFileList === "saving"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {saveStatusFileList === "saving" ? (
                              <>
                                <svg
                                  className="animate-spin h-5 w-5"
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
                                <span>Saving...</span>
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
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                <span>Save</span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comma separated file names for dynamic ROI generation in
                        all folder (Example:
                        limestone.json,clay.json,iron_ore.json,sand.json,raw_material.json)
                      </label>
                      {isEditingFileList ? (
                        <input
                          type="text"
                          value={editedConfig?.fileList || ""}
                          onChange={(e) => handleChangeFileList(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter comma separated file names"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-white rounded-lg border border-gray-200">
                          <span className="text-gray-800">
                            {configData.fileList}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebsocketConfig;
