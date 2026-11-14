'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Car, Search } from 'lucide-react';

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/vehicles')
      .then((res) => setVehicles(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = vehicles.filter(
    (v) =>
      v.registration_number.toLowerCase().includes(search.toLowerCase()) ||
      v.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      v.brand_name.toLowerCase().includes(search.toLowerCase()) ||
      v.model_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Querying vehicles registry from PostgreSQL...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E5E5E5] gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Vehicle Registry</h1>
          <p className="text-xs text-[#737373]">
            Database of customer-registered automobiles with lifetime maintenance expenditures
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#737373] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reg #, owner, make..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
              <th className="py-3 px-4 font-medium">Reg #</th>
              <th className="py-3 px-4 font-medium">Customer Owner</th>
              <th className="py-3 px-4 font-medium">Make & Model</th>
              <th className="py-3 px-4 font-medium">Specifications</th>
              <th className="py-3 px-4 font-medium">Odometer</th>
              <th className="py-3 px-4 font-medium">VIN</th>
              <th className="py-3 px-4 font-medium">Lifetime Service Cost (UDF)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-[#F5F5F3]/50">
                <td className="py-3 px-4 font-mono font-bold">{v.registration_number}</td>
                <td className="py-3 px-4">
                  <span className="font-semibold">{v.customer_name}</span>
                  <span className="text-[11px] text-[#737373] block">{v.customer_email}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold">{v.brand_name} {v.model_name}</span>
                  <span className="text-[11px] text-[#737373] block">{v.year} • {v.color}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="capitalize">{v.body_type} • {v.fuel_type}</span>
                  <Badge variant="outline" className="ml-1.5">{v.transmission}</Badge>
                </td>
                <td className="py-3 px-4 font-mono">{Number(v.mileage_km).toLocaleString()} km</td>
                <td className="py-3 px-4 font-mono text-[11px] text-[#737373]">{v.vin}</td>
                <td className="py-3 px-4 font-mono font-bold text-[#D97736]">
                  ${Number(v.lifetime_service_cost || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

