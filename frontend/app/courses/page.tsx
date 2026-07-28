'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCourses, CourseData } from '@/lib/api';
import Link from 'next/link';

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedStream, setSelectedStream] = useState<string>('All');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCourses();
        setCourses(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCourses = courses.filter((c) => {
    const classMatch = selectedClass === 'All' || c.class === selectedClass;
    const streamMatch = selectedStream === 'All' || c.stream === selectedStream;
    return classMatch && streamMatch;
  });

  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-navy-start via-[#0f1738] to-navy-end text-text-dark-primary">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-4">
            JEE, NEET & Board Programs
          </h1>
          <p className="text-text-dark-secondary max-w-2xl mx-auto text-sm sm:text-base">
            Explore our specialized Class XI & XII courses designed for top ranks in competitive examinations.
          </p>
        </div>

        {/* Interactive Filter Bar */}
        <div className="glass-panel p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Class Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-text-dark-secondary font-mono uppercase tracking-wider mr-2">
              Class:
            </span>
            {['All', 'XI', 'XII', 'Target'].map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedClass === cls
                    ? 'bg-gold text-navy-start shadow-gold-glow'
                    : 'bg-white/10 text-text-dark-secondary hover:bg-white/20'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Stream Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs text-text-dark-secondary font-mono uppercase tracking-wider mr-2">
              Stream:
            </span>
            {['All', 'JEE', 'NEET', 'Foundation', 'Board'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStream(st)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedStream === st
                    ? 'bg-gold text-navy-start shadow-gold-glow'
                    : 'bg-white/10 text-text-dark-secondary hover:bg-white/20'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-20 text-text-dark-secondary font-mono">
            Loading live course catalog...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="glass-panel p-12 text-center text-text-dark-secondary">
            <p className="text-lg mb-2">No programs found matching the selected filters.</p>
            <button
              onClick={() => {
                setSelectedClass('All');
                setSelectedStream('All');
              }}
              className="text-xs text-gold underline font-semibold mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div
                key={course._id || course.id}
                className="glass-panel p-6 flex flex-col justify-between hover:border-gold/50 transition-all"
              >
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
                    {course.title}
                  </h3>

                  <p className="text-xs text-text-dark-secondary leading-relaxed mb-6">
                    {course.description}
                  </p>

                  <div className="space-y-2 mb-6 text-xs text-text-dark-secondary border-t border-white/10 pt-4">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-mono text-text-dark-primary font-semibold">
                        {course.durationMonths} Months
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Batch Ratio:</span>
                      <span className="font-mono text-text-dark-primary font-semibold">
                        1:25 Max
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-text-dark-secondary block">Full Course Fee</span>
                    <span className="font-mono font-bold text-xl text-gold">
                      ₹{course.fee.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Link href="/contact" className="btn-gold text-xs py-2 px-5">
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
