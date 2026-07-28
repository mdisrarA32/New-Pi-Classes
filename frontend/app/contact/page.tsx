'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { submitEnquiry } from '@/lib/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    classInterested: 'XI' as 'XI' | 'XII' | 'Target',
    streamInterested: 'JEE' as 'JEE' | 'NEET' | 'Foundation',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    // Client-side phone validation
    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setStatusMsg({
        type: 'error',
        text: 'Please enter a valid 10-digit mobile number.',
      });
      return;
    }

    if (!formData.name.trim()) {
      setStatusMsg({
        type: 'error',
        text: 'Please enter your full name.',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await submitEnquiry({
        name: formData.name.trim(),
        phone: cleanPhone,
        classInterested: formData.classInterested,
        streamInterested: formData.streamInterested,
        message: formData.message.trim(),
      });

      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: res.message || 'Your enquiry has been received! Our Sheohar counseling team will call you shortly.',
        });
        setFormData({
          name: '',
          phone: '',
          classInterested: 'XI',
          streamInterested: 'JEE',
          message: '',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to submit demo request. Please try again.',
        });
      }
    } catch (e) {
      setStatusMsg({
        type: 'error',
        text: 'Network error. Please verify your connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-navy-start via-[#0f1738] to-navy-end text-text-dark-primary">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Info & Contact Details */}
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-mono mb-4">
              <span>📍 Sheohar Classroom Center</span>
            </div>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-4">
              Book a Free Demo Class
            </h1>
            <p className="text-text-dark-secondary text-sm sm:text-base leading-relaxed mb-8">
              Fill out the form to register for 3 free trial classes. Experience our interactive teaching methodology, personalized doubt solving, and structured study material.
            </p>

            <div className="glass-panel p-6 space-y-4 text-xs sm:text-sm">
              <div className="flex items-start space-x-3">
                <span className="text-gold text-lg font-bold">🏢</span>
                <div>
                  <h4 className="font-display font-bold text-text-dark-primary">
                    Classroom Center Address
                  </h4>
                  <p className="text-text-dark-secondary">
                    Near Main Chowk, Hospital Road, Sheohar, Bihar - 843329
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 border-t border-white/10 pt-4">
                <span className="text-gold text-lg font-bold">📞</span>
                <div>
                  <h4 className="font-display font-bold text-text-dark-primary">
                    Helpline Numbers
                  </h4>
                  <p className="text-text-dark-secondary font-mono">
                    +91 99342 12345 / +91 98350 67890
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 border-t border-white/10 pt-4">
                <span className="text-emerald text-lg font-bold">💬</span>
                <div>
                  <h4 className="font-display font-bold text-text-dark-primary">
                    Instant WhatsApp Assistance
                  </h4>
                  <a
                    href="https://wa.me/919934212345?text=Hello%20NPC,%20I%20want%20to%20book%20a%20demo%20class"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald font-semibold hover:underline block mt-0.5"
                  >
                    Click here to chat directly on WhatsApp →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Demo Request Form */}
          <div className="glass-panel p-6 sm:p-8">
            <h2 className="font-display font-bold text-2xl mb-6 text-text-dark-primary border-b border-white/10 pb-3">
              Student Demo Registration
            </h2>

            {statusMsg && (
              <div
                className={`p-4 rounded-lg mb-6 text-xs font-semibold ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald/20 border border-emerald/50 text-emerald'
                    : 'bg-rose/20 border border-rose/50 text-rose'
                }`}
              >
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-mono text-text-dark-secondary mb-1.5">
                  Student / Parent Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-text-dark-primary text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-text-dark-secondary/50"
                />
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block text-xs font-mono text-text-dark-secondary mb-1.5">
                  10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9934212345"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-text-dark-primary text-sm font-mono focus:outline-none focus:border-gold transition-colors placeholder:text-text-dark-secondary/50"
                />
              </div>

              {/* Class & Stream Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-text-dark-secondary mb-1.5">
                    Class Interested *
                  </label>
                  <select
                    value={formData.classInterested}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        classInterested: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-navy-start border border-white/20 text-text-dark-primary text-sm focus:outline-none focus:border-gold"
                  >
                    <option value="XI">Class XI</option>
                    <option value="XII">Class XII</option>
                    <option value="Target">Target (12th Passed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-text-dark-secondary mb-1.5">
                    Stream / Exam *
                  </label>
                  <select
                    value={formData.streamInterested}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        streamInterested: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-navy-start border border-white/20 text-text-dark-primary text-sm focus:outline-none focus:border-gold"
                  >
                    <option value="JEE">JEE Main & Advanced</option>
                    <option value="NEET">NEET Medical</option>
                    <option value="Foundation">Foundation (Science & Math)</option>
                  </select>
                </div>
              </div>

              {/* Message (Optional) */}
              <div>
                <label className="block text-xs font-mono text-text-dark-secondary mb-1.5">
                  Message / Specific Questions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Ask about batch timings, fee installments, hostel guidance..."
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-text-dark-primary text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-text-dark-secondary/50 resize-none"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full text-sm py-3 font-semibold shadow-gold-glow disabled:opacity-50"
              >
                {loading ? 'Submitting Enquiry...' : 'Submit Demo Request'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
