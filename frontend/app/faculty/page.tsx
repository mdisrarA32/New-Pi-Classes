import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getPublicFaculty, FacultyItem } from '@/lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Faculty Members — New Pi Classes Sheohar',
  description: 'Meet our expert Physics, Chemistry, Biology, and Mathematics faculty members guiding JEE and NEET aspirants in Sheohar.',
};

export default async function FacultyPage() {
  const facultyList: FacultyItem[] = await getPublicFaculty();

  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-navy-start via-[#0f1738] to-navy-end text-text-dark-primary">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-mono mb-4">
            <span>🎓 Expert Educators & Mentors</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-4">
            Our Science & Maths Faculty
          </h1>
          <p className="text-text-dark-secondary max-w-2xl mx-auto text-sm sm:text-base">
            Dedicated educators with proven track records of training top rankers in JEE Main, JEE Advanced, and NEET.
          </p>
        </div>

        {/* Empty State */}
        {facultyList.length === 0 ? (
          <div className="glass-panel p-12 text-center max-w-xl mx-auto">
            <div className="text-4xl mb-3">👨‍🏫</div>
            <h3 className="font-display font-bold text-xl mb-2 text-text-dark-primary">
              Faculty Directory Updating
            </h3>
            <p className="text-xs sm:text-sm text-text-dark-secondary leading-relaxed">
              Our faculty member directory is currently being updated by the administration. Please check back shortly or contact our counseling desk.
            </p>
          </div>
        ) : (
          /* Faculty Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {facultyList.map((f) => (
              <div key={f.id} className="glass-panel p-6 flex flex-col justify-between hover:border-gold/50 transition-all duration-300">
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

                {f.specialization && (
                  <div className="pt-4 border-t border-white/10 text-xs text-text-dark-secondary">
                    <span className="text-text-dark-primary font-semibold">Specialization:</span> {f.specialization}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
