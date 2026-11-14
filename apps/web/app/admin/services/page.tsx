'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Modal } from '../../../components/Modal';
import { PlusCircle, Edit2, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: 1,
    name: '',
    description: '',
    basePrice: 1000,
    estimatedDurationMinutes: 60,
  });

  const loadData = async () => {
    try {
      const [sRes, catRes] = await Promise.all([
        apiRequest('/api/services'),
        apiRequest('/api/services/catalog'),
      ]);
      setServices(sRes.data || []);
      setCategories(catRes.data?.categories || []);
      if (catRes.data?.categories?.length > 0) {
        setFormData((prev) => ({ ...prev, categoryId: catRes.data.categories[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingService(null);
    setFormData({
      categoryId: categories[0]?.id || 1,
      name: '',
      description: '',
      basePrice: 1200,
      estimatedDurationMinutes: 60,
    });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (s: any) => {
    setEditingService(s);
    setFormData({
      categoryId: s.category_id,
      name: s.name,
      description: s.description || '',
      basePrice: Number(s.base_price),
      estimatedDurationMinutes: s.estimated_duration_minutes,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (editingService) {
        await apiRequest(`/api/services/${editingService.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await apiRequest('/api/services', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Querying service menu from PostgreSQL...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Service Catalog & Pricing</h1>
          <p className="text-xs text-[#737373]">
            Standardized catalog operations, booking frequencies, and cumulative revenue performance
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add New Service</span>
        </button>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
              <th className="py-3 px-4 font-medium">ID</th>
              <th className="py-3 px-4 font-medium">Service Name</th>
              <th className="py-3 px-4 font-medium">Category</th>
              <th className="py-3 px-4 font-medium">Base Price</th>
              <th className="py-3 px-4 font-medium">Duration</th>
              <th className="py-3 px-4 font-medium">Times Booked</th>
              <th className="py-3 px-4 font-medium">Revenue Earned</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-[#F5F5F3]/50">
                <td className="py-3 px-4 font-mono font-bold text-[#737373]">#{s.id}</td>
                <td className="py-3 px-4">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-[11px] text-[#737373] block truncate max-w-[250px]">{s.description}</span>
                </td>
                <td className="py-3 px-4 font-medium text-[#737373]">{s.category_name}</td>
                <td className="py-3 px-4 font-mono font-bold text-[#171717]">${Number(s.base_price).toFixed(2)}</td>
                <td className="py-3 px-4">{s.estimated_duration_minutes} mins</td>
                <td className="py-3 px-4 font-mono">{s.total_times_booked} times</td>
                <td className="py-3 px-4 font-mono font-bold text-[#2E6B47]">${Number(s.total_revenue_earned).toFixed(2)}</td>
                <td className="py-3 px-4">
                  <Badge variant={s.is_active ? 'success' : 'outline'}>
                    {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => openEdit(s)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-[#171717] hover:bg-[#F5F5F3] border border-[#E5E5E5] rounded"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? 'Edit Service Offering' : 'Create New Service Offering'}
        description="Persisted in services table with category foreign key & check constraints"
      >
        {error && (
          <div className="mb-4 p-3 bg-[#FDF3F2] border border-[#FADBD8] rounded text-xs text-[#B83232] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {!editingService && (
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">Service Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Service Title</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
              placeholder="e.g. Laser Wheel Alignment"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Detailed Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">Base Price ($)</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded font-mono focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">Duration (Minutes)</label>
              <input
                type="number"
                required
                min={15}
                step={15}
                value={formData.estimatedDurationMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedDurationMinutes: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3 py-1.5 text-xs text-[#737373] border border-[#E5E5E5] rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs bg-[#111111] hover:bg-black text-white font-medium rounded disabled:opacity-50"
            >
              {submitting ? 'Saving to Database...' : editingService ? 'Update Service' : 'Insert Service'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

