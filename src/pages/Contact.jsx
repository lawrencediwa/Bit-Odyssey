import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // TODO: wire to your API / Firebase / email service
      await new Promise((r) => setTimeout(r, 700));
      alert("Message sent — GreenMate will get back to you shortly.");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to send message. Try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-white flex items-center justify-center">
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left: form */}
        <div className="p-10 md:p-16">
          <h2 className="text-4xl font-extrabold text-green-800 mb-3">Let's talk</h2>
          <p className="text-gray-600 mb-8">
            To request a quote, ask about GreenMate for your campus, or just say hi — fill out the form and we'll
            get back to you promptly.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm text-gray-600">Your Name</span>
              <input
                value={form.name}
                onChange={handleChange("name")}
                required
                className="mt-2 block w-full px-5 py-3 rounded-full bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
                placeholder="Jane Doe"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Your Email</span>
              <input
                value={form.email}
                onChange={handleChange("email")}
                required
                type="email"
                className="mt-2 block w-full px-5 py-3 rounded-full bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200"
                placeholder="you@school.edu"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Your Message</span>
              <textarea
                value={form.message}
                onChange={handleChange("message")}
                required
                rows={6}
                className="mt-2 block w-full px-5 py-4 rounded-2xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-green-200 resize-none"
                placeholder="Tell us how we can help — e.g. campus pilots, pricing, integrations..."
              />
            </label>

            <div className="mt-6 flex items-center gap-4">
              <button
                type="submit"
                disabled={sending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-medium shadow-md transition disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send Message"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-5 py-3 rounded-full border border-gray-200 text-gray-600 bg-white"
              >
                Home
              </button>
            </div>
          </form>
        </div>

        {/* Right: illustration + contact info */}
        <div className="relative p-10 md:p-16 bg-gradient-to-tr from-green-50 to-white flex flex-col justify-between">
          <div className="flex-1 flex items-center justify-center">
            {/* decorative envelope illustration */}
            <svg width="220" height="220" viewBox="0 0 64 64" className="max-w-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="8" width="60" height="44" rx="8" fill="#ECFDF5"/>
              <path d="M6 12L32 34L58 12" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="50" cy="18" r="3.2" fill="#60A5FA"/>
              <path d="M18 38H46" stroke="#BBF7D0" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="mt-6">
            <div className="text-gray-700 mb-4">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-green-600 text-xl">📍</span>
                <div>
                  <div className="text-sm font-medium text-gray-800">GreenMate HQ</div>
                  <div className="text-xs text-gray-500">151 New Park Ave, Hartford, CT 06106</div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-green-600">📞</span>
                <div className="text-sm text-gray-800">+1 (203) 302-9545</div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-green-600">✉️</span>
                <div className="text-sm text-gray-800">hello@greenmate.app</div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <a
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow"
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="facebook"
              >
                f
              </a>
              <a
                className="w-10 h-10 rounded-full bg-sky-400 text-white flex items-center justify-center shadow"
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="twitter"
              >
                t
              </a>
              <a
                className="w-10 h-10 rounded-full bg-pink-400 text-white flex items-center justify-center shadow"
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="instagram"
              >
                ig
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;