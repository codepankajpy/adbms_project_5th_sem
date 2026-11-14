'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Wrench, Phone, Mail, Star, CheckCircle2 } from 'lucide-react';

export default function AdminMechanicsPage() {
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    apiRequest('/api/mechanics')
      .then((res) => setMechanics(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleAvailability = async (id: number, current: boolean) => {
    try {
      await apiRequest(`/api/mechanics/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable: !current }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update availability');
    }
  };

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Querying technician roster from view: mechanic_workload_view...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E5E5E5]">
        <h1 className="text-xl font-bold text-[#171717]">Mechanic Technicians Management</h1>
        <p className="text-xs text-[#737373]">
          Staff roster showing active bay allocations, customer ratings, hourly billing rates, and availability toggles
        </p>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
              <th className="py-3 px-4 font-medium">Tech ID</th>
              <th className="py-3 px-4 font-medium">Technician Name</th>
              <th className="py-3 px-4 font-medium">Contact</th>
              <th className="py-3 px-4 font-medium">Specialization</th>
              <th className="py-3 px-4 font-medium">Experience</th>
              <th className="py-3 px-4 font-medium">Labor Rate</th>
              <th className="py-3 px-4 font-medium">Active Jobs</th>
              <th className="py-3 px-4 font-medium">Total Completed</th>
              <th className="py-3 px-4 font-medium">Rating</th>
              <th className="py-3 px-4 font-medium text-right">Availability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
            {mechanics.map((m) => (
              <tr key={m.mechanic_id} className="hover:bg-[#F5F5F3]/50">
                <td className="py-3 px-4 font-mono font-bold text-[#737373]">#{m.mechanic_id}</td>
                <td className="py-3 px-4 font-semibold text-[#171717]">{m.mechanic_name}</td>
                <td className="py-3 px-4 text-[#737373] space-y-0.5">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>{m.mechanic_email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Phone className="w-3 h-3" />
                    <span>{m.mechanic_phone}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-[#171717] font-medium">{m.specialization}</td>
                <td className="py-3 px-4">{m.experience_years} years</td>
                <td className="py-3 px-4 font-mono font-semibold">${Number(m.hourly_rate).toFixed(2)}/hr</td>
                <td className="py-3 px-4">
                  <span className={`font-mono font-bold ${Number(m.current_active_jobs) > 0 ? 'text-[#D97736]' : 'text-[#737373]'}`}>
                    {m.current_active_jobs} jobs
                  </span>
                </td>
                <td className="py-3 px-4 font-mono">{m.total_completed_jobs}</td>
                <td className="py-3 px-4 font-semibold text-[#D97736]">
                  {m.average_rating} ★ ({m.total_reviews_received})
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => toggleAvailability(m.mechanic_id, m.is_available)}
                    className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                      m.is_available
                        ? 'bg-[#F2F7F4] text-[#2E6B47] border-[#D1E7DD] hover:bg-[#E2EFE7]'
                        : 'bg-[#FDF3F2] text-[#B83232] border-[#FADBD8] hover:bg-[#FAE1DF]'
                    }`}
                  >
                    {m.is_available ? 'AVAILABLE' : 'OFF DUTY'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

