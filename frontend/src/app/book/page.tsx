'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import api from '@/lib/api';

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
  service_ids: number[];
  client_name: string;
  client_email: string;
  client_phone: string;
  appointment_datetime: string;
  notes?: string;
}

export default function BookingPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BookingForm>({
    defaultValues: {
      service_ids: []
    }
  });

  const watchedBarberId = watch('barber_id');
  const watchedServiceIds = watch('service_ids');

  useEffect(() => {
    fetchBarbers();
  }, []);

  useEffect(() => {
    // Automatically select the first barber when barbers are loaded
    if (barbers.length > 0 && !selectedBarber) {
      const firstBarber = barbers[0];
      setSelectedBarber(firstBarber);
      setValue('barber_id', firstBarber.id);
    }
  }, [barbers, selectedBarber, setValue]);

  useEffect(() => {
    if (watchedBarberId) {
      const barber = barbers.find(b => b.id === parseInt(watchedBarberId.toString()));
      setSelectedBarber(barber || null);
      setSelectedServices([]);
      setValue('service_ids', []);
    }
  }, [watchedBarberId, barbers, setValue]);

  useEffect(() => {
    if (watchedServiceIds && selectedBarber) {
      const services = selectedBarber.services.filter(s => 
        watchedServiceIds.includes(s.id)
      );
      setSelectedServices(services);
    }
  }, [watchedServiceIds, selectedBarber]);

  const handleServiceToggle = (serviceId: number) => {
    const currentServiceIds = watchedServiceIds || [];
    const newServiceIds = currentServiceIds.includes(serviceId)
      ? currentServiceIds.filter(id => id !== serviceId)
      : [...currentServiceIds, serviceId];
    setValue('service_ids', newServiceIds);
  };

  const fetchBarbers = async () => {
    try {
      const response = await api.get('/barbers');
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
      // Ensure datetime has seconds appended
      const appointmentData = {
        ...data,
        appointment_datetime: data.appointment_datetime.length === 16 
          ? `${data.appointment_datetime}:00` 
          : data.appointment_datetime
      };
      await api.post('/appointments', appointmentData);
      setSuccess(true);
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1 && (!watchedServiceIds || watchedServiceIds.length === 0)) {
      alert('Please select at least one service');
      return;
    }
    if (currentStep === 2 && !watch('appointment_datetime')) {
      alert('Please select a date and time');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const totalSteps = 3;
  const progressPercentage = (currentStep / totalSteps) * 100;

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
          <div className="flex justify-center mb-4">
            <svg className="w-20 h-20 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment Booked!</h2>
          <p className="text-gray-600 mb-6">
            We&apos;ve sent a confirmation email to your email address. Please click the confirmation link to confirm your appointment.
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Book Your Appointment</h1>
          
          {/* Barber Information */}
          {selectedBarber && (
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-500">Your barber:</p>
              <p className="font-semibold text-indigo-700 text-lg">{selectedBarber.name}</p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {currentStep === 1 ? 'Select Services' : currentStep === 2 ? 'Choose Date & Time' : 'Your Information'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep === step 
                      ? 'border-indigo-600 bg-indigo-600 text-white' 
                      : currentStep > step 
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    {currentStep > step ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-0.5 mx-2 ${currentStep > step ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Hidden input for barber_id */}
            <input type="hidden" {...register('barber_id', { required: 'Barber is required' })} />

            {/* Step 1: Service Selection */}
            {currentStep === 1 && selectedBarber && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">Choose Your Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedBarber.services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleServiceToggle(service.id)}
                      className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${
                        watchedServiceIds?.includes(service.id)
                          ? 'border-indigo-600 bg-indigo-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center text-gray-700">
                              <svg className="w-4 h-4 mr-1.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-semibold">€{service.price}</span>
                            </span>
                            <span className="flex items-center text-gray-700">
                              <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{service.duration_minutes} min</span>
                            </span>
                          </div>
                        </div>
                        <div className={`ml-4 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          watchedServiceIds?.includes(service.id)
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {watchedServiceIds?.includes(service.id) && (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Services Summary */}
                {selectedServices.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-gray-900 mb-3 text-lg">Your Selection</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      {selectedServices.map((service) => (
                        <div key={service.id} className="flex justify-between">
                          <span>• {service.name}</span>
                          <span className="font-medium">€{service.price}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-300 flex justify-between font-semibold text-gray-900">
                      <div className="space-y-1">
                        <div>Total Duration: {selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0)} minutes</div>
                        <div className="text-lg text-indigo-700">Total Price: €{selectedServices.reduce((sum, s) => sum + s.price, 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Date & Time Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">Choose Date & Time</h2>
                
                {/* Selected Services Summary */}
                {selectedServices.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-gray-900 mb-2">Selected Services:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedServices.map((service) => (
                        <span key={service.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                          {service.name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Total time needed: {selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0)} minutes
                    </p>
                  </div>
                )}

                <div className="max-w-md mx-auto">
                  <label className="block text-lg font-medium text-gray-900 mb-3 text-center">
                    Select Your Appointment Time
                  </label>
                  <input
                    type="datetime-local"
                    {...register('appointment_datetime', { required: 'Date and time is required' })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-lg"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {errors.appointment_datetime && (
                    <p className="mt-2 text-sm text-red-600 text-center">{errors.appointment_datetime.message}</p>
                  )}
                  <p className="mt-3 text-sm text-gray-500 text-center">
                    Please select a date and time for your appointment
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Personal Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">Your Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      {...register('client_name', { required: 'Name is required' })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                      placeholder="John Doe"
                    />
                    {errors.client_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.client_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email Address *
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
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                      placeholder="john.doe@example.com"
                    />
                    {errors.client_email && (
                      <p className="mt-1 text-sm text-red-600">{errors.client_email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      {...register('client_phone', { required: 'Phone number is required' })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                      placeholder="(555) 123-4567"
                    />
                    {errors.client_phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.client_phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                      placeholder="Any special requests or notes..."
                    />
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border-2 border-indigo-200">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Barber:</span>
                      <span className="font-medium text-gray-900">{selectedBarber?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Services:</span>
                      <span className="font-medium text-gray-900">{selectedServices.length} selected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-gray-900">
                        {watch('appointment_datetime') ? new Date(watch('appointment_datetime')).toLocaleString() : 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-indigo-300">
                      <span className="text-gray-700 font-medium">Total:</span>
                      <span className="font-bold text-indigo-700 text-lg">
                        €{selectedServices.reduce((sum, s) => sum + s.price, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ← Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    'Booking...'
                  ) : (
                    <>
                      Confirm Booking
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
