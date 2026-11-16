import { useState, useEffect } from "react";
import Sidebar from "./component/sidebar";
import Dashboard from "./component/Dashboard";
import { pocName, apiBaseUrl } from "./config";
import WebsocketConfig from "./component/WebsocketConfig";
import ApiButton from "./component/ApiButton";
import { Routes, Route } from "react-router-dom";
import RawMatterial from "./component/RawMatterial";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById("user-dropdown");
      const dropdownButton = document.getElementById("user-dropdown-button");

      if (
        dropdown &&
        dropdownButton &&
        !dropdown.contains(event.target) &&
        !dropdownButton.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const verifyAuthToken = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      try {
        const response = await fetch(apiBaseUrl + "/api/auth/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          // Token is invalid or expired
          localStorage.removeItem("authToken");
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        localStorage.removeItem("authToken");
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    verifyAuthToken();
  }, []);

  const renderContent = () => {
    return (
      <div className="transition-all duration-300 ease-in-out">
        {currentPage === "dashboard" && (
          <Dashboard
            isAuthenticated={isAuthenticated}
            onAuthChange={setIsAuthenticated}
          />
        )}
        {currentPage === "websocket" && <WebsocketConfig />}
        {currentPage === "apibutton" && <ApiButton />}
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    setUser(null);
    setIsDropdownOpen(false);
  };

  return (
    <>
      <Routes>
        <Route path="/raw-material" element={<RawMatterial />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-50">
              {isAuthenticated && (
                <>
                  {/* Sidebar */}
                  <div
                    className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${
                      isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                  >
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto py-5 px-3">
                        <Sidebar
                          currentPage={currentPage}
                          setCurrentPage={setCurrentPage}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Overlay for mobile */}
                  {isSidebarOpen && (
                    <div
                      className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden"
                      onClick={() => setIsSidebarOpen(false)}
                    />
                  )}
                </>
              )}

              {/* Main Content */}
              <main
                className={`transition-all duration-300 ease-in-out ${
                  isAuthenticated
                    ? ` ${isSidebarOpen ? "lg:ml-64" : "lg:ml-0"}`
                    : ""
                }`}
              >
                {isAuthenticated && (
                  <header className="bg-white shadow-sm z-10">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                          <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            aria-label="Toggle sidebar"
                          >
                            <svg
                              className="h-6 w-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                              />
                            </svg>
                          </button>
                          <div className="ml-2">
                            <h1 className="text-xl font-semibold text-gray-900">
                              {pocName} API Dashboard
                            </h1>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <div className="relative">
                            <button
                              id="user-dropdown-button"
                              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                              aria-expanded={isDropdownOpen}
                              aria-controls="user-dropdown"
                            >
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {user?.username?.[0]?.toUpperCase() || "U"}
                                </span>
                              </div>
                              <span className="text-sm font-medium">Admin</span>
                              <svg
                                className={`h-4 w-4 transition-transform duration-200 ${
                                  isDropdownOpen ? "transform rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>

                            {isDropdownOpen && (
                              <div
                                id="user-dropdown"
                                className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                              >
                                <div className="py-1" role="menu">
                                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                                    <p className="font-medium">Admin User</p>
                                    <p className="text-gray-500">
                                      admin@example.com
                                    </p>
                                  </div>
                                  <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                                    role="menuitem"
                                  >
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      aria-hidden="true"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                      />
                                    </svg>
                                    <span>Logout</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </header>
                )}

                <div className={" mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
                  {renderContent()}
                </div>
              </main>
            </div>
          }
        ></Route>

      </Routes>
    </>
  );
}

export default App;
