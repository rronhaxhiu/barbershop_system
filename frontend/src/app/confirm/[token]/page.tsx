'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function ConfirmationPage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      confirmAppointment();
    }
  }, [token]);

  const confirmAppointment = async () => {
    try {
      const response = await api.get(`/appointments/confirm/${token}`);
      setConfirmed(true);
    } catch (error: any) {
      console.error('Error confirming appointment:', error);
      if (error.response?.status === 404) {
        setError('Invalid confirmation link or appointment already confirmed.');
      } else {
        setError('Failed to confirm appointment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-white/60 tracking-wide">CONFIRMING YOUR APPOINTMENT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-white tracking-wider">HOUSE OF CUTZ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-xl p-8 text-center">
          {confirmed ? (
            <>
              <div className="text-emerald-400 text-6xl mb-6">✅</div>
              <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
                APPOINTMENT CONFIRMED!
              </h1>
              <p className="text-white/70 mb-8">
                Your appointment has been successfully confirmed. We look forward to seeing you!
              </p>
              <div className="bg-emerald-500/5 border-2 border-emerald-500/30 rounded-xl p-4 mb-8">
                <h3 className="text-lg font-medium text-emerald-400 mb-2 tracking-wide">WHAT'S NEXT?</h3>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• You'll receive a reminder email 24 hours before your appointment</li>
                  <li>• Please arrive 5-10 minutes early</li>
                  <li>• If you need to reschedule, please call us at least 24 hours in advance</li>
                </ul>
              </div>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-black font-semibold rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg shadow-emerald-500/30"
                >
                  BACK TO HOME
                </Link>
                <Link
                  href="/book"
                  className="inline-flex items-center px-6 py-3 border-2 border-white/30 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  BOOK ANOTHER APPOINTMENT
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-red-400 text-6xl mb-6">❌</div>
              <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
                CONFIRMATION FAILED
              </h1>
              <p className="text-white/70 mb-8">
                {error || 'Unable to confirm your appointment.'}
              </p>
              <div className="bg-red-500/5 border-2 border-red-500/30 rounded-xl p-4 mb-8">
                <h3 className="text-lg font-medium text-red-400 mb-2 tracking-wide">POSSIBLE REASONS:</h3>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• The confirmation link has expired</li>
                  <li>• The appointment has already been confirmed</li>
                  <li>• The confirmation link is invalid</li>
                </ul>
              </div>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-black font-semibold rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg shadow-emerald-500/30"
                >
                  BACK TO HOME
                </Link>
                <Link
                  href="/book"
                  className="inline-flex items-center px-6 py-3 border-2 border-white/30 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  BOOK NEW APPOINTMENT
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
