import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TestimonialsMarquee from '@/components/TestimonialsMarquee';
import LocationMap from '@/components/LocationMap';
import { getCourses, getTestimonials } from '@/lib/api';

export const revalidate = 60;

export default async function HomePage() {
  const [courses, testimonials] = await Promise.all([
    getCourses(),
    getTestimonials(),
  ]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-navy-start via-[#0f1738] to-navy-end text-text-dark-primary">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#E8B84A]/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-96 right-10 w-80 h-80 bg-[#4DA8FF]/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <Navbar />

      <main className="flex-grow z-10">
        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 border border-gold/30 text-gold text-xs font-semibold uppercase tracking-wider mb-6">
            <span>✨ Admissions Open for Session 2026–27</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-tight mb-6">
            Master <span className="text-gold">JEE & NEET</span> with Sheohar’s Top Science Faculty
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-xl text-text-dark-secondary leading-relaxed mb-10">
            Structured Class XI & XII coaching designed to help local students crack India's toughest entrance exams. High-yield practice, regular testing, and personalized attention.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="btn-gold text-base w-full sm:w-auto py-3.5 px-8">
              Book a Free Demo Class
            </Link>
            <a
              href="https://wa.me/919934212345?text=Hello%20NPC,%20I%20want%20to%20know%20more%20about%20JEE/NEET%20coaching"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald/20 border border-emerald/50 hover:bg-emerald/30 text-emerald font-semibold py-3.5 px-8 rounded-full transition-colors text-base"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.999 1.594-1.121 4.095 4.16-1.091 1.605.973z"/>
              </svg>
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="border-y border-white/10 bg-white/5 backdrop-blur-md py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="font-mono font-bold text-3xl sm:text-4xl text-gold">98%</div>
              <div className="text-xs text-text-dark-secondary mt-1">Board & Entrance Success</div>
            </div>
            <div>
              <div className="font-mono font-bold text-3xl sm:text-4xl text-gold">500+</div>
              <div className="text-xs text-text-dark-secondary mt-1">Qualified Aspirants</div>
            </div>
            <div>
              <div className="font-mono font-bold text-3xl sm:text-4xl text-gold">1:25</div>
              <div className="text-xs text-text-dark-secondary mt-1">Focused Student Ratio</div>
            </div>
            <div>
              <div className="font-mono font-bold text-3xl sm:text-4xl text-gold">10+</div>
              <div className="text-xs text-text-dark-secondary mt-1">Years Teaching Legacy</div>
            </div>
          </div>
        </section>

        {/* LIVE COURSES SHOWCASE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-4">
              Featured Programs & Courses
            </h2>
            <p className="text-text-dark-secondary max-w-2xl mx-auto text-sm sm:text-base">
              Comprehensive coaching packages tailored for Class XI & XII science students in Sheohar.
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="glass-panel p-8 text-center text-text-dark-secondary">
              <p className="text-base">No active courses currently loaded. Add courses in Admin Dashboard to publish them live!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {courses.slice(0, 3).map((course) => (
                <div key={course._id || course.id} className="glass-panel p-6 flex flex-col justify-between hover:border-gold/50 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/30">
                        {course.stream}
                      </span>
                      <span className="text-xs text-text-dark-secondary font-mono">
                        Class {course.class}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-xl mb-3 text-text-dark-primary">
                      {course.name || course.title}
                    </h3>
                    <p className="text-xs text-text-dark-secondary leading-relaxed mb-6">
                      {course.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-text-dark-secondary block">Program Fee</span>
                      <span className="font-mono font-bold text-lg text-gold">
                        ₹{course.fee.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Link
                      href="/contact"
                      className="text-xs font-semibold text-text-dark-primary hover:text-gold transition-colors flex items-center space-x-1"
                    >
                      <span>Enroll Now</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link href="/courses" className="text-sm font-semibold text-gold hover:underline">
              View All Available Courses & Filter by Class →
            </Link>
          </div>
        </section>

        {/* LIVE TESTIMONIALS MARQUEE SECTION */}
        <section className="bg-white/5 py-16 sm:py-20 border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3">
              Student Success Stories
            </h2>
            <p className="text-text-dark-secondary max-w-2xl mx-auto text-sm sm:text-base">
              Hear directly from our toppers who cracked JEE, NEET, and Board exams from Sheohar. Hover to pause.
            </p>
          </div>

          <TestimonialsMarquee testimonials={testimonials} />
        </section>

        {/* LOCATION MAP SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <LocationMap />
        </section>

        {/* DEMO ENQUIRY BANNER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="glass-panel p-8 sm:p-12 text-center relative overflow-hidden border-gold/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-2xl pointer-events-none"></div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-4">
              Start Your Preparation Today
            </h2>
            <p className="text-text-dark-secondary max-w-2xl mx-auto mb-8 text-sm sm:text-base">
              Attend 3 free trial classes with our expert faculty in Sheohar before making your decision.
            </p>
            <Link href="/contact" className="btn-gold text-base py-3.5 px-8">
              Request Free Trial Class
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
