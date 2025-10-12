'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import Link from 'next/link';

interface Barber {
  id: number;
  name: string;
  description: string;
  services: Service[];
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
}

interface BookingForm {
  barber_id: number;
  service_id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  appointment_datetime: string;
  notes?: string;
}

const API_BASE_URL = 'http://localhost:8000/api';

export default function BookingPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BookingForm>();

  const watchedBarberId = watch('barber_id');
  const watchedServiceId = watch('service_id');

  useEffect(() => {
    fetchBarbers();
  }, []);

  useEffect(() => {
    if (watchedBarberId) {
      const barber = barbers.find(b => b.id === parseInt(watchedBarberId.toString()));
      setSelectedBarber(barber || null);
      setSelectedService(null);
      setValue('service_id', 0);
    }
  }, [watchedBarberId, barbers, setValue]);

  useEffect(() => {
    if (watchedServiceId && selectedBarber) {
      const service = selectedBarber.services.find(s => s.id === parseInt(watchedServiceId.toString()));
      setSelectedService(service || null);
    }
  }, [watchedServiceId, selectedBarber]);

  const fetchBarbers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/barbers`);
      setBarbers(response.data);
    } catch (error) {
      console.error('Error fetching barbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BookingForm) => {
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/appointments`, data);
      setSuccess(true);
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading barbers...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment Booked!</h2>
          <p className="text-gray-600 mb-6">
            We've sent a confirmation email to your email address. Please click the confirmation link to confirm your appointment.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Home
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
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">💈 Barbershop</span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-500 hover:text-gray-900">Home</Link>
              <Link href="/admin" className="text-gray-500 hover:text-gray-900">Admin</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Book Your Appointment</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Barber Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Barber *
              </label>
              <select
                {...register('barber_id', { required: 'Please select a barber' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              >
                <option value="">Choose a barber...</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
              {errors.barber_id && (
                <p className="mt-1 text-sm text-red-600">{errors.barber_id.message}</p>
              )}
            </div>

            {/* Barber Description */}
            {selectedBarber && (
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900">{selectedBarber.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{selectedBarber.description}</p>
              </div>
            )}

            {/* Service Selection */}
            {selectedBarber && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Select Service *
                </label>
                <select
                  {...register('service_id', { required: 'Please select a service' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                >
                  <option value="">Choose a service...</option>
                  {selectedBarber.services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - €{service.price} ({service.duration_minutes} min)
                    </option>
                  ))}
                </select>
                {errors.service_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.service_id.message}</p>
                )}
              </div>
            )}

            {/* Service Description */}
            {selectedService && (
              <div className="bg-green-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900">{selectedService.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{selectedService.description}</p>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Price:</span> €{selectedService.price} |
                  <span className="font-medium ml-2">Duration:</span> {selectedService.duration_minutes} minutes
                </div>
              </div>
            )}

            {/* Client Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('client_name', { required: 'Name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="Your full name"
                />
                {errors.client_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.client_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  {...register('client_email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="your.email@example.com"
                />
                {errors.client_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.client_email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  {...register('client_phone', { required: 'Phone number is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="(555) 123-4567"
                />
                {errors.client_phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.client_phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Appointment Date & Time *
                </label>
                <input
                  type="datetime-local"
                  {...register('appointment_datetime', { required: 'Date and time is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  min={new Date().toISOString().slice(0, 16)}
                />
                {errors.appointment_datetime && (
                  <p className="mt-1 text-sm text-red-600">{errors.appointment_datetime.message}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                placeholder="Any special requests or notes..."
              />
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
