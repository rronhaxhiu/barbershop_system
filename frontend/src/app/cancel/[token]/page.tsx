'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

interface AppointmentDetails {
  appointment_id: number;
  client_name: string;
  appointment_datetime: string;
  status: string;
  can_cancel: boolean;
  barber_name: string;
}

export default function CancelAppointment() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAppointmentDetails();
    }
  }, [token]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/appointments/check/${token}`);
      setAppointment(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment || !appointment.can_cancel) return;
    
    setCancelling(true);
    setError(null);
    
    try {
      await api.post(`/appointments/cancel/${token}`);
      setCancelled(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeUntilAppointment = (dateTimeStr: string) => {
    const now = new Date();
    const appointmentDate = new Date(dateTimeStr);
    const diff = appointmentDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 0) return 'Past appointment';
    if (hours < 2) return `${hours}h ${minutes}m until appointment`;
    return `${hours}h ${minutes}m until appointment`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Appointment Not Found</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link 
            href="/"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Appointment Cancelled</h1>
          <p className="text-gray-600 mb-8">
            Your appointment has been successfully cancelled. A confirmation email has been sent to you.
          </p>
          <div className="space-y-3">
            <Link 
              href="/book"
              className="block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Book Another Appointment
            </Link>
            <Link 
              href="/"
              className="block bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  if (appointment.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Already Cancelled</h1>
          <p className="text-gray-600 mb-8">
            This appointment has already been cancelled.
          </p>
          <Link 
            href="/"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!appointment.can_cancel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Cannot Cancel</h1>
          <p className="text-gray-600 mb-4">
            Appointments can only be cancelled up to 2 hours before the scheduled time.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            {getTimeUntilAppointment(appointment.appointment_datetime)}
          </p>
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Your Appointment:</h3>
            <p className="text-gray-700 mb-2">
              <span className="font-medium">Barber:</span> {appointment.barber_name}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-medium">Date & Time:</span><br />
              {formatDateTime(appointment.appointment_datetime)}
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Please contact us directly if you need to cancel or reschedule.
          </p>
          <Link 
            href="/"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cancel Appointment?</h1>
          <p className="text-gray-600">
            Are you sure you want to cancel this appointment?
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Appointment Details:</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Client Name</p>
              <p className="text-gray-900 font-medium">{appointment.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Barber</p>
              <p className="text-gray-900 font-medium">{appointment.barber_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="text-gray-900 font-medium">{formatDateTime(appointment.appointment_datetime)}</p>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-500">{getTimeUntilAppointment(appointment.appointment_datetime)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full bg-red-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {cancelling ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cancelling...
              </span>
            ) : (
              'Yes, Cancel Appointment'
            )}
          </button>
          <Link
            href="/"
            className="block text-center w-full bg-gray-200 text-gray-700 px-6 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            No, Keep Appointment
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          You will receive a confirmation email once the appointment is cancelled.
        </p>
      </div>
    </div>
  );
}

