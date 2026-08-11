'use client';

interface Testimonial {
  _id?: string;
  id?: string;
  studentName: string;
  examTag?: string;
  quote?: string;
  testimonialText?: string;
  resultText?: string;
  examCleared?: string;
  rankAchieved?: string;
  rating?: number;
}

interface Props {
  testimonials: Testimonial[];
}

const MARQUEE_THRESHOLD = 6;

export default function TestimonialsMarquee({ testimonials }: Props) {
  if (!testimonials || testimonials.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 text-center text-text-dark-secondary">
          <p className="text-base">No published student testimonials yet.</p>
        </div>
      </div>
    );
  }

  const renderCard = (t: Testimonial, isStatic: boolean = false) => {
    const text = t.quote || t.testimonialText || '';
    const tag =
      t.examTag ||
      t.resultText ||
      (t.examCleared
        ? `${t.examCleared} ${t.rankAchieved ? '— ' + t.rankAchieved : ''}`
        : '');
    const initial = t.studentName ? t.studentName.charAt(0).toUpperCase() : 'S';

    return (
      <div
        key={t._id || t.id}
        className={`${
          isStatic ? 'w-full' : 'w-[320px] sm:w-[380px] shrink-0'
        } glass-panel p-6 flex flex-col justify-between hover:border-gold/60 transition-all duration-300 hover:shadow-gold-glow`}
      >
        <div>
          <div className="flex items-center space-x-1 text-gold text-xs mb-3">
            {Array.from({ length: t.rating || 5 }).map((_, i) => (
              <span key={i}>★</span>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-text-dark-secondary italic leading-relaxed mb-6 line-clamp-4">
            "{text}"
          </p>
        </div>
        <div className="flex items-center space-x-3.5 border-t border-white/10 pt-4 mt-auto">
          <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center font-bold text-gold text-sm shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <h4 className="font-display font-bold text-xs sm:text-sm text-text-dark-primary truncate">
              {t.studentName}
            </h4>
            {tag && (
              <p className="text-[11px] text-gold font-mono truncate">
                {tag}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // STATE 1: Static Grid Layout (< 6 Published Testimonials)
  // Clean, honest presentation where every testimonial appears exactly once
  if (testimonials.length < MARQUEE_THRESHOLD) {
    const count = testimonials.length;
    let gridCols = 'grid-cols-1 md:grid-cols-3 max-w-6xl';
    if (count === 1) gridCols = 'grid-cols-1 max-w-md';
    else if (count === 2) gridCols = 'grid-cols-1 md:grid-cols-2 max-w-4xl';
    else if (count >= 4) gridCols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl';

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid ${gridCols} gap-6 mx-auto`}>
          {testimonials.map((t) => renderCard(t, true))}
        </div>
      </div>
    );
  }

  // STATE 2: 2-Row Continuous Marquee (>= 6 Published Testimonials)
  // Dynamic scrolling marquee when there is sufficient distinct content
  const halfLength = Math.ceil(testimonials.length / 2);
  const row1Items = testimonials.slice(0, halfLength);
  const row2Items = testimonials.slice(halfLength);

  // Double each row for smooth -50% CSS loop
  const track1 = [...row1Items, ...row1Items];
  const track2 = [...row2Items, ...row2Items];

  return (
    <div className="marquee-container space-y-6 overflow-hidden py-4 select-none">
      {/* Top Row: Continuous Left Scroll */}
      <div className="flex overflow-hidden">
        <div className="flex gap-6 animate-marquee-left w-max">
          {track1.map((t, idx) => (
            <div key={`track1-${t._id || t.id || idx}-${idx}`}>
              {renderCard(t, false)}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row: Continuous Right Scroll */}
      <div className="flex overflow-hidden">
        <div className="flex gap-6 animate-marquee-right w-max">
          {track2.map((t, idx) => (
            <div key={`track2-${t._id || t.id || idx}-${idx}`}>
              {renderCard(t, false)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
