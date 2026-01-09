import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';

interface AdminDashboardProps {
  secretKey: string;
}

interface Payment {
  id: number;
  email: string;
  amount_total: number;
  currency: string;
  status: string;
  created_at: string;
  stripe_session_id: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ secretKey }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${secretKey}` },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch stats');
        }
        const data = await res.json();
        setStats(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [secretKey]);

  const handleRefund = async () => {
    if (!selectedPayment) return;
    setRefunding(true);
    try {
      const res = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId: selectedPayment.id, reason: refundReason }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to issue refund');
      }
      // Refresh Stats & Clear Selection
      const data = await res.json();
      console.log('Refund successful:', data);
      setStats((prevStats: any) => ({
        ...prevStats,
        recentPayments: prevStats.recentPayments.map((p: Payment) =>
          p.id === selectedPayment.id ? { ...p, status: 'refunded' } : p
        ),
      }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefunding(false);
      setSelectedPayment(null); // Clear selection
    }
  };

  if (loading) return <div className="p-4">Loading admin dashboard... <Loader2 className="inline-block ml-2 animate-spin" /></div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <NeoCard title="Total Revenue">
          ${stats.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}
        </NeoCard>
        <NeoCard title="3-Test Pack Sales">
          {stats.salesBreakdown?.pack3 || 0}
        </NeoCard>
        <NeoCard title="15-Test Pack Sales">
          {stats.salesBreakdown?.pack15 || 0}
        </NeoCard>
        <NeoCard title="Monthly Subscriptions">
          {stats.salesBreakdown?.starter || 0}
        </NeoCard>
      </div>

      <NeoCard title="Recent Payments">
        {stats.recentPayments && stats.recentPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((payment: Payment) => (
                  <tr key={payment.id}>
                    <td>{payment.email}</td>
                    <td>${(payment.amount_total / 100).toFixed(2)}</td>
                    <td>{payment.status}</td>
                    <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                    <td>
                      {payment.status === 'paid' && (
                        <button onClick={() => setSelectedPayment(payment)} className="text-blue-500 hover:underline">
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No recent payments found.</p>
        )}
      </NeoCard>

      {/* Refund Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-bold">Refund Payment</h3>
            <p>Are you sure you want to refund ${selectedPayment.amount_total / 100} to {selectedPayment.email}?</p>
            <input
              type="text"
              placeholder="Reason for refund (optional)"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="border p-2 rounded-md w-full mb-3"
            />
            <div className="flex justify-end gap-2">
              <button className="py-2 px-4 bg-gray-200 rounded-md" onClick={() => setSelectedPayment(null)}>Cancel</button>
              <button className="py-2 px-4 bg-red-500 text-white rounded-md" disabled={refunding} onClick={handleRefund}>
                {refunding ? 'Refunding...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
