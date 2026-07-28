import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Faculty Members — New Pi Classes Sheohar',
  description: 'Meet our expert Physics, Chemistry, Biology, and Mathematics faculty members guiding JEE and NEET aspirants in Sheohar.',
};

/**
 * PLACEHOLDER FACULTY DATA
 * [FLAGGED FOR UPDATE]: Replace this array with live database/backend API or management assets when real faculty data is provided.
 */
const PLACEHOLDER_FACULTY = [
  {
    id: 'f1',
    name: 'Er. Rajesh Sharma',
    role: 'Senior Physics Faculty & Co-Founder',
    qualification: 'B.Tech (IIT Kanpur), 12+ Yrs Teaching Experience',
    subject: 'Physics',
    specialization: 'Mechanics, Electrodynamics & Optics for JEE Advanced',
    bio: 'Renowned for simplifying complex physics numericals into step-by-step physical intuition.',
  },
  {
    id: 'f2',
    name: 'Dr. Anita Verma',
    role: 'Head of Biology & Medical Prep',
    qualification: 'Ph.D. (Botany, BHU), M.Sc. Gold Medalist',
    subject: 'Biology',
    specialization: 'Genetics, Plant Physiology & NEET NCERT Mastery',
    bio: 'Guided over 200+ students into top government medical colleges across Bihar and India.',
  },
  {
    id: 'f3',
    name: 'Prof. Alok Kumar',
    role: 'Senior Chemistry Faculty',
    qualification: 'M.Sc. Chemistry (DU), NET Qualified',
    subject: 'Chemistry',
    specialization: 'Organic Reaction Mechanisms & Physical Chemistry',
    bio: 'Expert at breaking down organic synthesis and physical stoichiometry for fast exam solving.',
  },
  {
    id: 'f4',
    name: 'Vikash Chandra',
    role: 'Mathematics Specialist',
    qualification: 'M.Sc. Applied Mathematics (Patna Univ)',
    subject: 'Mathematics',
    specialization: 'Calculus, Algebra & Coordinate Geometry for JEE',
    bio: 'Specializes in high-speed shortcut methods and calculus problem-solving strategies.',
  },
];

export default function FacultyPage() {
  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-navy-start via-[#0f1738] to-navy-end text-text-dark-primary">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-mono mb-4">
            <span>[DEVELOPER NOTICE: PLACEHOLDER DATA FLAGGED FOR PRODUCTION SWAP]</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-4">
            Our Expert Science & Maths Faculty
          </h1>
          <p className="text-text-dark-secondary max-w-2xl mx-auto text-sm sm:text-base">
            Dedicated educators with proven track records of training top rankers in JEE Main, JEE Advanced, and NEET.
          </p>
        </div>

        {/* Faculty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PLACEHOLDER_FACULTY.map((f) => (
            <div key={f.id} className="glass-panel p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/30">
                    {f.subject}
                  </span>
                  <span className="text-xs text-text-dark-secondary font-mono">
                    Verified Instructor
                  </span>
                </div>

                <h3 className="font-display font-bold text-2xl mb-1 text-text-dark-primary">
                  {f.name}
                </h3>
                <p className="text-xs text-gold font-mono mb-3">{f.role}</p>

                <p className="text-xs text-text-dark-secondary font-semibold mb-4 border-b border-white/10 pb-3">
                  🎓 {f.qualification}
                </p>

                <p className="text-xs text-text-dark-secondary leading-relaxed mb-4">
                  {f.bio}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 text-xs text-text-dark-secondary">
                <span className="text-text-dark-primary font-semibold">Specialization:</span> {f.specialization}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
