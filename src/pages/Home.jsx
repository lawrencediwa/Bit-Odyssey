import React from "react";
import { useNavigate } from "react-router-dom";
import HomePage from "../assets/homepage.png";
import homepage1 from "../assets/HomePage1.png";
import homepage2 from "../assets/HomePage2.png";
import homepage3 from "../assets/Homepage3.png";

const Home = () => {
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


      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-12 py-32 max-w-7xl mx-auto gap-y-12 md:gap-x-20">
        {/* Left Side - Text */}
        <div className="flex-1 md:flex-[0.6] space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-green-900 leading-tight">
            Stay on Top of Your Tasks & Make a Greener Impact
          </h1>
          <p className="text-gray-600 text-xl md:text-2xl max-w-2xl">
            GreenMate helps students track tasks, manage expenses, and see the environmental impact of their spending—all in one place.
          </p>
          <div className="flex gap-6">
            <button onClick={() => navigate("/learnmore")} className="bg-green-700 text-white px-8 py-4 rounded-lg font-semibold shadow hover:bg-green-800 transition">
              Learn More
            </button>
          </div>
        </div>

        {/* Right Side - Illustration (Collage) */}
        <div className="relative mt-12 md:mt-0 md:flex-[0.8] lg:flex-[0.9] grid grid-cols-2 gap-4">
          <img
            src={HomePage}
            alt="Student 1"
            className="w-full h-auto rounded-lg shadow"
          />
          <img
            src={homepage1}
            alt="Student 2"
            className="w-full h-auto rounded-lg shadow"
          />
          <img
            src={homepage2}
            alt="Student 3"
            className="w-full h-auto rounded-lg shadow"
          />
          <img
            src={homepage3}
            alt="Student 4"
            className="w-full h-auto rounded-lg shadow"
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
