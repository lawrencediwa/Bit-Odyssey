import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgetPass = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!email) {
			setMessage("Please enter your email address.");
			return;
		}
		// Simulate sending reset link
		setMessage("If an account exists for this email, a reset link has been sent.");
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-100">
			<div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
				<h1 className="text-center text-3xl font-bold mb-2">Forgot Password</h1>
				<p className="text-center text-gray-500 mb-6">
					Enter your email address and we'll send you a password reset link.
				</p>
				<form onSubmit={handleSubmit}>
					<label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="mail@loopple.com"
						className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
					/>
					{message && (
						<div className="mb-4 text-blue-600 text-sm text-center">{message}</div>
					)}
					<button
						type="submit"
						className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 transition"
					>
						Send Reset Link
					</button>
				</form>
							{/* Back to Login button */}
							<button
								type="button"
								className="mt-4 w-full rounded-lg bg-gray-200 py-2 font-semibold text-gray-700 hover:bg-gray-300 transition"
								onClick={() => navigate("/signin")}
							>
								Back to Login
							</button>
					</div>
		</div>
	);
};

export default ForgetPass;
