'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CustomerProfilePage() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    emergencyContact: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.customerId) {
      apiRequest(`/api/customers/${user.customerId}`)
        .then((res) => {
          const d = res.data;
          setFormData({
            fullName: d.full_name || '',
            phone: d.phone || '',
            address: d.address || '',
            city: d.city || '',
            state: d.state || '',
            postalCode: d.postal_code || '',
            emergencyContact: d.emergency_contact || '',
          });
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.customerId) return;
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      await apiRequest(`/api/customers/${user.customerId}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setSuccess(true);
      refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Loading profile data...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-4 border-b border-[#E5E5E5]">
        <h1 className="text-xl font-bold text-[#171717]">Customer Profile Settings</h1>
        <p className="text-xs text-[#737373]">
          Manage contact information, emergency coordinates, and residential garage address
        </p>
      </div>

      {success && (
        <div className="p-3 bg-[#F2F7F4] border border-[#D1E7DD] rounded text-xs text-[#2E6B47] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Profile updated successfully in PostgreSQL database.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#FDF3F2] border border-[#FADBD8] rounded text-xs text-[#B83232] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card title="Personal Information">
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">Account Email (Immutable)</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 border border-[#E5E5E5] bg-[#F5F5F3] text-[#737373] rounded font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">Primary Phone</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">Emergency Contact Phone</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                  placeholder="+91 99999 00000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#171717] mb-1">Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
              >
                {saving ? 'Updating Database...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}

