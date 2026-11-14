'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Car,
  CalendarCheck,
  FileText,
  CreditCard,
  BarChart3,
  Database,
  PlusCircle,
  Settings,
  Sparkles,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  interface NavLink {
    href: string;
    label: string;
    icon: any;
    isSpecial?: boolean;
  }

  const adminLinks: NavLink[] = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/mechanics', label: 'Mechanics', icon: Wrench },
    { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
    { href: '/admin/services', label: 'Services Catalog', icon: Sparkles },
    { href: '/admin/bookings', label: 'Appointments', icon: CalendarCheck },
    { href: '/admin/invoices', label: 'Invoices', icon: FileText },
    { href: '/admin/payments', label: 'Payments', icon: CreditCard },
    { href: '/admin/reports', label: 'Reports & Revenue', icon: BarChart3 },
    { href: '/admin/dbms-lab', label: 'DBMS Lab Explorer', icon: Database, isSpecial: true },
  ];

  const customerLinks: NavLink[] = [
    { href: '/customer', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/customer/vehicles', label: 'My Vehicles', icon: Car },
    { href: '/customer/services', label: 'Services Catalog', icon: Sparkles },
    { href: '/customer/book', label: 'Book Appointment', icon: PlusCircle },
    { href: '/customer/bookings', label: 'My Bookings', icon: CalendarCheck },
    { href: '/customer/invoices', label: 'Invoices & Payments', icon: FileText },
    { href: '/customer/profile', label: 'Profile Settings', icon: Settings },
  ];

  const mechanicLinks: NavLink[] = [
    { href: '/mechanic', label: 'Assigned Jobs', icon: Wrench },
  ];

  const links =
    user.role === 'admin'
      ? adminLinks
      : user.role === 'mechanic'
      ? mechanicLinks
      : customerLinks;

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-[#E5E5E5] min-h-[calc(100vh-3.5rem)] p-3">
      <div className="mb-2 px-3 py-1.5 text-[11px] font-semibold text-[#737373] tracking-wider uppercase font-mono">
        {user.role} workspace
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-[#111111] text-white'
                  : link.isSpecial
                  ? 'text-[#D97736] hover:bg-[#FDF6F0] border border-[#F5DAC7]'
                  : 'text-[#171717] hover:bg-[#F5F5F3]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-white'
                      : link.isSpecial
                      ? 'text-[#D97736]'
                      : 'text-[#737373]'
                  }`}
                />
                <span>{link.label}</span>
              </div>
              {link.isSpecial && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-[#D97736] text-white rounded">
                  Lab
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
