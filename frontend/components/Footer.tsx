import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-start/90 text-text-dark-secondary text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-navy-start font-bold font-display text-lg">
              π
            </div>
            <span className="font-display font-bold text-lg text-text-dark-primary">
              New Pi Classes
            </span>
          </div>
          <p className="text-xs leading-relaxed text-text-dark-secondary">
            Sheohar's premier coaching institute for Class XI & XII JEE, NEET, and Board Examination excellence. Dedicated faculty, disciplined learning.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-display font-semibold text-text-dark-primary text-base mb-3">
            Quick Links
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/" className="hover:text-gold transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/courses" className="hover:text-gold transition-colors">
                Courses & Batches
              </Link>
            </li>
            <li>
              <Link href="/faculty" className="hover:text-gold transition-colors">
                Faculty Members
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-gold transition-colors">
                About Our Institute
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-gold transition-colors">
                Book a Free Demo Class
              </Link>
            </li>
          </ul>
        </div>

        {/* Courses Offered */}
        <div>
          <h3 className="font-display font-semibold text-text-dark-primary text-base mb-3">
            Target Programs
          </h3>
          <ul className="space-y-2 text-xs">
            <li>Class XI JEE Main & Advanced</li>
            <li>Class XI NEET Medical Prep</li>
            <li>Class XII JEE Target Batch</li>
            <li>Class XII NEET Intensive</li>
            <li>Class XI & XII Board Excellence</li>
          </ul>
        </div>

        {/* Contact Info & WhatsApp */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-text-dark-primary text-base mb-3">
            Contact Us
          </h3>
          <p className="text-xs">
            <strong className="text-text-dark-primary">Address:</strong> Near Main Chowk, Hospital Road, Sheohar, Bihar - 843329
          </p>
          <p className="text-xs">
            <strong className="text-text-dark-primary">Phone:</strong> +91 99342 12345 / +91 98350 67890
          </p>
          
          <div className="pt-2">
            <a
              href="https://wa.me/919934212345?text=Hello%20New%20Pi%20Classes,%20I%20want%20information%20about%20admission"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-emerald/20 border border-emerald/40 text-emerald hover:bg-emerald/30 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.999 1.594-1.121 4.095 4.16-1.091 1.605.973z"/>
              </svg>
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 bg-black/20 py-4 text-center text-xs text-text-dark-secondary">
        © {new Date().getFullYear()} New Pi Classes (NPC). All rights reserved. Designed for JEE & NEET Excellence in Sheohar.
      </div>
    </footer>
  );
}
