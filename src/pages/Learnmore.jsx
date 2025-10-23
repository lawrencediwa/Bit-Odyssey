import React from "react";
import { useNavigate } from "react-router-dom";

const LearnMore = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <nav className="flex justify-between items-center px-8 py-6 shadow-sm bg-white">
        <div className="text-2xl font-bold text-green-700">GreenMate</div>
        <div className="flex gap-4">
          <button onClick={() => navigate("/")} className="text-green-700 hover:underline">Home</button>
          <button onClick={() => navigate("/Contact")} className="text-green-700 hover:underline">Contact</button>
          <button onClick={() => navigate("/Signin")} className="bg-green-700 text-white px-4 py-2 rounded-lg">Get Started</button>
        </div>
      </nav>

      <header className="max-w-5xl mx-auto px-8 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-4">Make tasks simpler. Spend greener.</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
          GreenMate helps students manage classes, track expenses and see the environmental impact of their spending — all in one lightweight app.
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={() => navigate("/Signup")} className="bg-green-700 text-white px-6 py-3 rounded-lg shadow hover:bg-green-800">Create Account</button>
          <button onClick={() => navigate("/Dashboard")} className="border border-green-700 text-green-700 px-6 py-3 rounded-lg hover:bg-green-50">View Demo</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12 grid gap-8 md:grid-cols-3">
        <section className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-semibold text-xl text-gray-800 mb-2">Task Management</h3>
          <p className="text-gray-600">Organize classes and deadlines, get reminders, and see progress at a glance.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-semibold text-xl text-gray-800 mb-2">Expense Tracking</h3>
          <p className="text-gray-600">Log spending, categorize purchases, and monitor monthly totals.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-semibold text-xl text-gray-800 mb-2">Environmental Impact</h3>
          <p className="text-gray-600">See estimated CO₂ impact from spending and discover greener choices.</p>
        </section>
      </main>

      <footer className="mt-auto bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} GreenMate — Built for students.</p>
        </div>
      </footer>
    </div>
  );
};

export default LearnMore;