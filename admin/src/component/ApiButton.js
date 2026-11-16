import React, { useState } from "react";
import { apiBaseUrl } from "../config";

/**
 * ApiButton Component
 * A toggle button component for API control
 */
function ApiButton() {
  const [isToggled, setIsToggled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handles toggle action and makes API call
   */
  const handleToggle = async () => {
    const newState = !isToggled;
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = newState
        ? `${apiBaseUrl}/api/start/allprocess`
        : `${apiBaseUrl}/api/stop-all`;

      const response = await fetch(endpoint, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      await response.json();
      setIsToggled(newState);
    } catch (err) {
      console.error("Error toggling API:", err);
      setError(err.message || "Failed to toggle API state");
      // Revert toggle state on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="bg-white rounded-lg shadow-lg p-3 w-auto">
        <h2 className="text-base font-semibold text-gray-800 mb-3 text-center">
          ALL
        </h2>

        <div className="flex flex-col items-center space-y-3">
          {/* Toggle Button */}
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`relative inline-flex h-9 w-[72px] items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isToggled
                ? "bg-blue-600 focus:ring-blue-500"
                : "bg-gray-300 focus:ring-gray-400"
            } ${
              isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            role="switch"
            aria-checked={isToggled}
            aria-label={`API is ${isToggled ? "enabled" : "disabled"}`}
          >
            {/* Toggle Circle */}
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                isToggled ? "translate-x-[42px]" : "translate-x-1.5"
              } ${isLoading ? "opacity-75" : ""}`}
            />
          </button>

          {/* Status Text */}
          <div className="text-center">
            {error && (
              <p className="text-xs text-red-600 font-medium mb-1">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiButton;
