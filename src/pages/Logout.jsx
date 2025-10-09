import React from "react";

// ...existing code...
const Logout = () => {
	return (
	<div className="flex min-h-screen items-center justify-center bg-gray-100">
	<div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
	<h1 className="text-center text-3xl font-bold mb-2">Sign Out</h1>
	<p className="text-center text-gray-500 mb-6">
		  You have been logged out.
	</p>
	<button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 font-medium hover:bg-gray-50 transition">
		  <img
			src="https://www.svgrepo.com/show/355037/google.svg"
			alt="Google"
			className="h-5 w-5"
		  />
		  Sign out from Google
	</button>
	<div className="my-6 flex items-center">
		  <hr className="flex-grow border-gray-300" />
		  <span className="mx-2 text-gray-400">or</span>
		  <hr className="flex-grow border-gray-300" />
	</div>
	<form>
		  <label className="block text-sm font-medium text-gray-700 mb-1">
			Email
		  </label>
		  <input
			type="email"
			placeholder="mail@loopple.com"
			className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
			disabled
		  />
		  <label className="block text-sm font-medium text-gray-700 mb-1">
			Password
		  </label>
		  <input
			type="password"
			placeholder="Enter a password"
			className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
			disabled
		  />
		  <div className="flex items-center justify-between mb-6">
			<label className="flex items-center text-sm">
			  <input type="checkbox" className="mr-2" disabled />
			  Keep me logged in
			</label>
			<button
			  type="button"
			  className="text-sm font-medium text-blue-600 hover:underline"
			  aria-label="Forgot password?"
			  disabled
			>
			  Forgot password?
			</button>
		  </div>
		  <button
			type="submit"
			className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 transition"
			disabled
		  >
			Sign Out
		  </button>
	</form>
	<p className="mt-6 text-center text-sm text-gray-600">
		  Want to log in again?{" "}
		  <button
			type="button"
			className="font-semibold text-blue-600 hover:underline"
			aria-label="Login"
		  >
			Login
		  </button>
	</p>
	<p className="mt-8 text-center text-xs text-gray-400">
		  Tailwind CSS Component from Motion Landing Library by Looppole Builder.
	</p>
	</div>
	</div>
	);
};

export default Logout;
