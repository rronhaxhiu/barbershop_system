'use client';

import { useState, useEffect, useRef } from 'react';
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

  // History filters
  const [historyFilters, setHistoryFilters] = useState({
    searchQuery: '',
    statusFilter: 'all',
    barberFilter: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date-desc' as 'date-desc' | 'date-asc' | 'name' | 'amount-desc' | 'amount-asc'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState<Appointment | null>(null);
  const [isModalAnimating, setIsModalAnimating] = useState(false);

  // Trigger animation when modal opens
  useEffect(() => {
    if (selectedAppointmentDetails) {
      setTimeout(() => setIsModalAnimating(true), 10);
    } else {
      setIsModalAnimating(false);
    }
  }, [selectedAppointmentDetails]);

  const closeModal = () => {
    setIsModalAnimating(false);
    setTimeout(() => setSelectedAppointmentDetails(null), 300);
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        // Fallback method for browsers without Clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        // Prevent viewport changes and keyboard on mobile
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        
        // Save current scroll position
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        textArea.select();
        textArea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          // Restore scroll position
          window.scrollTo(scrollX, scrollY);
          
          showSuccess('Copied to clipboard!');
        } catch {
          document.body.removeChild(textArea);
          window.scrollTo(scrollX, scrollY);
          showError('Failed to copy');
        }
        return;
      }
      
      await navigator.clipboard.writeText(text);
      showSuccess('Copied to clipboard!');
    } catch {
      showError('Failed to copy');
    }
  };

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
    // Include all appointments (past and future) for history view
    return appointments;
  };

  const getFilteredHistoryAppointments = () => {
    let filtered = getHistoryAppointments();

    // Search filter
    if (historyFilters.searchQuery) {
      const query = historyFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.client_name.toLowerCase().includes(query) ||
        apt.client_email.toLowerCase().includes(query) ||
        apt.client_phone.includes(query)
      );
    }

    // Status filter
    if (historyFilters.statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === historyFilters.statusFilter);
    }

    // Barber filter
    if (historyFilters.barberFilter !== 'all') {
      filtered = filtered.filter(apt => apt.barber_id.toString() === historyFilters.barberFilter);
    }

    // Date range filter
    if (historyFilters.dateFrom) {
      const fromDate = new Date(historyFilters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(apt => new Date(apt.appointment_datetime) >= fromDate);
    }
    if (historyFilters.dateTo) {
      const toDate = new Date(historyFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(apt => new Date(apt.appointment_datetime) <= toDate);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (historyFilters.sortBy) {
        case 'date-desc':
          return new Date(b.appointment_datetime).getTime() - new Date(a.appointment_datetime).getTime();
        case 'date-asc':
          return new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime();
        case 'name':
          return a.client_name.localeCompare(b.client_name);
        case 'amount-desc': {
          const aTotal = a.services.reduce((sum, s) => sum + s.price, 0);
          const bTotal = b.services.reduce((sum, s) => sum + s.price, 0);
          return bTotal - aTotal;
        }
        case 'amount-asc': {
          const aTotal = a.services.reduce((sum, s) => sum + s.price, 0);
          const bTotal = b.services.reduce((sum, s) => sum + s.price, 0);
          return aTotal - bTotal;
        }
      default:
          return 0;
      }
    });

    return filtered;
  };

  const resetHistoryFilters = () => {
    setHistoryFilters({
      searchQuery: '',
      statusFilter: 'all',
      barberFilter: 'all',
      dateFrom: '',
      dateTo: '',
      sortBy: 'date-desc'
    });
  };

  const filteredHistory = getFilteredHistoryAppointments();
  const historyStats = {
    total: filteredHistory.length,
    confirmed: filteredHistory.filter(a => a.status === 'confirmed').length,
    pending: filteredHistory.filter(a => a.status === 'pending').length,
    cancelled: filteredHistory.filter(a => a.status === 'cancelled').length
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
      weekday: 'long' 
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

    // Revenue by day of week
    const dayOfWeekRevenue: { [key: string]: { revenue: number; count: number } } = {
      'Sunday': { revenue: 0, count: 0 },
      'Monday': { revenue: 0, count: 0 },
      'Tuesday': { revenue: 0, count: 0 },
      'Wednesday': { revenue: 0, count: 0 },
      'Thursday': { revenue: 0, count: 0 },
      'Friday': { revenue: 0, count: 0 },
      'Saturday': { revenue: 0, count: 0 }
    };

    appointments.forEach(apt => {
      if (apt.status === 'confirmed') {
        const aptDate = new Date(apt.appointment_datetime);
        const dayName = aptDate.toLocaleDateString('en-US', { weekday: 'long' });
        const aptTotal = apt.services.reduce((s, svc) => s + svc.price, 0);
        dayOfWeekRevenue[dayName].revenue += aptTotal;
        dayOfWeekRevenue[dayName].count++;
      }
    });

    const revenueByDayOfWeek = Object.entries(dayOfWeekRevenue).map(([day, data]) => ({
      day,
      avgRevenue: data.count > 0 ? data.revenue / data.count : 0,
      totalRevenue: data.revenue,
      appointments: data.count
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
      revenueByDayOfWeek,
      averageOrderValue: confirmedAppointments > 0 ? totalRevenue / confirmedAppointments : 0
    };
  };

  const analytics = calculateAnalytics();

  // Get next upcoming appointment
  const getNextAppointment = () => {
    const now = new Date();
    const upcoming = appointments
      .filter(apt => new Date(apt.appointment_datetime) > now && apt.status !== 'cancelled')
      .sort((a, b) => new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime());
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  const nextAppointment = getNextAppointment();

  const goToNextAppointment = () => {
    if (nextAppointment) {
      setActiveTab('appointments');
      setAppointmentsView('upcoming');
      const aptDate = new Date(nextAppointment.appointment_datetime);
      setSelectedDate(aptDate);
      
      // Scroll to the appointment card after a short delay to allow rendering
      setTimeout(() => {
        const element = document.getElementById(`appointment-${nextAppointment.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a brief highlight effect
          element.classList.add('ring-4', 'ring-green-500', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-green-500', 'ring-opacity-50');
          }, 2000);
        }
      }, 100);
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
          <div className="flex justify-between items-center py-4 sm:py-6">
            <Link href="/admin" className="flex items-center">
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">💈 Barbershop</span>
            </Link>
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="hidden sm:inline text-gray-500 hover:text-gray-900">Home</Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 sm:pb-20">
        {/* Tabs */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile Tabs - Full Width Grid */}
          <nav className="grid grid-cols-3 gap-2 sm:hidden mb-4">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-3 px-2 rounded-lg font-semibold text-xs transition-all ${
                activeTab === 'appointments'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Appts</span>
                <span className="text-xs opacity-75">({getUpcomingAppointments().length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('barbers')}
              className={`py-3 px-2 rounded-lg font-semibold text-xs transition-all ${
                activeTab === 'barbers'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Barbers</span>
                <span className="text-xs opacity-75">({barbers.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3 px-2 rounded-lg font-semibold text-xs transition-all ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Analytics</span>
              </div>
            </button>
          </nav>

          {/* Desktop Tabs - Traditional Style */}
          <nav className="hidden sm:flex border-b border-gray-200 -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'appointments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appointments ({getUpcomingAppointments().length} upcoming)
            </button>
            <button
              onClick={() => setActiveTab('barbers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'barbers'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Barbers ({barbers.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Analytics
            </button>
          </nav>
        </div>

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            {/* Appointments Sub-tabs */}
            <div className="mb-6 bg-white rounded-lg shadow-sm p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAppointmentsView('upcoming')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      appointmentsView === 'upcoming'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="hidden sm:inline">📅 Upcoming</span>
                    <span className="sm:hidden">📅</span>
                  </button>
                  <button
                    onClick={() => setAppointmentsView('history')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      appointmentsView === 'history'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="hidden sm:inline">📚 History</span>
                    <span className="sm:hidden">📚</span>
                  </button>
                </div>

                {appointmentsView === 'upcoming' && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3 sm:gap-4">
                    {/* Date Navigation */}
                    <div className="flex items-center justify-between w-full sm:w-auto">
                      <button
                        onClick={() => navigateDate('prev')}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="Previous day"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <div className="text-center flex-1 sm:flex-none sm:min-w-[200px]">
                        <div className="text-lg font-bold text-gray-900">{formatDate(selectedDate)}</div>
                        <div className="text-xs sm:text-sm text-gray-500">
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
                        className="w-full sm:w-auto px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors text-sm sm:text-base"
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
                            <div>
                <div className="space-y-4">
                  {filterAppointmentsByDate(getUpcomingAppointments(), selectedDate)
                    .sort((a, b) => new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime())
                    .map((appointment) => {
                    const appointmentTime = new Date(appointment.appointment_datetime);
                    const timeString = appointmentTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    });
                    
                    // Status colors for left border
                    const borderColor = 
                      appointment.status === 'confirmed' ? 'border-l-green-500' :
                      appointment.status === 'cancelled' ? 'border-l-red-500' :
                      'border-l-yellow-500';
                    
                    // Swipe gesture component for mobile
                    const SwipeableCard = () => {
                      const [touchStart, setTouchStart] = useState<number | null>(null);
                      const [touchCurrent, setTouchCurrent] = useState<number | null>(null);
                      const [isSwiping, setIsSwiping] = useState(false);
                      const [didSwipe, setDidSwipe] = useState(false);
                      const touchElementRef = useRef<HTMLDivElement>(null);
                      
                      const swipeThreshold = 100; // pixels needed to trigger action
                      
                      // Disable swiping for confirmed or cancelled appointments
                      const canSwipe = appointment.status === 'pending';
                      
                      const handleTouchStart = (e: TouchEvent) => {
                        if (!canSwipe) return;
                        setTouchStart(e.touches[0].clientX);
                        setTouchCurrent(e.touches[0].clientX);
                        setIsSwiping(true);
                        setDidSwipe(false);
                      };
                      
                      const handleTouchMove = (e: TouchEvent) => {
                        if (!touchStart || !canSwipe) return;
                        const currentX = e.touches[0].clientX;
                        setTouchCurrent(currentX);
                        // Prevent scrolling while swiping horizontally
                        if (Math.abs(currentX - touchStart) > 10) {
                          e.preventDefault();
                          setDidSwipe(true);
                        }
                      };
                      
                      const handleTouchEnd = () => {
                        if (!touchStart || !touchCurrent || !canSwipe) {
                          setIsSwiping(false);
                          setTouchStart(null);
                          setTouchCurrent(null);
                          return;
                        }
                        
                        const diff = touchCurrent - touchStart;
                        
                        // Right swipe - Confirm (only if pending)
                        if (diff > swipeThreshold && appointment.status === 'pending') {
                          updateAppointmentStatus(appointment.id, 'confirmed', appointment.client_name);
                        }
                        // Left swipe - Cancel (only if not already cancelled)
                        else if (diff < -swipeThreshold && appointment.status !== 'cancelled') {
                          updateAppointmentStatus(appointment.id, 'cancelled', appointment.client_name);
                        }
                        
                        setIsSwiping(false);
                        setTouchStart(null);
                        setTouchCurrent(null);
                        // Reset didSwipe after a short delay to allow onClick to check it
                        setTimeout(() => setDidSwipe(false), 100);
                      };

                      // Attach touch event listeners with passive: false
                      useEffect(() => {
                        const element = touchElementRef.current;
                        if (!element) return;

                        element.addEventListener('touchstart', handleTouchStart, { passive: true });
                        element.addEventListener('touchmove', handleTouchMove, { passive: false });
                        element.addEventListener('touchend', handleTouchEnd, { passive: true });

                        return () => {
                          element.removeEventListener('touchstart', handleTouchStart);
                          element.removeEventListener('touchmove', handleTouchMove);
                          element.removeEventListener('touchend', handleTouchEnd);
                        };
                      }, [touchStart, touchCurrent, canSwipe]);
                      
                      const swipeOffset = isSwiping && touchStart && touchCurrent ? touchCurrent - touchStart : 0;
                      const clampedOffset = Math.max(-200, Math.min(200, swipeOffset));
                      
                      // Show action hints
                      const showConfirmHint = swipeOffset > 30 && appointment.status === 'pending';
                      const showCancelHint = swipeOffset < -30 && appointment.status !== 'cancelled';
                      
                      return (
                        <div className="relative overflow-hidden">
                          {/* Background action indicators - Full width colored backgrounds */}
                          {/* Confirm background (green, left side for right swipe) */}
                          <div className={`absolute inset-y-0 left-0 right-0 bg-green-500 flex items-center justify-start px-8 transition-opacity duration-200 ${showConfirmHint ? 'opacity-100' : 'opacity-0'}`}>
                            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          
                          {/* Cancel background (red, right side for left swipe) */}
                          <div className={`absolute inset-y-0 left-0 right-0 bg-red-500 flex items-center justify-end px-8 transition-opacity duration-200 ${showCancelHint ? 'opacity-100' : 'opacity-0'}`}>
                            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          
                          {/* Swipeable content with border */}
                          <div
                            ref={touchElementRef}
                            style={{
                              transform: `translateX(${clampedOffset}px)`,
                              transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            onClick={() => !didSwipe && setSelectedAppointmentDetails(appointment)}
                            className={`bg-white relative z-10 cursor-pointer border-l-8 ${borderColor}`}
                          >
                            <div className="px-4 py-4 relative">
                            {/* Content Layout - Left: Name, Right: Time */}
                            <div className="flex items-center justify-between gap-4">
                              {/* Left Side - Name */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-gray-900 break-words">
                                {appointment.client_name}
                              </h3>
                            </div>
                              
                              {/* Right Side - Time (No Icon, Vertically Centered) */}
                              <div className="flex items-center justify-end flex-shrink-0">
                                <div className="text-4xl  text-gray-900 whitespace-nowrap">
                                  {timeString}
                          </div>
                              </div>
                            </div>
                          </div>
                          </div>
                        </div>
                      );
                    };
                    
                    return (
                      <div 
                        key={appointment.id}
                        id={`appointment-${appointment.id}`}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden relative transition-all duration-200"
                      >
                        {/* Mobile View with Swipe */}
                        <div className="lg:hidden">
                          <SwipeableCard />
                        </div>

                        {/* Desktop View */}
                        <div className="hidden lg:block px-6 py-5 relative">
                          {/* Colored border for desktop */}
                          <div className={`absolute left-0 top-0 bottom-0 w-2 ${borderColor}`}></div>
                          <div className="flex items-center justify-between gap-6">
                            {/* Left Section - Client Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-2xl font-bold text-gray-900 mb-1 truncate">
                                {appointment.client_name}
                              </h3>
                              <p className="text-sm text-gray-500 mb-3 break-all">
                                {appointment.client_email} • {appointment.client_phone}
                              </p>
                              <div className="text-sm text-gray-600 space-y-2">
                                <div>
                              <span className="font-medium">Barber:</span> {appointment.barber.name}
                            </div>
                                <div>
                              <span className="font-medium">Services:</span>
                                  <ul className="list-disc list-inside ml-4 mt-1">
                                {appointment.services.map((service) => (
                                      <li key={service.id} className="truncate">
                                    {service.name} - €{service.price} ({service.duration_minutes} min)
                                  </li>
                                ))}
                              </ul>
                                </div>
                                <div className="font-medium">
                                Total: €{appointment.services.reduce((sum, s) => sum + s.price, 0).toFixed(2)} 
                                ({appointment.services.reduce((sum, s) => sum + s.duration_minutes, 0)} min)
                              </div>
                              </div>
                              {appointment.notes && (
                                <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <span className="font-medium">Notes:</span> {appointment.notes}
                                </div>
                              )}
                            </div>
                            
                            {/* Center - Time Display */}
                            <div className="text-center px-6 flex-shrink-0">
                              <div className="text-5xl font-bold text-gray-900">
                                {timeString}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {appointmentTime.toLocaleDateString()}
                              </div>
                            </div>
                            
                            {/* Right - Action Buttons */}
                            <div className="flex gap-3 flex-shrink-0">
                              {appointment.status === 'pending' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'confirmed', appointment.client_name)}
                                  className="w-14 h-14 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
                                  title="Confirm appointment"
                                >
                                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                              {appointment.status !== 'cancelled' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'cancelled', appointment.client_name)}
                                  className="w-14 h-14 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
                                  title="Cancel appointment"
                                >
                                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filterAppointmentsByDate(getUpcomingAppointments(), selectedDate).length === 0 && (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No appointments for this date</p>
                        <p className="text-gray-400 text-sm mt-1">Try selecting a different date</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* History Appointments - Comprehensive Filterable View */}
            {appointmentsView === 'history' && (
              <div className="space-y-6">
                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  {/* Search Bar - Always Visible */}
                  <div className="mb-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={historyFilters.searchQuery}
                        onChange={(e) => setHistoryFilters({...historyFilters, searchQuery: e.target.value})}
                        className="pl-10 w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Search by name, email, or phone..."
                      />
                    </div>
                  </div>

                  {/* Advanced Filters Toggle */}
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center space-x-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <svg 
                      className={`w-4 h-4 transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>{showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters</span>
                  </button>

                  {/* Advanced Filters - Collapsible */}
                  {showAdvancedFilters && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
                        <button
                          onClick={resetHistoryFilters}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Reset All
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Date From */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            From Date
                          </label>
                          <input
                            type="date"
                            value={historyFilters.dateFrom}
                            onChange={(e) => setHistoryFilters({...historyFilters, dateFrom: e.target.value})}
                            className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        {/* Date To */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            To Date
                          </label>
                          <input
                            type="date"
                            value={historyFilters.dateTo}
                            onChange={(e) => setHistoryFilters({...historyFilters, dateTo: e.target.value})}
                            className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        {/* Status Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            value={historyFilters.statusFilter}
                            onChange={(e) => setHistoryFilters({...historyFilters, statusFilter: e.target.value})}
                            className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="all">All Statuses</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Barber Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Barber
                          </label>
                          <select
                            value={historyFilters.barberFilter}
                            onChange={(e) => setHistoryFilters({...historyFilters, barberFilter: e.target.value})}
                            className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="all">All Barbers</option>
                            {barbers.map(barber => (
                              <option key={barber.id} value={barber.id.toString()}>{barber.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Sort By */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sort By
                          </label>
                          <select
                            value={historyFilters.sortBy}
                            onChange={(e) => setHistoryFilters({...historyFilters, sortBy: e.target.value as 'date-desc' | 'date-asc' | 'name' | 'amount-desc' | 'amount-asc'})}
                            className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="date-desc">Date (Newest First)</option>
                            <option value="date-asc">Date (Oldest First)</option>
                            <option value="name">Client Name (A-Z)</option>
                            <option value="amount-desc">Amount (High to Low)</option>
                            <option value="amount-asc">Amount (Low to High)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Results</div>
                    <div className="text-2xl font-bold text-gray-900">{historyStats.total}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600 mb-1">Confirmed</div>
                    <div className="text-2xl font-bold text-green-600">{historyStats.confirmed}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600 mb-1">Pending</div>
                    <div className="text-2xl font-bold text-yellow-600">{historyStats.pending}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600 mb-1">Cancelled</div>
                    <div className="text-2xl font-bold text-red-600">{historyStats.cancelled}</div>
                  </div>
                </div>

                {/* Appointments List */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      All Appointments
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {filteredHistory.length} appointment(s)
                    </p>
                  </div>
                  <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                    {filteredHistory.map((appointment) => {
                      const isPast = new Date(appointment.appointment_datetime) < new Date();
                      const timeString = new Date(appointment.appointment_datetime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });
                      
                      // Status colors for left border
                      const borderColor = 
                        appointment.status === 'confirmed' ? 'border-l-green-500' :
                        appointment.status === 'cancelled' ? 'border-l-red-500' :
                        'border-l-yellow-500';
                      
                      // Swipe gesture component for mobile (history tab)
                      const SwipeableHistoryCard = () => {
                        const [touchStart, setTouchStart] = useState<number | null>(null);
                        const [touchCurrent, setTouchCurrent] = useState<number | null>(null);
                        const [isSwiping, setIsSwiping] = useState(false);
                        const [didSwipe, setDidSwipe] = useState(false);
                        const touchElementRef = useRef<HTMLDivElement>(null);
                        
                        const swipeThreshold = 100; // pixels needed to trigger action
                        
                        // Only allow swiping for pending appointments that are upcoming (not past)
                        const canSwipe = !isPast && appointment.status === 'pending';
                        
                        const handleTouchStart = (e: TouchEvent) => {
                          if (!canSwipe) return;
                          setTouchStart(e.touches[0].clientX);
                          setTouchCurrent(e.touches[0].clientX);
                          setIsSwiping(true);
                          setDidSwipe(false);
                        };
                        
                        const handleTouchMove = (e: TouchEvent) => {
                          if (!touchStart || !canSwipe) return;
                          const currentX = e.touches[0].clientX;
                          setTouchCurrent(currentX);
                          // Prevent scrolling while swiping horizontally
                          if (Math.abs(currentX - touchStart) > 10) {
                            e.preventDefault();
                            setDidSwipe(true);
                          }
                        };
                        
                        const handleTouchEnd = () => {
                          if (!touchStart || !touchCurrent || !canSwipe) {
                            setIsSwiping(false);
                            setTouchStart(null);
                            setTouchCurrent(null);
                            return;
                          }
                          
                          const diff = touchCurrent - touchStart;
                          
                          // Right swipe - Confirm
                          if (diff > swipeThreshold) {
                            updateAppointmentStatus(appointment.id, 'confirmed', appointment.client_name);
                          }
                          // Left swipe - Cancel
                          else if (diff < -swipeThreshold) {
                            updateAppointmentStatus(appointment.id, 'cancelled', appointment.client_name);
                          }
                          
                          setIsSwiping(false);
                          setTouchStart(null);
                          setTouchCurrent(null);
                          // Reset didSwipe after a short delay to allow onClick to check it
                          setTimeout(() => setDidSwipe(false), 100);
                        };

                        // Attach touch event listeners with passive: false
                        useEffect(() => {
                          const element = touchElementRef.current;
                          if (!element) return;

                          element.addEventListener('touchstart', handleTouchStart, { passive: true });
                          element.addEventListener('touchmove', handleTouchMove, { passive: false });
                          element.addEventListener('touchend', handleTouchEnd, { passive: true });

                          return () => {
                            element.removeEventListener('touchstart', handleTouchStart);
                            element.removeEventListener('touchmove', handleTouchMove);
                            element.removeEventListener('touchend', handleTouchEnd);
                          };
                        }, [touchStart, touchCurrent, canSwipe]);
                        
                        const swipeOffset = isSwiping && touchStart && touchCurrent ? touchCurrent - touchStart : 0;
                        const clampedOffset = Math.max(-200, Math.min(200, swipeOffset));
                        
                        // Show action hints
                        const showConfirmHint = swipeOffset > 30 && canSwipe;
                        const showCancelHint = swipeOffset < -30 && canSwipe;
                        
                        return (
                          <div className="relative overflow-hidden">
                            {/* Background action indicators - Full width colored backgrounds */}
                            {/* Confirm background (green, left side for right swipe) */}
                            <div className={`absolute inset-y-0 left-0 right-0 bg-green-500 flex items-center justify-start px-8 transition-opacity duration-200 ${showConfirmHint ? 'opacity-100' : 'opacity-0'}`}>
                              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            
                            {/* Cancel background (red, right side for left swipe) */}
                            <div className={`absolute inset-y-0 left-0 right-0 bg-red-500 flex items-center justify-end px-8 transition-opacity duration-200 ${showCancelHint ? 'opacity-100' : 'opacity-0'}`}>
                              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                            
                            {/* Swipeable content with border */}
                            <div
                              ref={touchElementRef}
                              style={{
                                transform: `translateX(${clampedOffset}px)`,
                                transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                              }}
                              onClick={() => !didSwipe && setSelectedAppointmentDetails(appointment)}
                              className={`bg-white relative z-10 cursor-pointer border-l-8 ${borderColor}`}
                            >
                              <div className="px-4 py-4">
                                <div className="flex items-start justify-between gap-3">
                                  {/* Left Side - Name */}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 break-words">
                                      {appointment.client_name}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      {new Date(appointment.appointment_datetime).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })} at {timeString}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      };
                      
                      return (
                        <li key={appointment.id} className="bg-white rounded-xl shadow-md overflow-hidden mb-3 relative">
                          {/* Mobile View with Swipe */}
                          <div className="lg:hidden">
                            <SwipeableHistoryCard />
                          </div>

                          {/* Desktop View */}
                          <div className="hidden lg:block px-6 py-4 relative">
                            {/* Colored border for desktop */}
                            <div className={`absolute left-0 top-0 bottom-0 w-2 ${borderColor}`}></div>
                            <div className="flex items-start justify-between">
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
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-gray-900">
                                      €{appointment.services.reduce((sum, s) => sum + s.price, 0).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {appointment.services.reduce((sum, s) => sum + s.duration_minutes, 0)} min
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                  <div className="mb-2 flex items-center space-x-4">
                                    <div>
                                      <span className="font-medium">Barber:</span> {appointment.barber.name}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {new Date(appointment.appointment_datetime).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="mb-2">
                                    <span className="font-medium">Services:</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {appointment.services.map((service) => (
                                        <span key={service.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                                          {service.name} - €{service.price}
                                        </span>
                                      ))}
                                    </div>
                            </div>
                          </div>
                          {appointment.notes && (
                                  <div className="mt-2 text-sm text-gray-600 bg-gray-100 rounded p-2">
                              <span className="font-medium">Notes:</span> {appointment.notes}
                            </div>
                          )}
                        </div>
                              {!isPast && (
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
                        )}
                      </div>
                    </div>
                  </li>
                      );
                    })}
                    {filteredHistory.length === 0 && (
                      <li className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p className="text-gray-500 text-lg font-medium">No appointments found</p>
                          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                        </div>
                  </li>
                )}
              </ul>
                </div>
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
                  <div>
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
                  <div>
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
                  <div>
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
                  <div>
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

            {/* Average Revenue by Day of Week & Popular Services */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Average Revenue by Day of Week */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Average Revenue by Day of Week</h3>
                <div className="space-y-3">
                  {analytics.revenueByDayOfWeek
                    .sort((a, b) => b.avgRevenue - a.avgRevenue)
                    .map((day, index) => {
                      const maxAvgRevenue = Math.max(...analytics.revenueByDayOfWeek.map(d => d.avgRevenue));
                      const percentage = maxAvgRevenue > 0 ? (day.avgRevenue / maxAvgRevenue) * 100 : 0;
                      
                      return (
                        <div key={index} className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{day.day}</span>
                            <div className="text-right">
                              <span className="text-sm font-bold text-gray-900">€{day.avgRevenue.toFixed(2)}</span>
                              <span className="text-xs text-gray-500 ml-2">avg</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 min-w-[60px] text-right">
                              {day.appointments} appts
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 text-right">
                            Total: €{day.totalRevenue.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  {analytics.revenueByDayOfWeek.every(d => d.appointments === 0) && (
                    <p className="text-gray-400 text-center py-8">No appointment data available</p>
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
                className="flex lg:inline-flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium w-full lg:w-auto"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Add New Barber</span>
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
                        <div className="mt-2 flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            barber.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {barber.is_active ? '✓ Active' : '✕ Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex gap-2">
                        <Link
                          href={`/admin/barbers/${barber.id}/services`}
                          className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-all shadow-md hover:shadow-lg hover:scale-110"
                          title="Manage Services"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/barbers/${barber.id}/edit`}
                          className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white transition-all shadow-md hover:shadow-lg hover:scale-110"
                          title="Edit Barber"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
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

      {/* Appointment Details Modal */}
      {selectedAppointmentDetails && (
        <div 
          className={`fixed inset-0 z-[9999] overflow-y-auto backdrop-blur-md bg-white/40 flex items-center justify-center p-4 transition-all duration-300 ${
            isModalAnimating ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeModal}
        >
          <div 
            className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ${
              isModalAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Appointment Details</h2>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Client Name */}
              <div className="text-center pb-4 border-b">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedAppointmentDetails.client_name}
                </h3>
                <div className="text-3xl font-bold text-indigo-600">
                  {new Date(selectedAppointmentDetails.appointment_datetime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {new Date(selectedAppointmentDetails.appointment_datetime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  selectedAppointmentDetails.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  selectedAppointmentDetails.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedAppointmentDetails.status.toUpperCase()}
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">{selectedAppointmentDetails.client_email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-600">{selectedAppointmentDetails.client_phone}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedAppointmentDetails.client_phone)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Copy phone number"
                  >
                    <svg className="w-4 h-4 text-gray-500 hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Barber */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-1">Barber</div>
                <div className="text-base font-semibold text-gray-900">{selectedAppointmentDetails.barber.name}</div>
              </div>

              {/* Services */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Services</div>
                <div className="space-y-2">
                  {selectedAppointmentDetails.services.map((service) => (
                    <div key={service.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <div>
                        <div className="font-medium text-gray-900">{service.name}</div>
                        <div className="text-sm text-gray-500">{service.duration_minutes} min</div>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">€{service.price}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t-2 border-gray-300 flex justify-between items-center">
                  <div className="font-bold text-gray-900">Total</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    €{selectedAppointmentDetails.services.reduce((sum, s) => sum + s.price, 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-sm text-gray-500 text-right mt-1">
                  {selectedAppointmentDetails.services.reduce((sum, s) => sum + s.duration_minutes, 0)} minutes total
                </div>
              </div>

              {/* Notes */}
              {selectedAppointmentDetails.notes && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm font-medium text-blue-900 mb-2">Notes</div>
                  <div className="text-sm text-blue-800">{selectedAppointmentDetails.notes}</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t">
              {/* Show action buttons for upcoming appointments */}
              {new Date(selectedAppointmentDetails.appointment_datetime) >= new Date() && (
                <div className="flex gap-3">
                  {selectedAppointmentDetails.status !== 'confirmed' && (
                    <button
                      onClick={() => {
                        updateAppointmentStatus(selectedAppointmentDetails.id, 'confirmed', selectedAppointmentDetails.client_name);
                        closeModal();
                      }}
                      className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Confirm</span>
                    </button>
                  )}
                  {selectedAppointmentDetails.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        updateAppointmentStatus(selectedAppointmentDetails.id, 'cancelled', selectedAppointmentDetails.client_name);
                        closeModal();
                      }}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Up Next Simple Banner */}
      {nextAppointment && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center justify-between py-2 sm:py-3 gap-2">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">Up Next:</span>
                </div>
                <div className="text-xs sm:text-sm font-bold flex-shrink-0">
                  {new Date(nextAppointment.appointment_datetime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
                <div className="hidden sm:block text-xs sm:text-sm truncate">
                  {nextAppointment.client_name} • {nextAppointment.barber.name}
                </div>
              </div>
              <button
                onClick={goToNextAppointment}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white/20 hover:bg-white/30 rounded-lg transition-all flex-shrink-0"
                title="View appointment"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
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
