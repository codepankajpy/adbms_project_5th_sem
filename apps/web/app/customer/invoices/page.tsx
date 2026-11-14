'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Modal } from '../../../components/Modal';
import { CreditCard, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'credit_card' | 'debit_card' | 'cash'>('credit_card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const loadInvoices = () => {
    apiRequest('/api/invoices')
      .then((res) => setInvoices(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const openPayment = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentAmount(Number(inv.outstanding_balance));
    setError('');
    setPayModalOpen(true);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setError('');
    setProcessing(true);

    try {
      await apiRequest('/api/payments/process', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: paymentAmount,
          paymentMethod,
          transactionId: `TXN_${Date.now()}`,
          remarks: 'Settled by customer via online billing portal',
        }),
      });

      setPayModalOpen(false);
      loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Payment failed in transaction');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-[#737373] font-mono py-10">Querying billing ledger from PostgreSQL...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E5E5E5]">
        <h1 className="text-xl font-bold text-[#171717]">Invoices & Billing Ledger</h1>
        <p className="text-xs text-[#737373]">
          Financial audit history, 18% GST tax computation, and online settlement via stored procedure
        </p>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-xs text-[#737373]">No invoices generated yet.</div>
        </Card>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F5F5F3] text-[#737373]">
                <th className="py-3 px-4 font-medium">Invoice #</th>
                <th className="py-3 px-4 font-medium">Booking #</th>
                <th className="py-3 px-4 font-medium">Issue Date</th>
                <th className="py-3 px-4 font-medium">Due Date</th>
                <th className="py-3 px-4 font-medium">Subtotal</th>
                <th className="py-3 px-4 font-medium">Tax (18%)</th>
                <th className="py-3 px-4 font-medium">Total</th>
                <th className="py-3 px-4 font-medium">Balance Due</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] text-[#171717]">
              {invoices.map((inv) => {
                const balance = Number(inv.outstanding_balance);
                return (
                  <tr key={inv.id} className="hover:bg-[#F5F5F3]/50">
                    <td className="py-3 px-4 font-mono font-bold text-[#171717]">{inv.invoice_number}</td>
                    <td className="py-3 px-4 font-mono text-[#737373]">{inv.booking_number}</td>
                    <td className="py-3 px-4">{new Date(inv.issued_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{inv.due_date}</td>
                    <td className="py-3 px-4 font-mono">${Number(inv.subtotal).toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono">${Number(inv.tax_amount).toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono font-bold">${Number(inv.total_amount).toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#D97736]">
                      ${balance.toFixed(2)}
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
                      {balance > 0 ? (
                        <button
                          onClick={() => openPayment(inv)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded transition-colors"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Pay Now</span>
                        </button>
                      ) : (
                        <span className="text-xs text-[#2E6B47] font-semibold flex items-center justify-end space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid in Full</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Processing Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={`Settle ${selectedInvoice?.invoice_number || ''}`}
        description="Executes stored procedure process_invoice_payment with row-level FOR UPDATE locking"
      >
        {error && (
          <div className="mb-4 p-3 bg-[#FDF3F2] border border-[#FADBD8] rounded text-xs text-[#B83232] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {selectedInvoice && (
          <form onSubmit={handlePay} className="space-y-4 text-xs">
            <div className="p-3 bg-[#F5F5F3] border border-[#E5E5E5] rounded space-y-1">
              <div className="flex justify-between">
                <span className="text-[#737373]">Invoice Total:</span>
                <span className="font-mono font-bold">${Number(selectedInvoice.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Remaining Outstanding:</span>
                <span className="font-mono font-bold text-[#D97736]">${Number(selectedInvoice.outstanding_balance).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">Payment Amount ($)</label>
              <input
                type="number"
                required
                step="0.01"
                min="1"
                max={Number(selectedInvoice.outstanding_balance)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded font-mono font-bold focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#111111]"
              >
                <option value="credit_card">Credit Card (Visa / Mastercard)</option>
                <option value="debit_card">Debit Card</option>
                <option value="upi">UPI (Instant Settlement)</option>
                <option value="cash">Cash Settlement</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#737373] border border-[#E5E5E5] rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-1.5 text-xs bg-[#111111] hover:bg-black text-white font-medium rounded transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing Transaction...' : `Pay $${paymentAmount.toFixed(2)}`}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

