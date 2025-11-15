import React, { useEffect } from "react";
import { auth } from "../firebase"; // make sure this points to your Firebase config
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Sign out the user immediately when component mounts
    auth.signOut()
      .then(() => {
        console.log("User signed out successfully");
        navigate("/signin"); // redirect to sign-in page
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-2">Signing Out...</h1>
        <p className="text-gray-500">
          Please wait while we log you out.
        </p>
      </div>
    </div>
  );
};

export default Logout;
