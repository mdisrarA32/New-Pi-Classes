import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'About Us — New Pi Classes Sheohar',
  description: 'Learn about New Pi Classes, Sheohar premier institute for Class XI & XII JEE, NEET, and Board exam preparation.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-navy-start via-[#0f1738] to-navy-end text-text-dark-primary">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-mono mb-4">
            <span>[DEVELOPER NOTICE: PLACEHOLDER HISTORY COPY FLAGGED FOR FINAL COPYWRITING]</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-4">
            About New Pi Classes (NPC)
          </h1>
          <p className="text-text-dark-secondary max-w-2xl mx-auto text-sm sm:text-base">
            Empowering students in Sheohar with Kota & Patna-grade science coaching without leaving their hometown.
          </p>
        </div>

        {/* Story Section */}
        <div className="glass-panel p-8 sm:p-12 mb-12 space-y-6 text-sm sm:text-base leading-relaxed text-text-dark-secondary">
          <h2 className="font-display font-bold text-2xl text-text-dark-primary border-b border-white/10 pb-3">
            Our Foundation Story
          </h2>
          <p>
            Established with a vision to eliminate the educational divide for rural and semi-urban students in Bihar, <strong>New Pi Classes (NPC)</strong> was founded in Sheohar by experienced IITians and medical educators. Before NPC, aspiring students had to migrate to Patna or Kota at great financial and personal strain to access quality entrance coaching.
          </p>
          <p>
            We brought Kota’s rigorous curriculum, structured DPPs (Daily Practice Problems), and weekly chapter testing directly to Sheohar. Our mission is simple: provide top-tier science education with zero compromise on concept clarity.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="glass-panel p-6">
            <div className="w-12 h-12 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xl font-bold mb-4 font-mono">
              01
            </div>
            <h3 className="font-display font-bold text-xl mb-2 text-text-dark-primary">
              Small Batch Guarantee
            </h3>
            <p className="text-xs text-text-dark-secondary leading-relaxed">
              We strictly cap batch sizes to 25 students. Every student gets personal desk-side doubt resolution and direct faculty mentorship.
            </p>
          </div>

          <div className="glass-panel p-6">
            <div className="w-12 h-12 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xl font-bold mb-4 font-mono">
              02
            </div>
            <h3 className="font-display font-bold text-xl mb-2 text-text-dark-primary">
              AI-Powered Doubt Support
            </h3>
            <p className="text-xs text-text-dark-secondary leading-relaxed">
              Students get access to NPC’s 24/7 AI Science Tutor proxy to clear formulas, numerical steps, and theoretical doubts anytime.
            </p>
          </div>

          <div className="glass-panel p-6">
            <div className="w-12 h-12 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xl font-bold mb-4 font-mono">
              03
            </div>
            <h3 className="font-display font-bold text-xl mb-2 text-text-dark-primary">
              Strict Testing & Rankings
            </h3>
            <p className="text-xs text-text-dark-secondary leading-relaxed">
              Bi-weekly computer-based and offline tests with automated negative marking and instant performance analytics for parents and students.
            </p>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="glass-panel p-8 text-center border-gold/30">
          <h3 className="font-display font-bold text-2xl mb-3 text-text-dark-primary">
            Ready to Join Sheohar’s Top Science Coaching?
          </h3>
          <p className="text-xs text-text-dark-secondary mb-6">
            Visit our classroom center near Hospital Road, Sheohar or request a call from our admissions counselor.
          </p>
          <Link href="/contact" className="btn-gold text-xs py-3 px-8">
            Contact Admissions Team
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
