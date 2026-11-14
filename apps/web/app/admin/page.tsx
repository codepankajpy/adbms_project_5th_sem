'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import {
  Users,
  Wrench,
  Car,
  CalendarCheck,
  CreditCard,
  Database,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/dashboard/stats')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Querying PostgreSQL system metrics...</div>;
  }

  const summary = data?.summary || {};
  const revenueMonthly = data?.revenueMonthly || [];
  const recentBookings = data?.recentBookings || [];
  const mechanicWorkload = data?.mechanicWorkload || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E5E5E5] gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Workshop Control Center</h1>
          <p className="text-xs text-[#737373]">
            PostgreSQL relational management dashboard with live aggregation pipelines
          </p>
        </div>

        <Link
          href="/admin/dbms-lab"
          className="inline-flex items-center space-x-2 px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors"
        >
          <Database className="w-4 h-4 text-[#D97736]" />
          <span>Launch Academic DBMS Lab</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs text-[#737373] mb-1">Total Cleared Revenue</div>
          <div className="text-2xl font-extrabold text-[#171717]">
            ${Number(summary.total_revenue_collected || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#2E6B47] mt-1 font-medium">Aggregated across paid invoices</div>
        </Card>

        <Card>
          <div className="text-xs text-[#737373] mb-1">Active Workshop Jobs</div>
          <div className="text-2xl font-extrabold text-[#D97736]">{summary.active_bookings || 0}</div>
          <div className="text-[11px] text-[#737373] mt-1">Pending, confirmed, in bay</div>
        </Card>

        <Card>
          <div className="text-xs text-[#737373] mb-1">Customer Accounts</div>
          <div className="text-2xl font-extrabold text-[#171717]">{summary.total_customers || 0}</div>
          <div className="text-[11px] text-[#737373] mt-1">{summary.total_vehicles || 0} registered vehicles</div>
        </Card>

        <Card>
          <div className="text-xs text-[#737373] mb-1">Mechanics Roster</div>
          <div className="text-2xl font-extrabold text-[#171717]">{summary.total_mechanics || 0}</div>
          <div className="text-[11px] text-[#737373] mt-1">Certified workshop specialists</div>
        </Card>
      </div>

      {/* Monthly Revenue & Technician Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue View */}
        <Card
          title="Monthly Revenue Summary"
          subtitle="Sourced directly from database view: revenue_summary_view"
          action={
            <Link href="/admin/reports" className="text-xs text-[#737373] hover:text-[#171717] flex items-center space-x-1">
              <span>Detailed view</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E5E5] text-[#737373]">
                  <th className="py-2 font-medium">Month</th>
                  <th className="py-2 font-medium">Invoices</th>
                  <th className="py-2 font-medium">Tax Collected</th>
                  <th className="py-2 font-medium">Total Billed</th>
                  <th className="py-2 font-medium">Cleared Cash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] text-[#171717] font-mono">
                {revenueMonthly.map((r: any) => (
                  <tr key={r.billing_month}>
                    <td className="py-2.5 font-bold font-sans">{r.billing_month}</td>
                    <td className="py-2.5">{r.total_invoices_issued}</td>
                    <td className="py-2.5">${Number(r.total_tax_collected).toFixed(2)}</td>
                    <td className="py-2.5 font-bold">${Number(r.net_invoiced_amount).toFixed(2)}</td>
                    <td className="py-2.5 text-[#2E6B47]">${Number(r.total_cleared_payments).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Technician Workload View */}
        <Card
          title="Mechanic Capacity & Ratings"
          subtitle="Sourced directly from database view: mechanic_workload_view"
          action={
            <Link href="/admin/mechanics" className="text-xs text-[#737373] hover:text-[#171717] flex items-center space-x-1">
              <span>Manage roster</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E5E5] text-[#737373]">
                  <th className="py-2 font-medium">Mechanic</th>
                  <th className="py-2 font-medium">Specialization</th>
                  <th className="py-2 font-medium">Active Load</th>
                  <th className="py-2 font-medium">Completed</th>
                  <th className="py-2 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
                {mechanicWorkload.map((m: any) => (
                  <tr key={m.mechanic_id}>
                    <td className="py-2.5 font-semibold">{m.mechanic_name}</td>
                    <td className="py-2.5 text-[#737373] text-[11px] truncate max-w-[120px]">{m.specialization}</td>
                    <td className="py-2.5">
                      <span className={`font-mono font-bold ${Number(m.current_active_jobs) > 0 ? 'text-[#D97736]' : 'text-[#737373]'}`}>
                        {m.current_active_jobs} active
                      </span>
                    </td>
                    <td className="py-2.5 font-mono">{m.total_completed_jobs}</td>
                    <td className="py-2.5 font-semibold text-[#D97736]">{m.average_rating} ★</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card
        title="Live Workshop Service Stream"
        subtitle="Sourced directly from view: booking_details_view"
        action={
          <Link href="/admin/bookings" className="text-xs text-[#737373] hover:text-[#171717]">
            Full appointment log
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] text-[#737373]">
                <th className="py-2.5 font-medium">Booking #</th>
                <th className="py-2.5 font-medium">Customer</th>
                <th className="py-2.5 font-medium">Vehicle</th>
                <th className="py-2.5 font-medium">Date & Slot</th>
                <th className="py-2.5 font-medium">Assigned Tech</th>
                <th className="py-2.5 font-medium">Status</th>
                <th className="py-2.5 font-medium">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
              {recentBookings.map((b: any) => (
                <tr key={b.booking_id} className="hover:bg-[#F5F5F3]/50">
                  <td className="py-2.5 font-mono font-bold">{b.booking_number}</td>
                  <td className="py-2.5">
                    <span className="font-semibold">{b.customer_name}</span>
                    <span className="text-[11px] text-[#737373] block">{b.customer_phone}</span>
                  </td>
                  <td className="py-2.5">
                    {b.brand} {b.model} ({b.registration_number})
                  </td>
                  <td className="py-2.5">
                    <div>{b.booking_date}</div>
                    <div className="text-[11px] text-[#737373]">{b.time_slot}</div>
                  </td>
                  <td className="py-2.5">{b.mechanic_name || <span className="text-[#D97736]">Unassigned</span>}</td>
                  <td className="py-2.5">
                    <Badge
                      variant={
                        b.booking_status === 'completed'
                          ? 'success'
                          : b.booking_status === 'in_progress'
                          ? 'accent'
                          : b.booking_status === 'confirmed'
                          ? 'warning'
                          : b.booking_status === 'cancelled'
                          ? 'danger'
                          : 'default'
                      }
                    >
                      {b.booking_status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-2.5 font-mono font-semibold">${Number(b.total_estimated_cost).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

