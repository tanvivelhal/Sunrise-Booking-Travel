/**
 * Corporate travel policy entitlements keyed by salary band.
 * Matches the Project Sunrise business requirement (Module 3).
 */
export const POLICY_SEED = [
  {
    salaryBand: 'A',
    bandLabel: 'Band A – Junior Staff',
    flightClasses: ['Economy'],
    hotelStarMax: 2,
    railClasses: ['Sleeper', '3AC'],
    maxFlightFare: 8000,
    maxHotelPerNight: 3000,
    maxRailFare: 2500,
    description:
      'Junior staff travel Economy class, stay in up to 2-star hotels and travel Sleeper / 3AC on rail.',
  },
  {
    salaryBand: 'B',
    bandLabel: 'Band B – Executive',
    flightClasses: ['Economy'],
    hotelStarMax: 3,
    railClasses: ['3AC', '2AC'],
    maxFlightFare: 12000,
    maxHotelPerNight: 5000,
    maxRailFare: 4500,
    description:
      'Executives travel Economy class, stay in up to 3-star hotels and travel 3AC / 2AC on rail.',
  },
  {
    salaryBand: 'C',
    bandLabel: 'Band C – Senior Staff',
    flightClasses: ['Economy', 'Premium Economy'],
    hotelStarMax: 4,
    railClasses: ['2AC', 'Executive Chair Car'],
    maxFlightFare: 20000,
    maxHotelPerNight: 8000,
    maxRailFare: 9000,
    description:
      'Senior staff may choose Economy or Premium Economy, stay in up to 4-star hotels and travel 2AC / Executive Chair Car on rail.',
  },
  {
    salaryBand: 'D',
    bandLabel: 'Band D – Leadership',
    flightClasses: ['Business'],
    hotelStarMax: 5,
    railClasses: ['1AC', 'Executive'],
    maxFlightFare: 35000,
    maxHotelPerNight: 15000,
    maxRailFare: 15000,
    description:
      'Leadership travels Business class, stays in up to 5-star hotels and travels 1AC / Executive on rail.',
  },
];
