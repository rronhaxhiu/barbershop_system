'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authUtils } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { useModal } from '@/components/Modal';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

interface Barber {
  id: number;
  name: string;
  description: string;
}

interface ServiceForm {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
}

function ManageServicesContent() {
  const { showError, showSuccess } = useToast();
  const { confirm } = useModal();
  const params = useParams();
  const barberId = params.id as string;
  
  const [barber, setBarber] = useState<Barber | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ServiceForm>();

  const handleLogout = () => {
    authUtils.logout();
  };

  useEffect(() => {
    fetchData();
  }, [barberId]);

  const fetchData = async () => {
    try {
      const [barberRes, servicesRes] = await Promise.all([
        api.get(`/barbers/${barberId}`),
        api.get(`/barbers/${barberId}/services`, {
          params: { include_inactive: true }
        })
      ]);
      setBarber(barberRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ServiceForm) => {
    setSubmitting(true);
    try {
      await api.post('/admin/services', {
        ...data,
        barber_id: parseInt(barberId)
      });
      reset();
      setShowAddForm(false);
      showSuccess('Service created successfully!');
      fetchData(); // Refresh the services list
    } catch (error) {
      console.error('Error creating service:', error);
      showError('Failed to create service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleServiceStatus = async (serviceId: number, currentStatus: boolean) => {
    try {
      await api.put(`/admin/services/${serviceId}`, {
        is_active: !currentStatus
      });
      showSuccess(`Service ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchData(); // Refresh the services list
    } catch (error) {
      console.error('Error updating service:', error);
      showError('Failed to update service status');
    }
  };

  const toggleServiceStatusWithConfirm = async (serviceId: number, currentStatus: boolean, serviceName: string) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmed = await confirm({
      title: `${action === 'deactivate' ? 'Deactivate' : 'Activate'} Service`,
      message: `Are you sure you want to ${action} "${serviceName}"? ${currentStatus ? 'Deactivated services will not be available for new bookings but will remain visible in the admin panel.' : 'This service will become available for new bookings.'}`,
      confirmText: action === 'deactivate' ? 'Deactivate' : 'Activate',
      cancelText: 'Cancel',
      type: action === 'deactivate' ? 'warning' : 'success'
    });

    if (confirmed) {
      await toggleServiceStatus(serviceId, currentStatus);
    }
  };

  const deleteService = async (serviceId: number, serviceName: string) => {
    const confirmed = await confirm({
      title: 'Delete Service',
      message: `Are you sure you want to permanently delete "${serviceName}"? This action cannot be undone and may affect existing appointments using this service.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      try {
        await api.delete(`/admin/services/${serviceId}`);
        showSuccess('Service deleted successfully!');
        fetchData(); // Refresh the services list
      } catch (error) {
        console.error('Error deleting service:', error);
        showError('Failed to delete service. It may be in use by existing appointments.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Barber Not Found</h1>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Admin
          </Link>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Services</h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">Services for {barber.name}</p>
            </div>
            <div className="flex space-x-2 sm:space-x-3">
              <Link
                href={`/admin/barbers/${barberId}/edit`}
                className="flex items-center justify-center sm:space-x-2 px-3 sm:px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
                title="Edit Barber"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Edit Barber</span>
              </Link>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className={`flex items-center justify-center sm:space-x-2 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${
                  showAddForm 
                    ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                }`}
                title={showAddForm ? 'Cancel' : 'Add Service'}
              >
                {showAddForm ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="hidden sm:inline">Cancel</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Add Service</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Add Service Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Service</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'Service name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    placeholder="e.g., Classic Haircut"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Price (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price', {
                      required: 'Price is required',
                      min: { value: 0, message: 'Price must be positive' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    placeholder="25.00"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    {...register('duration_minutes', {
                      required: 'Duration is required',
                      min: { value: 1, message: 'Duration must be at least 1 minute' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    placeholder="30"
                  />
                  {errors.duration_minutes && (
                    <p className="mt-1 text-sm text-red-600">{errors.duration_minutes.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="Describe the service..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex items-center space-x-2 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Service</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-xl font-bold text-gray-900">
              <span className="hidden sm:inline">All Services ({services.filter(s => s.is_active).length} active, {services.filter(s => !s.is_active).length} inactive)</span>
              <span className="sm:hidden">Services ({services.filter(s => s.is_active).length}/{services.length})</span>
            </h2>
          </div>
          
          {services.length === 0 ? (
            <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-gray-500 text-sm sm:text-base">
              No services found. Add your first service above.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {services.map((service) => (
                <li key={service.id} className={`px-3 sm:px-6 py-3 sm:py-4 ${!service.is_active ? 'bg-gray-50 opacity-75' : ''}`}>
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className={`text-sm sm:text-lg font-medium ${service.is_active ? 'text-gray-900' : 'text-gray-500 line-through'} truncate`}>
                          {service.name}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                          service.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {service.description && (
                        <p className="hidden sm:block text-sm text-gray-500 mt-1">{service.description}</p>
                      )}
                      <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 font-medium">
                        €{service.price} • {service.duration_minutes}min
                      </div>
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleServiceStatusWithConfirm(service.id, service.is_active, service.name)}
                        className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all shadow-md hover:shadow-lg hover:scale-110 ${
                          service.is_active
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                        title={service.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {service.is_active ? (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => deleteService(service.id, service.name)}
                        className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-md hover:shadow-lg hover:scale-110"
                        title="Delete"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/admin"
            className="inline-flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Admin Dashboard</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function ManageServicesPage() {
  return (
    <ProtectedRoute>
      <ManageServicesContent />
    </ProtectedRoute>
  );
}
