'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Clock, PlusCircle, Sparkles } from 'lucide-react';

export default function CustomerServicesPage() {
  const [data, setData] = useState<{ categories: any[]; services: any[] }>({ categories: [], services: [] });
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/services/catalog')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Loading service catalog from PostgreSQL...</div>;
  }

  const filteredServices =
    selectedCategory === 'all'
      ? data.services
      : data.services.filter((s) => s.category_id === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Automotive Services Catalog</h1>
          <p className="text-xs text-[#737373]">
            Standardized repair and preventative maintenance menu with transparent labor pricing
          </p>
        </div>
        <Link
          href="/customer/book"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Book an Appointment</span>
        </Link>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-white text-[#737373] hover:text-[#171717] border-[#E5E5E5]'
          }`}
        >
          All Services ({data.services.length})
        </button>
        {data.categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
              selectedCategory === c.id
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-[#737373] hover:text-[#171717] border-[#E5E5E5]'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredServices.map((s) => (
          <Card key={s.id} className="flex flex-col justify-between">
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-[#D97736] tracking-wider mb-1">
                {s.category_name}
              </div>
              <h3 className="text-sm font-bold text-[#171717] mb-1.5">{s.name}</h3>
              <p className="text-xs text-[#737373] leading-relaxed mb-4">{s.description}</p>
            </div>

            <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between">
              <div className="flex items-center space-x-1 text-xs text-[#737373]">
                <Clock className="w-3.5 h-3.5" />
                <span>{s.estimated_duration_minutes} mins</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#737373] block">Base Price</span>
                <span className="text-sm font-mono font-bold text-[#171717]">
                  ${Number(s.base_price).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

