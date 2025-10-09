import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    
    navigate("/");
  };

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col py-8 px-6 rounded-r-3xl">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-blue-600">GreenMate</h1>
      </div>

      <nav className="flex flex-col gap-3 mb-6">
        {["Dashboard", "Classroom", "Expenses", "Settings"].map((item) => (
          <Link
            key={item}
            to={
              item === "Dashboard"
                ? "/dashboard"
                : item === "Classroom"
                ? "/classroom"
                : item === "Expenses"
                ? "/expenses"
                : item === "Settings"
                ? "/settings"
                : "#"
            }
            className="text-left px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-blue-100 transition"
          >
            {item}
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white font-semibold py-2 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
