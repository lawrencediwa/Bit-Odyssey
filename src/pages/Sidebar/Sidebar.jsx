import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const navItems = ["Dashboard", "Classroom", "Expenses", "Settings"];

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col py-8 px-6 rounded-r-3xl">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-blue-600">GreenMate</h1>
      </div>

      <nav className="flex flex-col gap-3">
        {navItems.map((item) => (
          <NavLink
            key={item}
            to={item === "Dashboard" ? "/" : `/${item.toLowerCase()}`}
            className={({ isActive }) =>
              `text-left px-4 py-2 rounded-lg font-semibold transition ${
                isActive
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-700 hover:bg-blue-100"
              }`
            }
          >
            {item}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-10">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="font-bold text-blue-600 mb-1">Need help?</div>
          <div className="text-xs text-gray-500">
            Do you have any problem while using GreenMate?
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
