'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authUtils } from '@/lib/auth';
import { useToast } from '@/components/Toast';

interface BarberForm {
  name: string;
  description: string;
  working_hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

interface Barber {
  id: number;
  name: string;
  description: string;
  working_hours: string;
  is_active: boolean;
}

function EditBarberContent() {
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const params = useParams();
  const barberId = params.id as string;
  
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BarberForm>();

  const handleLogout = () => {
    authUtils.logout();
  };

  useEffect(() => {
    fetchBarber();
  }, [barberId]);

  const fetchBarber = async () => {
    try {
      const response = await api.get(`/barbers/${barberId}`);
      const barberData = response.data;
      setBarber(barberData);
      setValue('name', barberData.name);
      setValue('description', barberData.description);

      // Parse and set working hours
      const workingHours = barberData.working_hours ? JSON.parse(barberData.working_hours) : {
        monday: '09:00-17:00',
        tuesday: '09:00-17:00',
        wednesday: '09:00-17:00',
        thursday: '09:00-17:00',
        friday: '09:00-17:00',
        saturday: '09:00-15:00',
        sunday: 'closed'
      };

      Object.keys(workingHours).forEach(day => {
        setValue(`working_hours.${day}` as any, workingHours[day]);
      });
    } catch (error) {
      console.error('Error fetching barber:', error);
      showError('Failed to load barber data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BarberForm) => {
    setSubmitting(true);
    try {
      const submitData = {
        ...data,
        working_hours: JSON.stringify(data.working_hours)
      };
      await api.put(`/admin/barbers/${barberId}`, submitData);
      showSuccess('Barber updated successfully!');
      setTimeout(() => router.push('/admin'), 1000);
    } catch (error) {
      console.error('Error updating barber:', error);
      showError('Failed to update barber. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-white/60 tracking-wide">LOADING BARBER DATA...</p>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">BARBER NOT FOUND</h1>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-black bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg shadow-emerald-500/30"
          >
            BACK TO ADMIN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <Link href="/admin" className="flex items-center">
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-wider">HOUSE OF CUTZ ADMIN</span>
            </Link>
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="hidden sm:inline text-white/60 hover:text-white transition-colors">HOME</Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white border-2 border-red-500/50 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition-colors"
              >
                LOGOUT
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-xl p-4 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Edit Barber</h1>
            <p className="mt-2 text-sm sm:text-base text-white/70">Update {barber.name}'s information.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Barber Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="w-full px-4 py-3 border-2 border-white/30 bg-black rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-white transition-all placeholder:text-white/40"
                placeholder="Enter barber's full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="w-full px-4 py-3 border-2 border-white/30 bg-black rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-white transition-all placeholder:text-white/40"
                placeholder="Describe the barber's experience, specialties, and skills..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Working Hours */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Working Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <div key={day}>
                    <label className="block text-sm font-medium text-white mb-1 capitalize">
                      {day}
                    </label>
                    <select
                      {...register(`working_hours.${day}` as any)}
                      className="w-full px-4 py-3 border-2 border-white/30 bg-black rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-white transition-all placeholder:text-white/40"
                    >
                      <option value="closed">Closed</option>
                      <option value="08:00-16:00">8:00 AM - 4:00 PM</option>
                      <option value="09:00-17:00">9:00 AM - 5:00 PM</option>
                      <option value="10:00-18:00">10:00 AM - 6:00 PM</option>
                      <option value="11:00-19:00">11:00 AM - 7:00 PM</option>
                      <option value="12:00-20:00">12:00 PM - 8:00 PM</option>
                      <option value="09:00-15:00">9:00 AM - 3:00 PM</option>
                      <option value="10:00-16:00">10:00 AM - 4:00 PM</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Status</h3>
              <p className="text-sm text-white/70">
                Status: <span className={`font-medium ${barber.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {barber.is_active ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-row gap-3">
              <Link
                href="/admin"
                className="flex items-center justify-center space-x-2 px-6 py-2.5 border-2 border-white/30 text-white/80 rounded-lg hover:bg-white/10 hover:border-white/50 transition-all font-medium w-1/2 sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancel</span>
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-black rounded-xl hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium w-1/2 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Additional Actions */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
            <div className="flex gap-3">
              <Link
                href={`/admin/barbers/${barberId}/services`}
                className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
                <span>Manage Services</span>
              </Link>
              <Link
                href="/admin"
                className="flex items-center space-x-2 px-5 py-3 border-2 border-white/30 text-white/80 rounded-lg hover:bg-white/10 hover:border-white/50 transition-all font-medium"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EditBarberPage() {
  return (
    <ProtectedRoute>
      <EditBarberContent />
    </ProtectedRoute>
  );
}
