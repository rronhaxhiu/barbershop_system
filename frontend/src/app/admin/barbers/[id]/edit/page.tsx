'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

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

export default function EditBarberPage() {
  const router = useRouter();
  const params = useParams();
  const barberId = params.id as string;
  
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BarberForm>();

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
      alert('Failed to load barber data');
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
      router.push('/admin');
    } catch (error) {
      console.error('Error updating barber:', error);
      alert('Failed to update barber. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading barber data...</p>
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
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-500 hover:text-gray-900">Home</Link>
              <Link href="/admin" className="text-gray-500 hover:text-gray-900">Dashboard</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Barber</h1>
            <p className="mt-2 text-gray-600">Update {barber.name}'s information.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Barber Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                placeholder="Enter barber's full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                placeholder="Describe the barber's experience, specialties, and skills..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Working Hours */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Working Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <div key={day}>
                    <label className="block text-sm font-medium text-gray-900 mb-1 capitalize">
                      {day}
                    </label>
                    <select
                      {...register(`working_hours.${day}` as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
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
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Status</h3>
              <p className="text-sm text-gray-600">
                Status: <span className={`font-medium ${barber.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {barber.is_active ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/admin"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating...' : 'Update Barber'}
              </button>
            </div>
          </form>

          {/* Additional Actions */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/admin/barbers/${barberId}/services`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Manage Services
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
