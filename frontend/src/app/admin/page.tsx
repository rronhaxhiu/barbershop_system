'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Barber {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface Service {
  id: number;
  barber_id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

interface Appointment {
  id: number;
  barber_id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  appointment_datetime: string;
  status: string;
  notes?: string;
  created_at: string;
  barber: Barber;
  services: Service[];
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'barbers' | 'services'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, barbersRes] = await Promise.all([
        api.get('/admin/appointments'),
        api.get('/barbers')
      ]);
      setAppointments(appointmentsRes.data);
      setBarbers(barbersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: number, status: string) => {
    try {
      await api.put(`/admin/appointments/${appointmentId}`, { status });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment status');
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-2 text-sm font-semibold rounded-full uppercase tracking-wide";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-200 text-yellow-900 border border-yellow-300`;
      case 'confirmed':
        return `${baseClasses} bg-green-200 text-green-900 border border-green-300`;
      case 'cancelled':
        return `${baseClasses} bg-red-200 text-red-900 border border-red-300`;
      default:
        return `${baseClasses} bg-gray-200 text-gray-900 border border-gray-300`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
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
              <span className="text-2xl font-bold text-gray-900">💈 Barbershop Admin</span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-500 hover:text-gray-900">Home</Link>
              <Link href="/book" className="text-gray-500 hover:text-gray-900">Book Appointment</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'appointments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appointments ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('barbers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'barbers'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Barbers ({barbers.length})
            </button>
          </nav>
        </div>

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <li key={appointment.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <span className={getStatusBadge(appointment.status)}>
                          {appointment.status}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {appointment.client_name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {appointment.client_email} • {appointment.client_phone}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <div className="mb-2">
                              <span className="font-medium">Barber:</span> {appointment.barber.name}
                            </div>
                            <div className="mb-2">
                              <span className="font-medium">Services:</span>
                              <ul className="list-disc list-inside ml-4">
                                {appointment.services.map((service) => (
                                  <li key={service.id}>
                                    {service.name} - €{service.price} ({service.duration_minutes} min)
                                  </li>
                                ))}
                              </ul>
                              <div className="ml-4 mt-1 font-medium">
                                Total: €{appointment.services.reduce((sum, s) => sum + s.price, 0).toFixed(2)} 
                                ({appointment.services.reduce((sum, s) => sum + s.duration_minutes, 0)} min)
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {new Date(appointment.appointment_datetime).toLocaleString()}
                            </div>
                          </div>
                          {appointment.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Notes:</span> {appointment.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        {appointment.status === 'pending' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                          >
                            Confirm
                          </button>
                        )}
                        {appointment.status !== 'cancelled' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
                {appointments.length === 0 && (
                  <li className="px-6 py-8 text-center text-gray-500">
                    No appointments found.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Barbers Tab */}
        {activeTab === 'barbers' && (
          <div>
            <div className="mb-6">
              <Link
                href="/admin/barbers/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Add New Barber
              </Link>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {barbers.map((barber) => (
                  <li key={barber.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{barber.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{barber.description}</p>
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Status:</span> {barber.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <Link
                          href={`/admin/barbers/${barber.id}/services`}
                          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                        >
                          Manage Services
                        </Link>
                        <Link
                          href={`/admin/barbers/${barber.id}/edit`}
                          className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
                {barbers.length === 0 && (
                  <li className="px-6 py-8 text-center text-gray-500">
                    No barbers found.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
