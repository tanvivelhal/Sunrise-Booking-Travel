/**
 * FeatureArt — real photography for the landing Travel/Features cards.
 * Purely decorative. Each variant renders a high-quality photograph stored
 * locally under /images/features so the cards never depend on remote URLs.
 *
 * Travel services (flight / hotel / rail) use real travel photography;
 * management features (policy / approvals / analytics) use real corporate
 * photography. Images are cropped with object-cover to fill the card header.
 */

const IMAGES = {
  flight: '/images/features/flight.jpg', // commercial airplane on the runway at dusk
  hotel: '/images/features/hotel.jpg', // modern corporate hotel room
  rail: '/images/features/rail.jpg', // Vande Bharat Express — modern Indian express train
  policy: '/images/features/policy.jpg', // professional reviewing documents on a laptop
  approvals: '/images/features/approvals.jpg', // manager and employee reviewing a request
  analytics: '/images/features/analytics.jpg', // laptop showing business analytics charts
};

export default function FeatureArt({ variant = 'flight', className = '' }) {
  const src = IMAGES[variant] || IMAGES.flight;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`${className} object-cover object-center`}
    />
  );
}
