const Sidebar = ({ currentPage, setCurrentPage }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "websocket", label: "WebSocket Config" },
    { id: "apibutton", label: "API Button" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-center space-x-3">
          <img
            src="/allcad_logo-1-200x52.png"
            alt="Logo"
            className="w-50 h-8"
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors duration-150 ${
              currentPage === item.id
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
