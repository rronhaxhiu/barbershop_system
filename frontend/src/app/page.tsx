import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 w-full bg-black/95 backdrop-blur-sm border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <span className="text-2xl md:text-3xl font-bold text-white tracking-wider">
                HOUSE OF CUTZ
              </span>
            </div>
            <nav className="flex space-x-4 md:space-x-8">
              <Link 
                href="/book" 
                className="text-white/80 hover:text-white transition-colors text-sm md:text-base font-medium"
              >
                BOOK NOW
              </Link>
              <Link 
                href="/admin/login" 
                className="text-white/60 hover:text-white/80 transition-colors text-sm md:text-base"
              >
                ADMIN
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-zinc-900"></div>
          
          {/* Decorative lines */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute bottom-1/4 right-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          <div className="relative text-center max-w-5xl mx-auto">
            {/* Accent line */}
            <div className="w-24 h-px bg-white mx-auto mb-8"></div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
              HOUSE OF
              <span className="block mt-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                CUTZ
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-white/70 mb-4 font-light tracking-wide">
              Master Barber • Emin Cakiqi
            </p>
            
            <p className="text-base sm:text-lg text-white/60 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Where precision meets artistry. Experience the finest in men&apos;s grooming 
              with personalized service and uncompromising attention to detail.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/book"
                className="group relative px-12 py-4 bg-white text-black font-semibold text-lg tracking-wider hover:bg-white/90 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">BOOK APPOINTMENT</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              
              <a
                href="#services"
                className="px-12 py-4 border-2 border-white text-white font-semibold text-lg tracking-wider hover:bg-white hover:text-black transition-all duration-300"
              >
                VIEW SERVICES
              </a>
            </div>

            {/* Accent line */}
            <div className="w-24 h-px bg-white mx-auto mt-16"></div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-24 bg-zinc-900 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="w-16 h-px bg-white/30 mx-auto mb-6"></div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                PREMIUM SERVICES
              </h2>
              <p className="text-white/60 text-lg font-light">
                Crafted with excellence, delivered with precision
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Service 1 */}
              <div className="group bg-black border border-white/10 p-8 hover:border-white/30 transition-all duration-500">
                <div className="mb-6">
                  <svg className="w-12 h-12 text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">
                    SIGNATURE CUT
                  </h3>
                  <div className="w-12 h-px bg-white/20 mb-4"></div>
                </div>
                <p className="text-white/70 leading-relaxed font-light mb-6">
                  A personalized haircut tailored to your style, facial structure, and lifestyle. 
                  Includes consultation, precision cutting, and styling.
                </p>
                <div className="text-white/90 text-sm tracking-wider">FROM €45</div>
              </div>

              {/* Service 2 */}
              <div className="group bg-black border border-white/10 p-8 hover:border-white/30 transition-all duration-500">
                <div className="mb-6">
                  <svg className="w-12 h-12 text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">
                    BEARD DESIGN
                  </h3>
                  <div className="w-12 h-px bg-white/20 mb-4"></div>
                </div>
                <p className="text-white/70 leading-relaxed font-light mb-6">
                  Expert beard shaping and grooming service. Hot towel treatment, 
                  precise trimming, and conditioning for a refined look.
                </p>
                <div className="text-white/90 text-sm tracking-wider">FROM €30</div>
              </div>

              {/* Service 3 */}
              <div className="group bg-black border border-white/10 p-8 hover:border-white/30 transition-all duration-500">
                <div className="mb-6">
                  <svg className="w-12 h-12 text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">
                    PREMIUM PACKAGE
                  </h3>
                  <div className="w-12 h-px bg-white/20 mb-4"></div>
                </div>
                <p className="text-white/70 leading-relaxed font-light mb-6">
                  The complete grooming experience. Signature cut, beard design, 
                  hot towel shave, and scalp massage for ultimate relaxation.
                </p>
                <div className="text-white/90 text-sm tracking-wider">FROM €85</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-24 bg-black px-4 sm:px-6 lg:px-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="w-16 h-px bg-white/30 mx-auto mb-6"></div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                THE EXPERIENCE
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-3xl">✂</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">MASTER CRAFTSMANSHIP</h3>
                <p className="text-white/60 font-light leading-relaxed">
                  Years of expertise in precision cutting and modern styling techniques
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-3xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">INSTANT BOOKING</h3>
                <p className="text-white/60 font-light leading-relaxed">
                  Easy online scheduling with real-time availability and confirmation
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-3xl">💎</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">PREMIUM PRODUCTS</h3>
                <p className="text-white/60 font-light leading-relaxed">
                  Only the finest professional-grade products for optimal results
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-3xl">⭐</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">PERSONALIZED SERVICE</h3>
                <p className="text-white/60 font-light leading-relaxed">
                  Every client receives individualized attention and care
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-b from-zinc-900 to-black px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-px bg-white/30 mx-auto mb-8"></div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              READY FOR YOUR TRANSFORMATION?
            </h2>
            <p className="text-xl text-white/70 mb-12 font-light">
              Book your appointment today and experience the difference
            </p>
            <Link
              href="/book"
              className="inline-block px-16 py-5 bg-white text-black font-bold text-lg tracking-widest hover:bg-white/90 transition-all duration-300 shadow-2xl hover:shadow-white/20"
            >
              BOOK NOW
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white text-2xl font-bold mb-4 tracking-wider">HOUSE OF CUTZ</h3>
              <p className="text-white/60 font-light">
                Premium men&apos;s grooming by master barber Emin Cakiqi
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 tracking-wide">QUICK LINKS</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/book" className="text-white/60 hover:text-white transition-colors">
                    Book Appointment
                  </Link>
                </li>
                <li>
                  <Link href="/admin/login" className="text-white/60 hover:text-white transition-colors">
                    Admin Portal
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 tracking-wide">CONTACT</h4>
              <p className="text-white/60 font-light">
                For inquiries, please book online or call during business hours
              </p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/50 text-sm">
            <p>&copy; 2024 House of Cutz. All rights reserved. • Master Barber: Emin Cakiqi</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
