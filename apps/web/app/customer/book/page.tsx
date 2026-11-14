'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Calendar, Clock, AlertCircle, CheckCircle2, Car, Shield } from 'lucide-react';

export default function BookAppointmentPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState<any>(null);

  const [formData, setFormData] = useState({
    vehicleId: '',
    bookingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '09:00 - 10:00',
    serviceIds: [] as number[],
    customerNotes: '',
  });

  useEffect(() => {
    Promise.all([apiRequest('/api/vehicles'), apiRequest('/api/services/catalog')])
      .then(([vRes, sRes]) => {
        setVehicles(vRes.data || []);
        setServices(sRes.data?.services || []);
        if (vRes.data?.length > 0) {
          setFormData((prev) => ({ ...prev, vehicleId: vRes.data[0].id.toString() }));
        }
        if (sRes.data?.services?.length > 0) {
          setFormData((prev) => ({ ...prev, serviceIds: [sRes.data.services[0].id] }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const toggleService = (id: number) => {
    setFormData((prev) => {
      const exists = prev.serviceIds.includes(id);
      if (exists) {
        if (prev.serviceIds.length === 1) return prev; // At least one service required
        return { ...prev, serviceIds: prev.serviceIds.filter((sId) => sId !== id) };
      } else {
        return { ...prev, serviceIds: [...prev.serviceIds, id] };
      }
    });
  };

  const calculatedTotal = services
    .filter((s) => formData.serviceIds.includes(s.id))
    .reduce((acc, s) => acc + Number(s.base_price), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: parseInt(formData.vehicleId, 10),
          bookingDate: formData.bookingDate,
          timeSlot: formData.timeSlot,
          serviceIds: formData.serviceIds,
          customerNotes: formData.customerNotes,
        }),
      });

      setSuccessInfo(res.data);
    } catch (err: any) {
      setError(err.message || 'Booking rejected by database constraints or slot availability.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Preparing appointment booking interface...</div>;
  }

  if (successInfo) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <div className="border border-[#D1E7DD] bg-[#F2F7F4] rounded-lg p-8 text-center">
          <div className="w-12 h-12 bg-[#2E6B47] text-white rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#171717] mb-1">Appointment Confirmed!</h2>
          <p className="text-xs text-[#737373] mb-4">
            Successfully generated and verified by PostgreSQL stored procedure <code className="font-mono font-bold">book_service_appointment()</code>.
          </p>

          <div className="bg-white border border-[#E5E5E5] rounded p-4 text-left text-xs space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-[#737373]">Booking Number:</span>
              <span className="font-mono font-bold text-[#171717]">{successInfo.bookingNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Internal Database ID:</span>
              <span className="font-mono text-[#171717]">{successInfo.bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Initial Status:</span>
              <span className="font-semibold text-[#D97736]">pending</span>
            </div>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={() => router.push('/customer/bookings')}
              className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors"
            >
              View My Bookings
            </button>
            <button
              onClick={() => {
                setSuccessInfo(null);
                setFormData((prev) => ({ ...prev, customerNotes: '' }));
              }}
              className="px-4 py-2 bg-white border border-[#E5E5E5] hover:bg-[#F5F5F3] text-[#171717] text-xs font-medium rounded transition-colors"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-4 border-b border-[#E5E5E5]">
        <h1 className="text-xl font-bold text-[#171717]">Book Service Appointment</h1>
        <p className="text-xs text-[#737373]">
          Atomic transaction inserting into service_bookings and booking_services with capacity checks
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#FDF3F2] border border-[#FADBD8] rounded text-xs text-[#B83232] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {vehicles.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <Car className="w-8 h-8 text-[#737373] mx-auto mb-2" />
            <div className="text-xs font-semibold text-[#171717]">No vehicle registered yet</div>
            <p className="text-[11px] text-[#737373] mt-0.5 mb-3">You must register an automobile before booking an appointment.</p>
            <button
              onClick={() => router.push('/customer/vehicles')}
              className="px-3 py-1.5 bg-[#111111] text-white text-xs font-medium rounded"
            >
              Register Vehicle First
            </button>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Card title="1. Select Vehicle & Schedule Slot">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">Your Vehicle</label>
                <select
                  required
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} - {v.brand_name} {v.model_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">Service Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.bookingDate}
                  onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">Workshop Time Slot</label>
                <select
                  required
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                >
                  <option value="09:00 - 10:00">09:00 - 10:00</option>
                  <option value="10:00 - 11:00">10:00 - 11:00</option>
                  <option value="11:00 - 12:00">11:00 - 12:00</option>
                  <option value="14:00 - 15:00">14:00 - 15:00</option>
                  <option value="15:00 - 16:00">15:00 - 16:00</option>
                </select>
              </div>
            </div>
          </Card>

          <Card title="2. Select Required Services (Multi-Select)" subtitle="Services will be linked atomically in bridge table booking_services">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {services.map((s) => {
                const isSelected = formData.serviceIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={`p-3 border rounded cursor-pointer transition-colors flex items-start justify-between ${
                      isSelected
                        ? 'border-[#111111] bg-[#F5F5F3]'
                        : 'border-[#E5E5E5] hover:border-[#CCCCCC] bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#171717]">{s.name}</div>
                      <div className="text-[11px] text-[#737373] mt-0.5">{s.estimated_duration_minutes} mins duration</div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-xs font-mono font-bold text-[#171717]">${Number(s.base_price).toFixed(2)}</div>
                      <div className={`w-3.5 h-3.5 rounded-full border mt-1 ml-auto flex items-center justify-center ${isSelected ? 'bg-[#111111] border-[#111111]' : 'border-[#CCCCCC]'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="3. Special Instructions & Notes">
            <textarea
              rows={3}
              value={formData.customerNotes}
              onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
              placeholder="e.g. Check slight squeaking sound on left front wheel during cold mornings..."
            />
          </Card>

          {/* Submission and Total Summary */}
          <div className="bg-white border border-[#E5E5E5] rounded p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#737373] block">Estimated Subtotal ({formData.serviceIds.length} service selected):</span>
              <span className="text-xl font-mono font-bold text-[#171717]">
                ${calculatedTotal.toFixed(2)}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
            >
              {submitting ? 'Executing Stored Procedure...' : 'Confirm Appointment Booking'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

