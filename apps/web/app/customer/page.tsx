'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Car, CalendarCheck, FileText, PlusCircle, ArrowRight, Clock, AlertCircle } from 'lucide-react';

export default function CustomerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/dashboard/stats')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Fetching customer analytics from PostgreSQL...</div>;
  }

  const summary = data?.summary || {};
  const vehicles = data?.vehicles || [];
  const recentBookings = data?.recentBookings || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E5E5E5] gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Customer Dashboard</h1>
          <p className="text-xs text-[#737373]">Manage your garage, schedule services, and monitor repair status</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/customer/book"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </Link>
          <Link
            href="/customer/vehicles"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-[#F5F5F3] text-[#171717] text-xs font-medium rounded border border-[#E5E5E5] transition-colors"
          >
            <Car className="w-3.5 h-3.5" />
            <span>My Vehicles</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs text-[#737373] mb-1">Registered Vehicles</div>
          <div className="text-2xl font-extrabold text-[#171717]">{summary.total_vehicles || 0}</div>
          <div className="text-[11px] text-[#737373] mt-1">In your personal garage</div>
        </Card>

        <Card>
          <div className="text-xs text-[#737373] mb-1">Active Appointments</div>
          <div className="text-2xl font-extrabold text-[#D97736]">{summary.active_bookings || 0}</div>
          <div className="text-[11px] text-[#737373] mt-1">Pending, confirmed or in bay</div>
        </Card>

        <Card>
          <div className="text-xs text-[#737373] mb-1">Completed Services</div>
          <div className="text-2xl font-extrabold text-[#171717]">{summary.completed_bookings || 0}</div>
          <div className="text-[11px] text-[#737373] mt-1">Lifetime maintenance history</div>
        </Card>

        <Card>
          <div className="text-xs text-[#737373] mb-1">Total Expenditure</div>
          <div className="text-2xl font-extrabold text-[#171717]">
            ${Number(summary.total_spending || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#737373] mt-1">Via function get_customer_total_spending()</div>
        </Card>
      </div>

      {/* Vehicles Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#171717]">My Registered Vehicles</h2>
          <Link href="/customer/vehicles" className="text-xs text-[#737373] hover:text-[#171717] flex items-center space-x-1">
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <Card>
            <div className="text-center py-6">
              <Car className="w-8 h-8 text-[#737373] mx-auto mb-2" />
              <div className="text-xs font-semibold text-[#171717]">No vehicles registered</div>
              <p className="text-[11px] text-[#737373] mt-0.5 mb-3">Add your automobile to book services and track odometer records.</p>
              <Link
                href="/customer/vehicles"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#111111] text-white text-xs font-medium rounded"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Vehicle</span>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {vehicles.map((v: any) => (
              <div key={v.id} className="bg-white border border-[#E5E5E5] rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold bg-[#F5F5F3] px-2 py-0.5 rounded border border-[#E5E5E5]">
                    {v.registration_number}
                  </span>
                  <Badge variant="outline">{v.transmission}</Badge>
                </div>
                <div className="text-sm font-bold text-[#171717]">
                  {v.brand_name} {v.model_name}
                </div>
                <div className="text-xs text-[#737373] mt-0.5">
                  Year {v.year} • {v.color} • {Number(v.mileage_km).toLocaleString()} km
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Appointments */}
      <Card
        title="Recent Appointments"
        subtitle="Sourced directly from database view: booking_details_view"
        action={
          <Link href="/customer/bookings" className="text-xs text-[#737373] hover:text-[#171717]">
            View all bookings
          </Link>
        }
      >
        {recentBookings.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#737373]">No booking history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E5E5] text-[#737373]">
                  <th className="py-2.5 font-medium">Booking #</th>
                  <th className="py-2.5 font-medium">Vehicle</th>
                  <th className="py-2.5 font-medium">Date & Slot</th>
                  <th className="py-2.5 font-medium">Services</th>
                  <th className="py-2.5 font-medium">Assigned Mechanic</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 font-medium">Estimated Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
                {recentBookings.map((b: any) => (
                  <tr key={b.booking_id} className="hover:bg-[#F5F5F3]/50">
                    <td className="py-2.5 font-mono font-medium">{b.booking_number}</td>
                    <td className="py-2.5">
                      <span className="font-semibold">{b.brand} {b.model}</span>
                      <span className="text-[11px] text-[#737373] block">{b.registration_number}</span>
                    </td>
                    <td className="py-2.5">
                      <div>{b.booking_date}</div>
                      <div className="text-[11px] text-[#737373]">{b.time_slot}</div>
                    </td>
                    <td className="py-2.5 max-w-[200px] truncate text-[#737373]">{b.booked_services_list}</td>
                    <td className="py-2.5">{b.mechanic_name || 'Pending Assignment'}</td>
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
                    <td className="py-2.5 font-mono">${Number(b.total_estimated_cost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

