'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Users, Car, Phone, Mail, MapPin } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/customers')
      .then((res) => setCustomers(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Fetching customer profiles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E5E5E5]">
        <h1 className="text-xl font-bold text-[#171717]">Customer Accounts Management</h1>
        <p className="text-xs text-[#737373]">
          Customer entity directory with vehicle ownership, appointment counts, and lifetime spending function
        </p>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
              <th className="py-3 px-4 font-medium">Customer ID</th>
              <th className="py-3 px-4 font-medium">Full Name</th>
              <th className="py-3 px-4 font-medium">Contact</th>
              <th className="py-3 px-4 font-medium">Location</th>
              <th className="py-3 px-4 font-medium">Vehicles Owned</th>
              <th className="py-3 px-4 font-medium">Total Bookings</th>
              <th className="py-3 px-4 font-medium">Lifetime Spend (UDF)</th>
              <th className="py-3 px-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
            {customers.map((c) => (
              <tr key={c.customer_id} className="hover:bg-[#F5F5F3]/50">
                <td className="py-3 px-4 font-mono font-bold text-[#737373]">#{c.customer_id}</td>
                <td className="py-3 px-4 font-semibold text-[#171717]">{c.full_name}</td>
                <td className="py-3 px-4 space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-[#737373]">
                    <Mail className="w-3 h-3" />
                    <span>{c.email}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[#737373]">
                    <Phone className="w-3 h-3" />
                    <span>{c.phone}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-1 text-[#737373]">
                    <MapPin className="w-3 h-3" />
                    <span>{c.city ? `${c.city}, ${c.state}` : 'Unspecified'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono font-bold">{c.vehicle_count} vehicles</td>
                <td className="py-3 px-4 font-mono">{c.total_bookings_count} bookings</td>
                <td className="py-3 px-4 font-mono font-bold text-[#2E6B47]">
                  ${Number(c.total_spending || 0).toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={c.is_active ? 'success' : 'danger'}>
                    {c.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

