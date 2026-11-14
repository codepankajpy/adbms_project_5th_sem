'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Modal } from '../../../components/Modal';
import { FileText, Eye, AlertCircle } from 'lucide-react';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    apiRequest('/api/invoices')
      .then((res) => setInvoices(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const openDetails = async (id: number) => {
    try {
      const res = await apiRequest(`/api/invoices/${id}`);
      setSelectedInvoice(res.data);
      setDetailModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Querying financial ledger from PostgreSQL...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E5E5E5]">
        <h1 className="text-xl font-bold text-[#171717]">Invoices & Billing Accounts</h1>
        <p className="text-xs text-[#737373]">
          Customer invoices, 18% statutory tax calculation, line itemization, and balance tracking
        </p>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
              <th className="py-3 px-4 font-medium">Invoice #</th>
              <th className="py-3 px-4 font-medium">Customer</th>
              <th className="py-3 px-4 font-medium">Booking #</th>
              <th className="py-3 px-4 font-medium">Issue Date</th>
              <th className="py-3 px-4 font-medium">Due Date</th>
              <th className="py-3 px-4 font-medium">Subtotal</th>
              <th className="py-3 px-4 font-medium">Tax (18%)</th>
              <th className="py-3 px-4 font-medium">Total Billed</th>
              <th className="py-3 px-4 font-medium">Outstanding (UDF)</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-[#F5F5F3]/50">
                <td className="py-3 px-4 font-mono font-bold text-[#171717]">{inv.invoice_number}</td>
                <td className="py-3 px-4 font-semibold">{inv.customer_name}</td>
                <td className="py-3 px-4 font-mono text-[#737373]">{inv.booking_number}</td>
                <td className="py-3 px-4">{new Date(inv.issued_at).toLocaleDateString()}</td>
                <td className="py-3 px-4">{inv.due_date}</td>
                <td className="py-3 px-4 font-mono">${Number(inv.subtotal).toFixed(2)}</td>
                <td className="py-3 px-4 font-mono">${Number(inv.tax_amount).toFixed(2)}</td>
                <td className="py-3 px-4 font-mono font-bold">${Number(inv.total_amount).toFixed(2)}</td>
                <td className="py-3 px-4 font-mono font-bold text-[#D97736]">
                  ${Number(inv.outstanding_balance).toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  <Badge
                    variant={
                      inv.status === 'paid'
                        ? 'success'
                        : inv.status === 'partially_paid'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {inv.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => openDetails(inv.id)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-[#171717] hover:bg-[#F5F5F3] border border-[#E5E5E5] rounded"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Audit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice Details Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Audit Invoice - ${selectedInvoice?.invoice?.invoice_number || ''}`}
        description="Line item breakdown and historical payment receipts"
        maxWidth="max-w-xl"
      >
        {selectedInvoice && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#F5F5F3] border border-[#E5E5E5] rounded grid grid-cols-2 gap-2">
              <div>
                <span className="text-[#737373] block">Billed To:</span>
                <span className="font-semibold text-[#171717]">{selectedInvoice.invoice.customer_name}</span>
                <span className="text-[11px] text-[#737373] block">{selectedInvoice.invoice.customer_phone}</span>
              </div>
              <div className="text-right">
                <span className="text-[#737373] block">Vehicle:</span>
                <span className="font-mono font-bold text-[#171717]">{selectedInvoice.invoice.registration_number}</span>
              </div>
            </div>

            {/* Line items */}
            <div>
              <h4 className="font-bold text-[#171717] mb-2">Itemized Services (invoice_items table)</h4>
              <div className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded">
                {selectedInvoice.items.map((item: any) => (
                  <div key={item.id} className="p-2.5 flex justify-between">
                    <div>
                      <span className="font-medium text-[#171717]">{item.description}</span>
                      <span className="text-[#737373] block text-[11px]">Qty: {item.quantity} × ${Number(item.unit_price).toFixed(2)}</span>
                    </div>
                    <span className="font-mono font-bold">${Number(item.line_total).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total summary */}
            <div className="border-t border-[#E5E5E5] pt-2 space-y-1 text-right">
              <div className="flex justify-between">
                <span className="text-[#737373]">Subtotal:</span>
                <span className="font-mono">${Number(selectedInvoice.invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Tax Rate & Amount (18%):</span>
                <span className="font-mono">${Number(selectedInvoice.invoice.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#171717] pt-1 border-t border-[#E5E5E5]">
                <span>Total Amount:</span>
                <span className="font-mono">${Number(selectedInvoice.invoice.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs text-[#D97736]">
                <span>Outstanding Balance:</span>
                <span className="font-mono">${Number(selectedInvoice.invoice.outstanding_balance).toFixed(2)}</span>
              </div>
            </div>

            {/* Payments List */}
            {selectedInvoice.payments.length > 0 && (
              <div>
                <h4 className="font-bold text-[#171717] mb-1">Cleared Payment Transactions</h4>
                <div className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded">
                  {selectedInvoice.payments.map((p: any) => (
                    <div key={p.id} className="p-2 flex justify-between items-center text-[11px]">
                      <div>
                        <span className="font-mono font-bold text-[#171717]">{p.payment_reference}</span>
                        <span className="text-[#737373] block">Method: {p.payment_method} • {new Date(p.payment_date).toLocaleString()}</span>
                      </div>
                      <span className="font-mono font-bold text-[#2E6B47]">+${Number(p.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

