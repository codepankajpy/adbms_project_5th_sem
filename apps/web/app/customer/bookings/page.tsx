'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Modal } from '../../../components/Modal';
import { Calendar, Clock, Star, AlertCircle, CheckCircle2, ChevronRight, Eye } from 'lucide-react';

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadBookings = () => {
    apiRequest('/api/bookings')
      .then((res) => setBookings(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const openDetails = async (bookingId: number) => {
    try {
      const res = await apiRequest(`/api/bookings/${bookingId}`);
      setSelectedBooking(res.data);
      setDetailModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setSubmittingReview(true);

    try {
      await apiRequest(`/api/bookings/${selectedBooking.booking.booking_id}/review`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });
      setReviewModalOpen(false);
      setDetailModalOpen(false);
      loadBookings();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Fetching customer bookings from PostgreSQL...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E5E5E5]">
        <h1 className="text-xl font-bold text-[#171717]">My Service Appointments</h1>
        <p className="text-xs text-[#737373]">
          Track status transitions, inspection reports, and technician assignments in real-time
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-xs text-[#737373]">
            No appointments booked yet. Click "Book Appointment" in navigation to schedule service.
          </div>
        </Card>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
                <th className="py-3 px-4 font-medium">Booking #</th>
                <th className="py-3 px-4 font-medium">Vehicle</th>
                <th className="py-3 px-4 font-medium">Date & Slot</th>
                <th className="py-3 px-4 font-medium">Services</th>
                <th className="py-3 px-4 font-medium">Mechanic</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Total</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
              {bookings.map((b) => (
                <tr key={b.booking_id} className="hover:bg-[#F5F5F3]/50">
                  <td className="py-3 px-4 font-mono font-bold text-[#171717]">{b.booking_number}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold">{b.brand} {b.model}</span>
                    <span className="text-[11px] text-[#737373] block">{b.registration_number}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>{b.booking_date}</div>
                    <div className="text-[11px] text-[#737373]">{b.time_slot}</div>
                  </td>
                  <td className="py-3 px-4 max-w-[180px] truncate text-[#737373]">{b.booked_services_list}</td>
                  <td className="py-3 px-4">{b.mechanic_name || 'Unassigned'}</td>
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
                  <td className="py-3 px-4 font-mono font-semibold">${Number(b.total_estimated_cost).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openDetails(b.booking_id)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-[#171717] hover:bg-[#F5F5F3] border border-[#E5E5E5] rounded transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Details Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Appointment ${selectedBooking?.booking?.booking_number || ''}`}
        description="Comprehensive audit timeline and technical service records"
        maxWidth="max-w-2xl"
      >
        {selectedBooking && (
          <div className="space-y-4 text-xs">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F5F5F3] rounded border border-[#E5E5E5]">
              <div>
                <span className="text-[#737373] block">Vehicle:</span>
                <span className="font-semibold text-[#171717]">
                  {selectedBooking.booking.brand} {selectedBooking.booking.model} ({selectedBooking.booking.registration_number})
                </span>
              </div>
              <div>
                <span className="text-[#737373] block">Scheduled:</span>
                <span className="font-semibold text-[#171717]">
                  {selectedBooking.booking.booking_date} • {selectedBooking.booking.time_slot}
                </span>
              </div>
              <div>
                <span className="text-[#737373] block">Current Status:</span>
                <Badge variant={selectedBooking.booking.booking_status === 'completed' ? 'success' : 'accent'}>
                  {selectedBooking.booking.booking_status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-[#737373] block">Assigned Technician:</span>
                <span className="font-semibold text-[#171717]">{selectedBooking.booking.mechanic_name || 'None'}</span>
              </div>
            </div>

            {/* Booked Services List */}
            <div>
              <h4 className="font-bold text-[#171717] mb-2">Booked Line Items</h4>
              <div className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded">
                {selectedBooking.services.map((s: any) => (
                  <div key={s.service_id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-[#171717]">{s.name}</span>
                      <p className="text-[11px] text-[#737373]">{s.description}</p>
                    </div>
                    <span className="font-mono font-bold">${Number(s.unit_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Record if Completed */}
            {selectedBooking.serviceRecord && (
              <div className="p-3 bg-[#F2F7F4] border border-[#D1E7DD] rounded">
                <h4 className="font-bold text-[#2E6B47] mb-1">Technician Inspection & Work Log</h4>
                <div className="text-[#171717] space-y-1">
                  <div><strong>Work Performed:</strong> {selectedBooking.serviceRecord.work_performed}</div>
                  <div><strong>Parts Replaced:</strong> {selectedBooking.serviceRecord.parts_replaced || 'None'}</div>
                  <div><strong>Diagnostic Notes:</strong> {selectedBooking.serviceRecord.diagnostic_notes}</div>
                  <div><strong>Odometer Recorded:</strong> {selectedBooking.serviceRecord.odometer_reading} km</div>
                </div>
              </div>
            )}

            {/* Lifecycle Status History Timeline */}
            <div>
              <h4 className="font-bold text-[#171717] mb-2">State Machine Audit Trail (service_status_history)</h4>
              <div className="space-y-2 border-l-2 border-[#111111] pl-3">
                {selectedBooking.statusHistory.map((h: any) => (
                  <div key={h.id} className="text-[11px]">
                    <div className="font-medium text-[#171717]">
                      {h.previous_status ? `${h.previous_status} → ` : 'Initiated: '}
                      <span className="font-bold uppercase text-[#D97736]">{h.new_status}</span>
                    </div>
                    <div className="text-[#737373]">
                      {h.change_reason} • {new Date(h.changed_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating / Review */}
            {selectedBooking.booking.booking_status === 'completed' && (
              <div className="pt-2 border-t border-[#E5E5E5] flex justify-between items-center">
                {selectedBooking.review ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-[#737373]">Your Review:</span>
                    <div className="flex items-center text-[#D97736]">
                      {Array.from({ length: selectedBooking.review.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="italic text-[#737373]">"{selectedBooking.review.comment}"</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="px-3 py-1.5 bg-[#111111] text-white text-xs rounded hover:bg-black font-medium"
                  >
                    Rate & Review Service
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Submit Customer Review"
        description="Persisted in reviews table with rating check constraint (1-5)"
      >
        <form onSubmit={submitReview} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Rating (1 to 5 Stars)</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReviewData({ ...reviewData, rating: star })}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= reviewData.rating ? 'text-[#D97736] fill-[#D97736]' : 'text-[#CCCCCC]'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Feedback & Comments</label>
            <textarea
              required
              rows={3}
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
              placeholder="Describe technician expertise, turnaround time, vehicle smoothness..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="px-3 py-1.5 text-xs text-[#737373] border border-[#E5E5E5] rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-4 py-1.5 text-xs bg-[#111111] hover:bg-black text-white font-medium rounded"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

