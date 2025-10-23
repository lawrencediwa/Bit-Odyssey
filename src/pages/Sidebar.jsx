import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Classroom", path: "/classroom" },
    { name: "Expenses", path: "/expenses" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <>
      {/* 📱 Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between bg-blue-600 text-white px-4 py-3">
        {/* ✅ Make GreenMate clickable */}
        <Link
          to="/dashboard"
          className="text-xl font-bold hover:text-gray-200 transition"
          onClick={() => setIsOpen(false)}
        >
          GreenMate
        </Link>
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* 🧭 Sidebar Drawer */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 bg-white shadow-lg w-64 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex flex-col py-8 px-6 rounded-r-3xl`}
      >
        {/* ✅ Clickable Logo */}
        <div className="mb-10">
          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition"
          >
            GreenMate
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-3 mb-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`text-left px-4 py-2 rounded-lg font-semibold transition ${
                location.pathname === item.path
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-blue-100"
              }`}
              onClick={() => setIsOpen(false)} // close drawer on click
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white font-semibold py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* 🔲 Overlay when drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 lg:hidden z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
