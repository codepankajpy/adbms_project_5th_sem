'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AdminReportsPage() {
  const [revenueMonthly, setRevenueMonthly] = useState<any[]>([]);
  const [pendingReceivables, setPendingReceivables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest('/api/dashboard/stats'),
      apiRequest('/api/invoices/pending-receivables'),
    ])
      .then(([statsRes, pendRes]) => {
        setRevenueMonthly(statsRes.data?.revenueMonthly || []);
        setPendingReceivables(pendRes.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Compiling financial intelligence from database views...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E5E5E5]">
        <h1 className="text-xl font-bold text-[#171717]">Workshop Financial Reports & Analytics</h1>
        <p className="text-xs text-[#737373]">
          Aggregated reporting generated through PostgreSQL views <code className="font-mono font-bold">revenue_summary_view</code> and <code className="font-mono font-bold">pending_payments_view</code>
        </p>
      </div>

      {/* Revenue Summary View */}
      <Card
        title="Monthly Financial Ledger Overview"
        subtitle="Aggregated from invoices and payments joined with TO_CHAR(issued_at, 'YYYY-MM')"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
                <th className="py-2.5 px-3 font-medium">Month</th>
                <th className="py-2.5 px-3 font-medium">Invoices Issued</th>
                <th className="py-2.5 px-3 font-medium">Gross Subtotal</th>
                <th className="py-2.5 px-3 font-medium">Tax Collected (18%)</th>
                <th className="py-2.5 px-3 font-medium">Discounts Granted</th>
                <th className="py-2.5 px-3 font-medium">Net Invoiced</th>
                <th className="py-2.5 px-3 font-medium">Cleared Cash</th>
                <th className="py-2.5 px-3 font-medium">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] text-[#171717] font-mono">
              {revenueMonthly.map((r) => (
                <tr key={r.billing_month} className="hover:bg-[#F5F5F3]/50">
                  <td className="py-2.5 px-3 font-bold font-sans">{r.billing_month}</td>
                  <td className="py-2.5 px-3">{r.total_invoices_issued}</td>
                  <td className="py-2.5 px-3">${Number(r.gross_subtotal).toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-[#737373]">${Number(r.total_tax_collected).toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-[#B83232]">-${Number(r.total_discounts_granted).toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-bold">${Number(r.net_invoiced_amount).toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-bold text-[#2E6B47]">${Number(r.total_cleared_payments).toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-bold text-[#D97736]">${Number(r.outstanding_receivables).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pending Receivables View */}
      <Card
        title="Outstanding Accounts Receivable Queue"
        subtitle="Unpaid or partially paid bills with customer contact data from view: pending_payments_view"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
                <th className="py-2.5 px-3 font-medium">Invoice #</th>
                <th className="py-2.5 px-3 font-medium">Customer Name</th>
                <th className="py-2.5 px-3 font-medium">Customer Phone</th>
                <th className="py-2.5 px-3 font-medium">Due Date</th>
                <th className="py-2.5 px-3 font-medium">Days Overdue</th>
                <th className="py-2.5 px-3 font-medium">Total Billed</th>
                <th className="py-2.5 px-3 font-medium">Amount Paid</th>
                <th className="py-2.5 px-3 font-medium">Balance Outstanding</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
              {pendingReceivables.map((pr) => (
                <tr key={pr.invoice_id} className="hover:bg-[#F5F5F3]/50">
                  <td className="py-2.5 px-3 font-mono font-bold">{pr.invoice_number}</td>
                  <td className="py-2.5 px-3 font-semibold">{pr.customer_name}</td>
                  <td className="py-2.5 px-3 text-[#737373]">{pr.customer_phone}</td>
                  <td className="py-2.5 px-3 font-mono">{pr.due_date}</td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className={Number(pr.days_overdue) > 0 ? 'text-[#B83232] font-bold' : 'text-[#737373]'}>
                      {pr.days_overdue > 0 ? `+${pr.days_overdue} days` : 'Not overdue'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">${Number(pr.invoice_total).toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-mono text-[#2E6B47]">${Number(pr.amount_paid).toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#D97736]">
                    ${Number(pr.outstanding_balance).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={pr.invoice_status === 'partially_paid' ? 'warning' : 'default'}>
                      {pr.invoice_status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

