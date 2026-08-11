'use client';

export default function LocationMap() {
  const address = "Near Main Chowk, Hospital Road, Sheohar, Bihar - 843329";
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    address
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-4 border-gold/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-gold text-xl">🗺️</span>
          <h3 className="font-display font-bold text-lg text-text-dark-primary">
            Visit Our Classroom Center
          </h3>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-gold hover:underline inline-flex items-center gap-1 w-fit"
        >
          <span>Open in Google Maps</span>
          <span>↗</span>
        </a>
      </div>

      <p className="text-xs sm:text-sm text-text-dark-secondary font-medium flex items-center gap-1.5">
        <span className="text-gold">📍</span>
        <span>{address}</span>
      </p>

      <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-white/15 shadow-xl relative bg-navy-start/60">
        <iframe
          title="New Pi Classes Sheohar Location Map"
          width="100%"
          height="100%"
          src={embedUrl}
          loading="lazy"
          allowFullScreen
          className="w-full h-full border-0 contrast-[105%]"
        ></iframe>
      </div>
    </div>
  );
}
