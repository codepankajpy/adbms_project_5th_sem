'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { apiRequest } from '../../lib/api';
import { Wrench, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');

  const [email, setEmail] = useState('admin@vehicleservice.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (roleParam === 'customer') {
      setEmail('customer@example.com');
      setPassword('Customer@123');
    } else if (roleParam === 'mechanic') {
      setEmail('mechanic@example.com');
      setPassword('Mechanic@123');
    } else {
      setEmail('admin@vehicleservice.com');
      setPassword('Admin@123');
    }
  }, [roleParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiRequest<{ token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.data) {
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemo = (eMail: string, pass: string) => {
    setEmail(eMail);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="w-full max-w-md bg-white border border-[#E5E5E5] rounded-lg p-6 sm:p-8">
      <div className="flex items-center space-x-2.5 mb-6">
        <div className="w-8 h-8 rounded bg-[#111111] flex items-center justify-center text-white">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#171717]">Sign In to Portal</h2>
          <p className="text-xs text-[#737373]">Vehicle Service Management System</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#FDF3F2] border border-[#FADBD8] rounded text-xs text-[#B83232] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
            placeholder="user@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-[#171717]">Password</label>
            <Link href="/forgot-password" className="text-[11px] text-[#737373] hover:text-[#171717]">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* 1-Click Demo Account Autofill for Viva */}
      <div className="mt-6 pt-5 border-t border-[#E5E5E5]">
        <span className="block text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-2 font-mono">
          1-Click Demo Accounts (Viva Quick Fill)
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setDemo('admin@vehicleservice.com', 'Admin@123')}
            className="py-1.5 px-2 bg-[#F5F5F3] hover:bg-[#EBEBEA] text-[#171717] rounded text-[11px] font-medium border border-[#E5E5E5] text-center"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setDemo('customer@example.com', 'Customer@123')}
            className="py-1.5 px-2 bg-[#F5F5F3] hover:bg-[#EBEBEA] text-[#171717] rounded text-[11px] font-medium border border-[#E5E5E5] text-center"
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setDemo('mechanic@example.com', 'Mechanic@123')}
            className="py-1.5 px-2 bg-[#F5F5F3] hover:bg-[#EBEBEA] text-[#171717] rounded text-[11px] font-medium border border-[#E5E5E5] text-center"
          >
            Mechanic
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-[#737373]">
        Don't have an account yet?{' '}
        <Link href="/signup" className="font-semibold text-[#171717] hover:underline">
          Register as Customer
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs font-mono text-[#737373]">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
