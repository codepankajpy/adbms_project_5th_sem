'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E5E5E5] rounded-lg p-6 sm:p-8">
        <Link href="/login" className="inline-flex items-center space-x-1.5 text-xs text-[#737373] hover:text-[#171717] mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>

        <h2 className="text-base font-bold text-[#171717] mb-1">Password Recovery</h2>
        <p className="text-xs text-[#737373] mb-6">
          Enter your registered email address to receive password reset instructions.
        </p>

        {submitted ? (
          <div className="p-4 bg-[#F2F7F4] border border-[#D1E7DD] rounded text-xs text-[#2E6B47] flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="font-semibold">Reset Link Dispatched</div>
              <p className="mt-0.5 text-[11px] text-[#2E6B47]/80">
                In a production environment, a secure password reset token is emailed. For local academic viva evaluation, use the pre-configured password <code className="font-mono font-bold">Admin@123</code> / <code className="font-mono font-bold">Customer@123</code>.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">Registered Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                placeholder="user@example.com"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors"
            >
              Send Instructions
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

