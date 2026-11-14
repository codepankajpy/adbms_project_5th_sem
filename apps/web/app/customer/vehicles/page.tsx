'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Modal } from '../../../components/Modal';
import { Car, PlusCircle, Wrench, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CustomerVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<{ brands: any[]; models: any[] }>({ brands: [], models: [] });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    modelId: '',
    registrationNumber: '',
    vin: '',
    year: new Date().getFullYear(),
    color: 'Pearl White',
    mileageKm: 15000,
    transmission: 'manual',
  });

  const loadData = async () => {
    try {
      const [vRes, cRes] = await Promise.all([
        apiRequest('/api/vehicles'),
        apiRequest('/api/vehicles/catalog'),
      ]);
      setVehicles(vRes.data || []);
      setCatalog(cRes.data || { brands: [], models: [] });
      if (cRes.data?.models?.length > 0 && !formData.modelId) {
        setFormData((prev) => ({ ...prev, modelId: cRes.data.models[0].id.toString() }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await apiRequest('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          modelId: parseInt(formData.modelId, 10),
          registrationNumber: formData.registrationNumber,
          vin: formData.vin,
          year: parseInt(formData.year.toString(), 10),
          color: formData.color,
          mileageKm: parseInt(formData.mileageKm.toString(), 10),
          transmission: formData.transmission,
        }),
      });

      setModalOpen(false);
      setFormData({
        modelId: catalog.models[0]?.id?.toString() || '',
        registrationNumber: '',
        vin: '',
        year: new Date().getFullYear(),
        color: 'Pearl White',
        mileageKm: 10000,
        transmission: 'manual',
      });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to register vehicle in PostgreSQL');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Querying customer garage from PostgreSQL...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">My Registered Vehicles</h1>
          <p className="text-xs text-[#737373]">
            Track your fleet assets, odometer readings, and cumulative service expenditures
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vehicles.map((v) => (
          <Card key={v.id} className="relative">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-mono font-bold bg-[#F5F5F3] px-2 py-0.5 rounded border border-[#E5E5E5]">
                  {v.registration_number}
                </span>
                <h3 className="text-sm font-bold text-[#171717] mt-1.5">
                  {v.brand_name} {v.model_name}
                </h3>
              </div>
              <Badge variant="outline">{v.transmission.toUpperCase()}</Badge>
            </div>

            <div className="space-y-1.5 text-xs text-[#737373] border-t border-[#E5E5E5] pt-3">
              <div className="flex justify-between">
                <span>Body & Fuel:</span>
                <span className="text-[#171717] font-medium">{v.body_type} • {v.fuel_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Model Year / Color:</span>
                <span className="text-[#171717] font-medium">{v.year} • {v.color}</span>
              </div>
              <div className="flex justify-between">
                <span>Odometer:</span>
                <span className="text-[#171717] font-mono font-medium">{Number(v.mileage_km).toLocaleString()} km</span>
              </div>
              <div className="flex justify-between">
                <span>VIN:</span>
                <span className="text-[#171717] font-mono text-[11px] truncate max-w-[150px]">{v.vin}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-[#E5E5E5] pt-2 text-[#171717]">
                <span className="font-semibold">Lifetime Service Cost:</span>
                <span className="font-mono font-bold text-[#D97736]">
                  ${Number(v.lifetime_service_cost || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register Vehicle Asset"
        description="Creates row in vehicles relation with relational check constraints & unique VIN"
      >
        {error && (
          <div className="mb-4 p-3 bg-[#FDF3F2] border border-[#FADBD8] rounded text-xs text-[#B83232] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Select Automobile Model</label>
            <select
              required
              value={formData.modelId}
              onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
            >
              {catalog.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brand_name} - {m.model_name} ({m.body_type}, {m.fuel_type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">Registration # (Unique)</label>
              <input
                type="text"
                required
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                placeholder="KA-01-AB-1234"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">VIN (Unique 17-char)</label>
              <input
                type="text"
                required
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                placeholder="1HGCR2F83HA001999"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">Manufacturing Year</label>
              <input
                type="number"
                required
                min={1980}
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">Color</label>
              <input
                type="text"
                required
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
                placeholder="Silver"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">Transmission</label>
              <select
                value={formData.transmission}
                onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Current Mileage (km)</label>
            <input
              type="number"
              required
              min={0}
              value={formData.mileageKm}
              onChange={(e) => setFormData({ ...formData, mileageKm: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3 py-1.5 text-xs text-[#737373] hover:text-[#171717] border border-[#E5E5E5] rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs bg-[#111111] hover:bg-black text-white font-medium rounded disabled:opacity-50"
            >
              {submitting ? 'Inserting into PostgreSQL...' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

