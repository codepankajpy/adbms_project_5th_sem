'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { Wrench, CheckCircle2, Clock, AlertCircle, Car, ArrowRight, Play, Check } from 'lucide-react';

export default function MechanicDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [serviceRecord, setServiceRecord] = useState({
    odometerReading: 35000,
    workPerformed: '',
    partsReplaced: '',
    diagnosticNotes: '',
  });

  const loadData = () => {
    apiRequest('/api/dashboard/stats')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartJob = async (bookingId: number) => {
    try {
      await apiRequest(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Status transition rejected');
    }
  };

  const openCompleteModal = (job: any) => {
    setActiveJob(job);
    setServiceRecord({
      odometerReading: 30000,
      workPerformed: 'Performed multi-point diagnostic, oil replacement and checked tire pressures.',
      partsReplaced: 'OEM Filter Element, 0W-20 Motor Oil',
      diagnosticNotes: 'All electronic modules scanned OK. Zero active DTCs.',
    });
    setError('');
    setCompleteModalOpen(true);
  };

  const handleCompleteService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob) return;
    setError('');
    setSubmitting(true);

    try {
      // Calls stored procedure complete_service
      await apiRequest(`/api/bookings/${activeJob.booking_id}/complete`, {
        method: 'POST',
        body: JSON.stringify(serviceRecord),
      });

      setCompleteModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Service completion procedure failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Querying technician workload metrics...</div>;
  }

  const metrics = data?.metrics || {};
  const activeJobs = data?.activeJobs || [];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E5E5E5]">
        <h1 className="text-xl font-bold text-[#171717]">Mechanic Workshop Terminal</h1>
        <p className="text-xs text-[#737373]">
          Job allocation bay, technical inspection logs, and stored procedure completion workflows
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs text-[#737373] mb-1">Technician Specialization</div>
          <div className="text-sm font-bold text-[#171717] truncate">{metrics.specialization || 'General Diagnostic'}</div>
          <div className="text-[11px] text-[#737373] mt-1">Master Workshop Staff</div>
        </Card>

        <Card>
          <div className="text-xs text-[#737373] mb-1">Jobs Completed</div>
          <div className="text-2xl font-extrabold text-[#171717]">{metrics.completed_jobs_count || 0}</div>
          <div className="text-[11px] text-[#737373] mt-1">Via get_mechanic_completed_jobs()</div>
        </Card>

        <Card>
          <div className="text-xs text-[#737373] mb-1">Customer Satisfaction</div>
          <div className="text-2xl font-extrabold text-[#D97736]">{metrics.average_rating || '5.00'} ★</div>
          <div className="text-[11px] text-[#737373] mt-1">Based on verified reviews</div>
        </Card>

        <Card>
          <div className="text-xs text-[#737373] mb-1">Logged Service Hours</div>
          <div className="text-2xl font-extrabold text-[#171717]">{metrics.total_service_hours || '0.00'} hrs</div>
          <div className="text-[11px] text-[#737373] mt-1">Time elapsed in workshop bays</div>
        </Card>
      </div>

      {/* Assigned Active Jobs */}
      <div>
        <h2 className="text-sm font-bold text-[#171717] mb-3">Currently Assigned Workshop Jobs</h2>

        {activeJobs.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-xs text-[#737373]">
              <CheckCircle2 className="w-8 h-8 text-[#2E6B47] mx-auto mb-2" />
              <div className="font-semibold text-[#171717]">All assigned jobs are cleared!</div>
              <p className="text-[11px] mt-0.5">No active vehicles currently awaiting service in your bay.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeJobs.map((job: any) => (
              <Card key={job.booking_id} className="border-l-4 border-l-[#111111]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-mono font-bold bg-[#F5F5F3] px-2 py-0.5 rounded border border-[#E5E5E5]">
                      {job.booking_number}
                    </span>
                    <h3 className="text-sm font-bold text-[#171717] mt-1.5">
                      {job.brand} {job.model} ({job.registration_number})
                    </h3>
                  </div>
                  <Badge variant={job.booking_status === 'in_progress' ? 'accent' : 'warning'}>
                    {job.booking_status.toUpperCase()}
                  </Badge>
                </div>

                <div className="text-xs text-[#737373] space-y-1.5 border-t border-[#E5E5E5] pt-3 mb-4">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="text-[#171717] font-medium">{job.customer_name} ({job.customer_phone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scheduled Slot:</span>
                    <span className="text-[#171717] font-medium">{job.booking_date} • {job.time_slot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Services Required:</span>
                    <span className="text-[#171717] font-medium max-w-[200px] truncate text-right">
                      {job.booked_services_list}
                    </span>
                  </div>
                  {job.customer_notes && (
                    <div className="p-2 bg-[#F5F5F3] rounded text-[11px] text-[#171717] mt-1">
                      <strong className="block text-[#737373]">Customer Note:</strong>
                      {job.customer_notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E5E5E5]">
                  {job.booking_status === 'confirmed' && (
                    <button
                      onClick={() => handleStartJob(job.booking_id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>Bring Vehicle into Bay (Start)</span>
                    </button>
                  )}

                  {job.booking_status === 'in_progress' && (
                    <button
                      onClick={() => openCompleteModal(job)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#2E6B47] hover:bg-[#25573A] text-white text-xs font-medium rounded transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete Service & Record Work</span>
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Complete Service Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title={`Complete Service - ${activeJob?.booking_number || ''}`}
        description="Executes stored procedure complete_service: writes service_records & auto-generates invoice"
        maxWidth="max-w-xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-[#FDF3F2] border border-[#FADBD8] rounded text-xs text-[#B83232] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCompleteService} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Odometer Reading (km)</label>
            <input
              type="number"
              required
              min={0}
              value={serviceRecord.odometerReading}
              onChange={(e) => setServiceRecord({ ...serviceRecord, odometerReading: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded font-mono focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Work Performed (Detailed Log)</label>
            <textarea
              required
              rows={3}
              value={serviceRecord.workPerformed}
              onChange={(e) => setServiceRecord({ ...serviceRecord, workPerformed: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Parts Replaced & Consumables Used</label>
            <input
              type="text"
              value={serviceRecord.partsReplaced}
              onChange={(e) => setServiceRecord({ ...serviceRecord, partsReplaced: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
              placeholder="e.g. Brake pads set, oil filter, 4L synthetic fluid"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Diagnostic Notes & Vehicle Health</label>
            <textarea
              rows={2}
              value={serviceRecord.diagnosticNotes}
              onChange={(e) => setServiceRecord({ ...serviceRecord, diagnosticNotes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
              placeholder="e.g. Tire tread depths at 6mm; battery test passed at 98%"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setCompleteModalOpen(false)}
              className="px-3 py-1.5 text-xs text-[#737373] border border-[#E5E5E5] rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs bg-[#111111] hover:bg-black text-white font-medium rounded transition-colors disabled:opacity-50"
            >
              {submitting ? 'Executing Stored Procedure...' : 'Complete & Finalize Job'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

