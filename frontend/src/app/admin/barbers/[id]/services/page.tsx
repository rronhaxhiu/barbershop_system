'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authUtils } from '@/lib/auth';

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
        api.get(`/barbers/${barberId}/services`)
      ]);
      setBarber(barberRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data');
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
      fetchData(); // Refresh the services list
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Failed to create service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleServiceStatus = async (serviceId: number, currentStatus: boolean) => {
    try {
      await api.put(`/admin/services/${serviceId}`, {
        is_active: !currentStatus
      });
      fetchData(); // Refresh the services list
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Failed to update service status');
    }
  };

  const deleteService = async (serviceId: number, serviceName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${serviceName}"?\n\nThis action cannot be undone and will affect any existing appointments using this service.`
    );

    if (confirmed) {
      try {
        await api.delete(`/admin/services/${serviceId}`);
        fetchData(); // Refresh the services list
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service. It may be in use by existing appointments.');
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
          <div className="flex justify-between items-center py-6">
            <Link href="/admin" className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">💈 Barbershop Admin</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/" className="text-gray-500 hover:text-gray-900">Home</Link>
              <Link href="/admin" className="text-gray-500 hover:text-gray-900">Dashboard</Link>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Services</h1>
              <p className="mt-2 text-gray-600">Services for {barber.name}</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href={`/admin/barbers/${barberId}/edit`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Edit Barber
              </Link>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {showAddForm ? 'Cancel' : 'Add Service'}
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

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Current Services ({services.length})</h2>
          </div>
          
          {services.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No services found. Add your first service above.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {services.map((service) => (
                <li key={service.id} className={`px-6 py-4 ${!service.is_active ? 'bg-gray-50 opacity-75' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className={`text-lg font-medium ${service.is_active ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                          {service.name}
                        </h3>
                        <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                          service.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Price:</span> €{service.price} |
                        <span className="font-medium ml-2">Duration:</span> {service.duration_minutes} minutes
                      </div>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => toggleServiceStatus(service.id, service.is_active)}
                        className={`px-3 py-1 text-xs font-medium rounded-md ${
                          service.is_active
                            ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                        }`}
                      >
                        {service.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteService(service.id, service.name)}
                        className="px-3 py-1 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        title="Delete service permanently"
                      >
                        🗑️
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
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Admin Dashboard
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
