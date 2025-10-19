import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">💈 Barbershop</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/book" className="text-gray-500 hover:text-gray-900">Book Appointment</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Professional Barbershop
            <span className="block text-indigo-600">Appointment System</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Book your appointment with our skilled barbers. Choose your preferred barber, service, and time slot.
            Receive instant email confirmation.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                href="/book"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center">
                <div className="text-3xl mb-4">✂️</div>
                <h3 className="text-lg font-medium text-gray-900">Expert Barbers</h3>
                <p className="mt-2 text-gray-500">
                  Our skilled barbers provide professional cuts, styling, and grooming services.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center">
                <div className="text-3xl mb-4">📅</div>
                <h3 className="text-lg font-medium text-gray-900">Easy Booking</h3>
                <p className="mt-2 text-gray-500">
                  Simple online booking system with real-time availability and instant confirmation.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center">
                <div className="text-3xl mb-4">📧</div>
                <h3 className="text-lg font-medium text-gray-900">Email Confirmation</h3>
                <p className="mt-2 text-gray-500">
                  Receive confirmation emails with appointment details and easy confirmation links.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Barbershop Appointment System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
