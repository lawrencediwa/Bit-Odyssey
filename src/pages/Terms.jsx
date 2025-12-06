import React from "react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-white text-gray-900 flex flex-col">
			<nav className="flex justify-between items-center px-8 py-6 shadow-sm bg-white">
				<div className="text-2xl font-bold text-green-700">GreenMate</div>
				<div className="flex gap-4">
					<button onClick={() => navigate("/")} className="text-green-700 hover:underline">Home</button>
                    <button onClick={() => navigate("/terms")} className="text-green-700 hover:underline">Terms</button>
					<button onClick={() => navigate("/contact")} className="text-green-700 hover:underline">Contact</button>
					<button onClick={() => navigate("/signin")} className="bg-green-700 text-white px-4 py-2 rounded-lg">Get Started</button>
				</div>
			</nav>

			<main className="flex-1 flex items-start justify-center bg-gray-50 p-6">
				<div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">
					<h1 className="text-3xl font-bold mb-4 text-gray-800">Terms &amp; Conditions</h1>
					<p className="text-sm text-gray-500 mb-6">Last updated: December 6, 2025</p>

					<section className="prose prose-sm max-w-none text-gray-700">
						<h2>1. Agreement to Terms</h2>
						<p>
							These Terms &amp; Conditions ("Terms") govern your access to and use of the Bit
							Odyssey ("the App") and its related websites, services, and applications. By
							accessing or using the App you agree to be bound by these Terms. If you do not agree,
							do not use the App.
						</p>

						<h2>2. Eligibility</h2>
						<p>
							You must be at least 13 years old (or the minimum age required in your jurisdiction)
							to use the App. If you are under the applicable age, you must use the App only with
							the involvement and consent of a parent or guardian.
						</p>

						<h2>3. Accounts</h2>
						<p>
							Some features require creating an account. You agree to provide accurate information
							and to keep your credentials secure. You are responsible for activity that occurs
							under your account and must notify us immediately of any unauthorized use.
						</p>

						<h2>4. User Content and Conduct</h2>
						<p>
							You retain ownership of content you submit, but you grant the App a license to use
							that content to provide the service. You agree not to post unlawful, abusive,
							infringing, or otherwise objectionable content, and not to use the App for any illegal
							purposes.
						</p>

						<h2>5. Privacy</h2>
						<p>
							Use of the App is also governed by our Privacy Policy, which explains how we collect,
							use, and disclose information. By using the App you agree to the collection and use of
							information as described in the Privacy Policy.
						</p>

						<h2>6. Intellectual Property</h2>
						<p>
							All rights, title and interest in the App (including text, graphics, logos,
							trademarks, and software) are owned by or licensed to Bit Odyssey. You may not copy,
							modify, distribute, or create derivative works except as expressly permitted in these
							Terms or with our prior written consent.
						</p>

						<h2>7. Payments and Subscriptions</h2>
						<p>
							If the App offers paid features, you agree to pay applicable fees and taxes. Payment
							terms, refunds, and billing are governed by the purchase flow and any separate
							subscription terms presented when you subscribe.
						</p>

						<h2>8. Disclaimers</h2>
						<p>
							The App is provided "as is" and "as available" without warranties of any kind,
							whether express or implied. We do not guarantee that the App will be uninterrupted,
							secure, or error-free. You use the App at your own risk.
						</p>

						<h2>9. Limitation of Liability</h2>
						<p>
							To the fullest extent permitted by law, Bit Odyssey and its affiliates are not
							liable for indirect, incidental, special, consequential, or punitive damages, or any
							loss of profits, data, or goodwill arising from your use of the App.
						</p>

						<h2>10. Termination</h2>
						<p>
							We may suspend or terminate your access for violations of these Terms or for other
							reasons. Upon termination, your right to use the App will end and we may delete or
							disable your account and content in accordance with our policies.
						</p>

						<h2>11. Changes to Terms</h2>
						<p>
							We may modify these Terms from time to time. If we make material changes we will
							provide notice through the App or by other means. Continued use after changes
							signifies acceptance of the revised Terms.
						</p>

						<h2>12. Governing Law</h2>
						<p>
							These Terms are governed by the laws of the jurisdiction where Bit Odyssey is
							established, without regard to conflict-of-law principles. You agree to submit to the
							exclusive jurisdiction of the courts located there for disputes.
						</p>

						<h2>13. Contact</h2>
						<p>
							If you have questions about these Terms, please contact us at the email address
							provided in the app or repository README.
						</p>

						<p className="text-sm text-gray-600">
							These Terms do not create any third-party beneficiary rights. If any provision is
							found invalid, the remainder will continue in full force.
						</p>
					</section>
				</div>
			</main>
		</div>
	);
};

export default Terms;
