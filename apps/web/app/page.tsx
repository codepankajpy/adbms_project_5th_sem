'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import {
  Database,
  Shield,
  Layers,
  ArrowRight,
  Terminal,
  Activity,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="border border-[#E5E5E5] bg-white rounded-lg p-8 sm:p-12 mb-8">
        <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-[#F5F5F3] text-[#737373] text-xs font-mono uppercase mb-4 border border-[#E5E5E5]">
          <Database className="w-3.5 h-3.5 text-[#D97736]" />
          <span>Advanced DBMS Academic Mini Project 2026</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#171717] mb-4">
          Vehicle Service Management System
        </h1>
        <p className="text-base sm:text-lg text-[#737373] max-w-3xl mb-8 leading-relaxed">
          A high-integrity, database-centric full-stack application built natively on PostgreSQL. Demonstrating 3NF normalization, stored procedures, table-returning functions, complex triggers, cursors, window functions, and strict ACID transaction management.
        </p>

        <div className="flex flex-wrap gap-3">
          {user ? (
            <Link
              href={user.role === 'admin' ? '/admin' : user.role === 'mechanic' ? '/mechanic' : '/customer'}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors"
            >
              <span>Go to {user.role.toUpperCase()} Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors"
              >
                <span>Launch Interactive Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white hover:bg-[#F5F5F3] text-[#171717] text-xs font-medium rounded border border-[#E5E5E5] transition-colors"
              >
                <span>Register Customer</span>
              </Link>
            </>
          )}

          <Link
            href="/login?role=admin"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#FDF6F0] hover:bg-[#FBECE0] text-[#D97736] text-xs font-medium rounded border border-[#F5DAC7] transition-colors"
          >
            <Database className="w-4 h-4" />
            <span>Open DBMS Lab (Admin)</span>
          </Link>
        </div>
      </div>

      {/* Database Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border border-[#E5E5E5] bg-white rounded-lg p-6">
          <div className="w-8 h-8 rounded bg-[#111111] text-white flex items-center justify-center mb-3">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[#171717] mb-1">18 Normalized Tables (3NF)</h3>
          <p className="text-xs text-[#737373] leading-relaxed">
            Zero duplicate dependencies. Strict foreign keys with cascading updates/deletes, CHECK constraints on financials, and composite indexes.
          </p>
        </div>

        <div className="border border-[#E5E5E5] bg-white rounded-lg p-6">
          <div className="w-8 h-8 rounded bg-[#111111] text-white flex items-center justify-center mb-3">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[#171717] mb-1">PL/pgSQL Business Engine</h3>
          <p className="text-xs text-[#737373] leading-relaxed">
            4+ stored procedures with transaction management, 6+ UDFs, 5 real triggers enforcing invariants and audit history, plus explicit cursors.
          </p>
        </div>

        <div className="border border-[#E5E5E5] bg-white rounded-lg p-6">
          <div className="w-8 h-8 rounded bg-[#111111] text-white flex items-center justify-center mb-3">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[#171717] mb-1">ACID & Integrity Guarantees</h3>
          <p className="text-xs text-[#737373] leading-relaxed">
            Row-level FOR UPDATE locking, SAVEPOINT rollbacks, slot capacity validation, state machine enforcement, and JSONB audit trails.
          </p>
        </div>
      </div>

      {/* Demo Credentials Table */}
      <div className="border border-[#E5E5E5] bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E5E5]">
          <div>
            <h3 className="text-sm font-bold text-[#171717]">Quick Viva Demo Credentials</h3>
            <p className="text-xs text-[#737373]">Click any row on the login page to immediately sign in and demonstrate to the professor.</p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-[#F5F5F3] px-2 py-1 rounded border border-[#E5E5E5]">PostgreSQL Seeded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] text-[#737373]">
                <th className="py-2 font-medium">Role</th>
                <th className="py-2 font-medium">Demo Email</th>
                <th className="py-2 font-medium">Demo Password</th>
                <th className="py-2 font-medium">Purpose in Demonstration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] text-[#171717] font-mono">
              <tr>
                <td className="py-2.5 font-sans font-semibold text-[#111111]">Admin</td>
                <td className="py-2.5">admin@vehicleservice.com</td>
                <td className="py-2.5">Admin@123</td>
                <td className="py-2.5 font-sans text-[#737373]">Full workshop operations + Access to /admin/dbms-lab</td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans font-semibold text-[#111111]">Customer</td>
                <td className="py-2.5">customer@example.com</td>
                <td className="py-2.5">Customer@123</td>
                <td className="py-2.5 font-sans text-[#737373]">Book appointments, add vehicles, view bills, pay invoices</td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans font-semibold text-[#111111]">Mechanic</td>
                <td className="py-2.5">mechanic@example.com</td>
                <td className="py-2.5">Mechanic@123</td>
                <td className="py-2.5 font-sans text-[#737373]">View assigned jobs, update odometer, record technical notes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

