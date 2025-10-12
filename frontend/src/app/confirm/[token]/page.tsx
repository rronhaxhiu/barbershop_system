'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

const API_BASE_URL = 'http://localhost:8000/api';

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
      const response = await axios.get(`${API_BASE_URL}/appointments/confirm/${token}`);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Confirming your appointment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">💈 Barbershop</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {confirmed ? (
            <>
              <div className="text-green-500 text-6xl mb-6">✅</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Appointment Confirmed!
              </h1>
              <p className="text-gray-600 mb-8">
                Your appointment has been successfully confirmed. We look forward to seeing you!
              </p>
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-8">
                <h3 className="text-lg font-medium text-green-800 mb-2">What's Next?</h3>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• You'll receive a reminder email 24 hours before your appointment</li>
                  <li>• Please arrive 5-10 minutes early</li>
                  <li>• If you need to reschedule, please call us at least 24 hours in advance</li>
                </ul>
              </div>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Back to Home
                </Link>
                <Link
                  href="/book"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Book Another Appointment
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-red-500 text-6xl mb-6">❌</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Confirmation Failed
              </h1>
              <p className="text-gray-600 mb-8">
                {error || 'Unable to confirm your appointment.'}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
                <h3 className="text-lg font-medium text-red-800 mb-2">Possible Reasons:</h3>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• The confirmation link has expired</li>
                  <li>• The appointment has already been confirmed</li>
                  <li>• The confirmation link is invalid</li>
                </ul>
              </div>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Back to Home
                </Link>
                <Link
                  href="/book"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Book New Appointment
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
