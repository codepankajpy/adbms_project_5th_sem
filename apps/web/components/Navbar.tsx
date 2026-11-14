'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Wrench, Database, LogOut, User as UserIcon } from 'lucide-react';
import { Badge } from './Badge';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-[#111111] flex items-center justify-center text-white">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[#171717]">AUTOCARE DBMS</span>
              <span className="text-[10px] text-[#737373] tracking-widest uppercase font-mono">Service Engine</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Discrete DBMS Lab direct link for Admin */}
              {user.role === 'admin' && (
                <Link
                  href="/admin/dbms-lab"
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded border border-[#111111] bg-[#111111] text-white hover:bg-black transition-colors"
                  title="Advanced DBMS Academic Explorer"
                >
                  <Database className="w-3.5 h-3.5 text-[#D97736]" />
                  <span>DBMS Lab</span>
                </Link>
              )}

              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-[#E5E5E5]">
                <div className="text-right">
                  <div className="text-xs font-semibold text-[#171717]">{user.fullName}</div>
                  <div className="text-[10px] text-[#737373]">{user.email}</div>
                </div>
                <Badge variant={user.role === 'admin' ? 'default' : user.role === 'mechanic' ? 'warning' : 'accent'}>
                  {user.role.toUpperCase()}
                </Badge>
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F3] rounded transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#F5F5F3] rounded border border-[#E5E5E5] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#111111] hover:bg-black rounded transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

