'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/payments')
      .then((res) => setPayments(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Querying payment ledger from PostgreSQL...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E5E5E5]">
        <h1 className="text-xl font-bold text-[#171717]">Payment Transactions Ledger</h1>
        <p className="text-xs text-[#737373]">
          Audit log of settled financial transactions, payment methods, gateway transaction IDs, and settlement dates
        </p>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
              <th className="py-3 px-4 font-medium">Payment Ref #</th>
              <th className="py-3 px-4 font-medium">Customer</th>
              <th className="py-3 px-4 font-medium">Invoice #</th>
              <th className="py-3 px-4 font-medium">Amount Cleared</th>
              <th className="py-3 px-4 font-medium">Method</th>
              <th className="py-3 px-4 font-medium">Transaction / Gateway ID</th>
              <th className="py-3 px-4 font-medium">Settlement Date</th>
              <th className="py-3 px-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-[#F5F5F3]/50">
                <td className="py-3 px-4 font-mono font-bold text-[#171717]">{p.payment_reference}</td>
                <td className="py-3 px-4">
                  <span className="font-semibold">{p.customer_name}</span>
                  <span className="text-[11px] text-[#737373] block">{p.customer_email}</span>
                </td>
                <td className="py-3 px-4 font-mono text-[#737373]">{p.invoice_number}</td>
                <td className="py-3 px-4 font-mono font-bold text-[#2E6B47]">${Number(p.amount).toFixed(2)}</td>
                <td className="py-3 px-4">
                  <span className="font-mono uppercase font-semibold text-[#171717]">{p.payment_method}</span>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-[#737373]">{p.transaction_id || 'N/A'}</td>
                <td className="py-3 px-4">{new Date(p.payment_date).toLocaleString()}</td>
                <td className="py-3 px-4">
                  <Badge variant={p.status === 'completed' ? 'success' : p.status === 'failed' ? 'danger' : 'warning'}>
                    {p.status.toUpperCase()}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

