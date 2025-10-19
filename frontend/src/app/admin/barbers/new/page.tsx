'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authUtils } from '@/lib/auth';
import { useToast } from '@/components/Toast';

interface BarberForm {
  name: string;
  description: string;
  working_hours: string;
}

function NewBarberContent() {
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<BarberForm>();

  const handleLogout = () => {
    authUtils.logout();
  };

  const onSubmit = async (data: BarberForm) => {
    setSubmitting(true);
    try {
      // Convert working hours to JSON string
      const workingHours = {
        monday: "09:00-17:00",
        tuesday: "09:00-17:00",
        wednesday: "09:00-17:00",
        thursday: "09:00-17:00",
        friday: "09:00-17:00",
        saturday: "09:00-15:00",
        sunday: "closed"
      };

      await api.post('/admin/barbers', {
        ...data,
        working_hours: JSON.stringify(workingHours)
      });
      
      showSuccess('Barber created successfully!');
      setTimeout(() => router.push('/admin'), 1000);
    } catch (error) {
      console.error('Error creating barber:', error);
      showError('Failed to create barber. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Add New Barber</h1>
            <p className="mt-2 text-gray-600">Create a new barber profile with their information.</p>
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

            {/* Working Hours Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Default Working Hours</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Monday - Friday: 9:00 AM - 5:00 PM</p>
                <p>• Saturday: 9:00 AM - 3:00 PM</p>
                <p>• Sunday: Closed</p>
                <p className="mt-2 text-xs">Working hours can be customized later in the barber&apos;s profile.</p>
              </div>
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
                {submitting ? 'Creating...' : 'Create Barber'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function NewBarberPage() {
  return (
    <ProtectedRoute>
      <NewBarberContent />
    </ProtectedRoute>
  );
}
