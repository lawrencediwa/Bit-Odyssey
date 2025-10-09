import React from "react";
import { useNavigate } from "react-router-dom";

const MarketingDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-green-900 min-h-screen w-full">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-green-900">
        <div className="flex items-center gap-2">
          <div className="bg-green-300 rounded p-2 font-bold text-green-900">Greenmate</div>
        </div>
        <ul className="flex gap-8 font-medium text-green-100">
          <li><button className="bg-transparent text-green-100 hover:text-green-300 font-medium">Home</button></li>
          <li><button className="bg-transparent text-green-100 hover:text-green-300 font-medium">About</button></li>
          <li><button className="bg-transparent text-green-100 hover:text-green-300 font-medium">Contact</button></li>
        </ul>
  <button className="bg-green-300 text-green-900 px-4 py-2 rounded-lg font-bold" onClick={() => navigate("/signin")}>Get Started</button>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">START YOUR DATA JOURNEY<br />WITH SMARTAIX</h1>
        <p className="text-green-100 mb-8 max-w-xl">
          Equip business professionals across departments with the Data AI insights they need to make the decisions that count
        </p>
        {/* Dashboard Picture Placeholder */}
        <div className="bg-green-900 rounded-2xl shadow-lg p-8 w-full max-w-3xl flex items-center justify-center">
          <span className="text-green-200 text-2xl">picture</span>
        </div>
      </section>
    </div>
  );
};

export default MarketingDashboard;