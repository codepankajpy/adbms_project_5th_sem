'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Modal } from '../../../components/Modal';
import { Calendar, UserCheck, Eye, AlertCircle, Wrench, FilePlus } from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    Promise.all([apiRequest('/api/bookings'), apiRequest('/api/mechanics')])
      .then(([bRes, mRes]) => {
        setBookings(bRes.data || []);
        const avail = (mRes.data || []).filter((m: any) => m.is_available);
        setMechanics(avail);
        if (avail.length > 0) setSelectedMechanicId(avail[0].mechanic_id.toString());
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssign = (b: any) => {
    setSelectedBooking(b);
    setAssignNotes('Allocated bay for standard technical maintenance');
    setError('');
    setAssignModalOpen(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setError('');
    setSubmitting(true);

    try {
      // Calls stored procedure assign_mechanic
      await apiRequest(`/api/bookings/${selectedBooking.booking_id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          mechanicId: parseInt(selectedMechanicId, 10),
          mechanicNotes: assignNotes,
        }),
      });

      setAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Assignment rejected by database guardrails');
    } finally {
      setSubmitting(false);
    }
  };

  const generateInvoice = async (bookingId: number) => {
    try {
      await apiRequest('/api/invoices/generate', {
        method: 'POST',
        body: JSON.stringify({ bookingId, discountAmount: 0 }),
      });
      alert('Invoice generated successfully via stored procedure generate_invoice()');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Invoice generation error');
    }
  };

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Querying appointments from view: booking_details_view...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E5E5E5]">
        <h1 className="text-xl font-bold text-[#171717]">Appointment Scheduling & Dispatch</h1>
        <p className="text-xs text-[#737373]">
          Workshop bay allocation, technician dispatching via stored procedure, and lifecycle management
        </p>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
              <th className="py-3 px-4 font-medium">Booking #</th>
              <th className="py-3 px-4 font-medium">Customer</th>
              <th className="py-3 px-4 font-medium">Vehicle</th>
              <th className="py-3 px-4 font-medium">Schedule</th>
              <th className="py-3 px-4 font-medium">Services</th>
              <th className="py-3 px-4 font-medium">Assigned Tech</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Est. Cost</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
            {bookings.map((b) => (
              <tr key={b.booking_id} className="hover:bg-[#F5F5F3]/50">
                <td className="py-3 px-4 font-mono font-bold text-[#171717]">{b.booking_number}</td>
                <td className="py-3 px-4">
                  <span className="font-semibold">{b.customer_name}</span>
                  <span className="text-[11px] text-[#737373] block">{b.customer_phone}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium">{b.brand} {b.model}</span>
                  <span className="text-[11px] text-[#737373] block font-mono">{b.registration_number}</span>
                </td>
                <td className="py-3 px-4">
                  <div>{b.booking_date}</div>
                  <div className="text-[11px] text-[#737373]">{b.time_slot}</div>
                </td>
                <td className="py-3 px-4 max-w-[160px] truncate text-[#737373]">{b.booked_services_list}</td>
                <td className="py-3 px-4">
                  {b.mechanic_name ? (
                    <span className="font-medium">{b.mechanic_name}</span>
                  ) : (
                    <span className="text-[#D97736] font-medium">Unassigned</span>
                  )}
                </td>
                <td className="py-3 px-4">
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
                <td className="py-3 px-4 font-mono font-bold">${Number(b.total_estimated_cost).toFixed(2)}</td>
                <td className="py-3 px-4 text-right space-x-1.5">
                  {b.booking_status !== 'completed' && b.booking_status !== 'cancelled' && (
                    <button
                      onClick={() => openAssign(b)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-white bg-[#111111] hover:bg-black rounded"
                      title="Assign certified technician"
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>Assign</span>
                    </button>
                  )}

                  {b.booking_status === 'completed' && !b.invoice_id && (
                    <button
                      onClick={() => generateInvoice(b.booking_id)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-[#2E6B47] border border-[#D1E7DD] bg-[#F2F7F4] hover:bg-[#E2EFE7] rounded"
                      title="Generate customer bill via stored procedure"
                    >
                      <FilePlus className="w-3 h-3" />
                      <span>Invoice</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mechanic Assignment Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Mechanic - ${selectedBooking?.booking_number || ''}`}
        description="Executes stored procedure assign_mechanic with max 3 concurrent workload guardrail"
      >
        {error && (
          <div className="mb-4 p-3 bg-[#FDF3F2] border border-[#FADBD8] rounded text-xs text-[#B83232] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAssign} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Select Available Specialist</label>
            <select
              required
              value={selectedMechanicId}
              onChange={(e) => setSelectedMechanicId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
            >
              {mechanics.map((m) => (
                <option key={m.mechanic_id} value={m.mechanic_id}>
                  {m.mechanic_name} - {m.specialization} ({m.current_active_jobs} active jobs, {m.average_rating}★)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Dispatch Instructions & Notes</label>
            <textarea
              rows={2}
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-3 py-1.5 text-xs text-[#737373] border border-[#E5E5E5] rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs bg-[#111111] hover:bg-black text-white font-medium rounded disabled:opacity-50"
            >
              {submitting ? 'Executing Procedure...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

