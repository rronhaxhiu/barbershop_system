'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authUtils } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { useModal } from '@/components/Modal';

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

function AdminDashboardContent() {
  const { showError, showSuccess } = useToast();
  const { confirm } = useModal();
  const [activeTab, setActiveTab] = useState<'appointments' | 'barbers' | 'analytics'>('appointments');
  const [appointmentsView, setAppointmentsView] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    authUtils.logout();
  };

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

  const updateAppointmentStatus = async (appointmentId: number, status: string, clientName: string) => {
    let confirmed = true;
    
    // Show confirmation modal for confirm and cancel actions
    if (status === 'confirmed') {
      confirmed = await confirm({
        title: 'Confirm Appointment',
        message: `Are you sure you want to confirm the appointment for ${clientName}?`,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        type: 'success'
      });
    } else if (status === 'cancelled') {
      confirmed = await confirm({
        title: 'Cancel Appointment',
        message: `Are you sure you want to cancel the appointment for ${clientName}? This action can be reversed later if needed.`,
        confirmText: 'Cancel Appointment',
        cancelText: 'Keep Appointment',
        type: 'warning'
      });
    }

    if (!confirmed) return;

    try {
      await api.put(`/admin/appointments/${appointmentId}`, { status });
      showSuccess(`Appointment ${status === 'confirmed' ? 'confirmed' : 'cancelled'} successfully!`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating appointment:', error);
      showError('Failed to update appointment status');
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

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date());
    } else if (direction === 'prev') {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 1);
      setSelectedDate(newDate);
    } else {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 1);
      setSelectedDate(newDate);
    }
  };

  const filterAppointmentsByDate = (appointments: Appointment[], date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_datetime);
      return aptDate >= startOfDay && aptDate <= endOfDay;
    });
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments.filter(apt => new Date(apt.appointment_datetime) >= now);
  };

  const getHistoryAppointments = () => {
    const now = new Date();
    return appointments.filter(apt => new Date(apt.appointment_datetime) < now);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (compareDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Analytics calculations
  const calculateAnalytics = () => {
    const totalRevenue = appointments
      .filter(a => a.status === 'confirmed')
      .reduce((sum, apt) => {
        const aptTotal = apt.services.reduce((s, svc) => s + svc.price, 0);
        return sum + aptTotal;
      }, 0);

    const totalAppointments = appointments.length;
    const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;
    const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

    // Revenue by barber
    const revenueByBarber = barbers.map(barber => {
      const barberRevenue = appointments
        .filter(a => a.barber_id === barber.id && a.status === 'confirmed')
        .reduce((sum, apt) => {
          const aptTotal = apt.services.reduce((s, svc) => s + svc.price, 0);
          return sum + aptTotal;
        }, 0);
      return {
        name: barber.name,
        revenue: barberRevenue,
        appointments: appointments.filter(a => a.barber_id === barber.id && a.status === 'confirmed').length
      };
    });

    // Popular services
    const serviceStats: { [key: string]: { name: string; count: number; revenue: number } } = {};
    appointments.forEach(apt => {
      if (apt.status === 'confirmed') {
        apt.services.forEach(svc => {
          if (!serviceStats[svc.id]) {
            serviceStats[svc.id] = { name: svc.name, count: 0, revenue: 0 };
          }
          serviceStats[svc.id].count++;
          serviceStats[svc.id].revenue += svc.price;
        });
      }
    });
    const popularServices = Object.values(serviceStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Revenue by month (last 6 months)
    const monthlyRevenue: { [key: string]: number } = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyRevenue[monthKey] = 0;
    }

    appointments.forEach(apt => {
      if (apt.status === 'confirmed') {
        const aptDate = new Date(apt.appointment_datetime);
        const monthKey = aptDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthKey in monthlyRevenue) {
          const aptTotal = apt.services.reduce((s, svc) => s + svc.price, 0);
          monthlyRevenue[monthKey] += aptTotal;
        }
      }
    });

    const revenueByMonth = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    }));

    return {
      totalRevenue,
      totalAppointments,
      confirmedAppointments,
      pendingAppointments,
      cancelledAppointments,
      revenueByBarber,
      popularServices,
      revenueByMonth,
      averageOrderValue: confirmedAppointments > 0 ? totalRevenue / confirmedAppointments : 0
    };
  };

  const analytics = calculateAnalytics();

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
            <Link href="/admin" className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">💈 Barbershop Admin</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/" className="text-gray-500 hover:text-gray-900">Home</Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
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
              Appointments ({getUpcomingAppointments().length} upcoming)
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
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
               Analytics
            </button>
          </nav>
        </div>

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            {/* Appointments Sub-tabs */}
            <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAppointmentsView('upcoming')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      appointmentsView === 'upcoming'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📅 Upcoming
                  </button>
                  <button
                    onClick={() => setAppointmentsView('history')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      appointmentsView === 'history'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📚 History
                  </button>
                </div>

                {appointmentsView === 'upcoming' && (
                  <div className="flex items-center space-x-4">
                    {/* Date Navigation */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigateDate('prev')}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="Previous day"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <div className="text-center min-w-[200px]">
                        <div className="text-lg font-bold text-gray-900">{formatDate(selectedDate)}</div>
                        <div className="text-sm text-gray-500">
                          {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>

                      <button
                        onClick={() => navigateDate('next')}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="Next day"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {!isToday(selectedDate) && (
                      <button
                        onClick={() => navigateDate('today')}
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
                      >
                        Jump to Today
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Appointments */}
            {appointmentsView === 'upcoming' && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Appointments for {formatDate(selectedDate)}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {filterAppointmentsByDate(getUpcomingAppointments(), selectedDate).length} appointment(s) scheduled
                  </p>
                </div>
              <ul className="divide-y divide-gray-200">
                  {filterAppointmentsByDate(getUpcomingAppointments(), selectedDate).map((appointment) => (
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
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed', appointment.client_name)}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                          >
                            Confirm
                          </button>
                        )}
                        {appointment.status !== 'cancelled' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled', appointment.client_name)}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
                  {filterAppointmentsByDate(getUpcomingAppointments(), selectedDate).length === 0 && (
                    <li className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No appointments for this date</p>
                        <p className="text-gray-400 text-sm mt-1">Try selecting a different date</p>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* History Appointments */}
            {appointmentsView === 'history' && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    All Past Appointments
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getHistoryAppointments().length} completed appointment(s)
                  </p>
                </div>
                <ul className="divide-y divide-gray-200">
                  {getHistoryAppointments()
                    .sort((a, b) => new Date(b.appointment_datetime).getTime() - new Date(a.appointment_datetime).getTime())
                    .map((appointment) => (
                    <li key={appointment.id} className="px-6 py-4 bg-gray-50">
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
                      </div>
                    </li>
                  ))}
                  {getHistoryAppointments().length === 0 && (
                    <li className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No past appointments yet</p>
                        <p className="text-gray-400 text-sm mt-1">Your appointment history will appear here</p>
                      </div>
                  </li>
                )}
              </ul>
            </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium uppercase">Total Revenue</p>
                    <p className="text-3xl font-bold mt-2">€{analytics.totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-green-100 text-xs mt-2">From confirmed appointments</p>
              </div>

              {/* Total Appointments */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium uppercase">Total Appointments</p>
                    <p className="text-3xl font-bold mt-2">{analytics.totalAppointments}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-blue-100 text-xs mt-2">{analytics.confirmedAppointments} confirmed, {analytics.pendingAppointments} pending</p>
              </div>

              {/* Average Order Value */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium uppercase">Avg Order Value</p>
                    <p className="text-3xl font-bold mt-2">€{analytics.averageOrderValue.toFixed(2)}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
                <p className="text-purple-100 text-xs mt-2">Per confirmed appointment</p>
              </div>

              {/* Cancellation Rate */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium uppercase">Cancellation Rate</p>
                    <p className="text-3xl font-bold mt-2">
                      {analytics.totalAppointments > 0 
                        ? ((analytics.cancelledAppointments / analytics.totalAppointments) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-orange-100 text-xs mt-2">{analytics.cancelledAppointments} cancelled appointments</p>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend (Last 6 Months)</h3>
              <div className="h-64">
                {analytics.revenueByMonth.length > 0 ? (
                  <div className="flex items-end justify-between h-full space-x-2">
                    {analytics.revenueByMonth.map((data, index) => {
                      const maxRevenue = Math.max(...analytics.revenueByMonth.map(d => d.revenue));
                      const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                            <div 
                              className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg hover:from-indigo-600 hover:to-indigo-500 transition-all cursor-pointer group relative"
                              style={{ height: `${height}%`, minHeight: data.revenue > 0 ? '8px' : '0' }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                €{data.revenue.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 text-center">{data.month}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No revenue data available
                  </div>
                )}
              </div>
            </div>

            {/* Barber Performance & Popular Services */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Barber Performance */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Barber Performance</h3>
                <div className="space-y-4">
                  {analytics.revenueByBarber
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((barber, index) => (
                    <div key={index} className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{barber.name}</span>
                          <span className="text-sm font-bold text-gray-700">€{barber.revenue.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all"
                              style={{ 
                                width: `${analytics.totalRevenue > 0 ? (barber.revenue / analytics.totalRevenue) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{barber.appointments} appts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {analytics.revenueByBarber.length === 0 && (
                    <p className="text-gray-400 text-center py-8">No barber data available</p>
                  )}
                </div>
              </div>

              {/* Popular Services */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Services</h3>
                <div className="space-y-4">
                  {analytics.popularServices.map((service, index) => (
                    <div key={index} className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{service.name}</span>
                          <span className="text-sm font-bold text-gray-700">€{service.revenue.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                              style={{ 
                                width: `${Math.max(...analytics.popularServices.map(s => s.count)) > 0 
                                  ? (service.count / Math.max(...analytics.popularServices.map(s => s.count))) * 100 
                                  : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{service.count}x</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {analytics.popularServices.length === 0 && (
                    <p className="text-gray-400 text-center py-8">No service data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment Status Distribution */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Appointment Status Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="56" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="12"
                        strokeDasharray={`${analytics.totalAppointments > 0 ? (analytics.confirmedAppointments / analytics.totalAppointments) * 351.86 : 0} 351.86`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold text-gray-900">{analytics.confirmedAppointments}</span>
                      <span className="text-xs text-gray-500">Confirmed</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {analytics.totalAppointments > 0 
                        ? ((analytics.confirmedAppointments / analytics.totalAppointments) * 100).toFixed(0)
                        : 0}%
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="56" 
                        fill="none" 
                        stroke="#f59e0b" 
                        strokeWidth="12"
                        strokeDasharray={`${analytics.totalAppointments > 0 ? (analytics.pendingAppointments / analytics.totalAppointments) * 351.86 : 0} 351.86`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold text-gray-900">{analytics.pendingAppointments}</span>
                      <span className="text-xs text-gray-500">Pending</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      {analytics.totalAppointments > 0 
                        ? ((analytics.pendingAppointments / analytics.totalAppointments) * 100).toFixed(0)
                        : 0}%
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="56" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="12"
                        strokeDasharray={`${analytics.totalAppointments > 0 ? (analytics.cancelledAppointments / analytics.totalAppointments) * 351.86 : 0} 351.86`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold text-gray-900">{analytics.cancelledAppointments}</span>
                      <span className="text-xs text-gray-500">Cancelled</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      {analytics.totalAppointments > 0 
                        ? ((analytics.cancelledAppointments / analytics.totalAppointments) * 100).toFixed(0)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
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

export default function AdminDashboard() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
