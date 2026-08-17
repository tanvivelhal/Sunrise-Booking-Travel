import { Flight, Hotel, Train } from '../models/index.js';
import { toISODate, nightsBetween } from '../utils/date.js';

/**
 * Mock travel search services.
 *
 * These are provider abstractions: swap the internals for a live airline /
 * hotel / railway API later without touching controllers or the frontend.
 */

/** Deterministic pseudo-random seat availability per flight+date. */
function availabilityFor(seedStr, max) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  return 30 + (h % Math.max(1, max - 30));
}

export async function searchFlights({ from, to, departureDate, tripType = 'one-way', passengers = 1, travelClass }) {
  const query = {};
  if (from) query.$or = [{ fromCode: new RegExp(from, 'i') }, { fromCity: new RegExp(from, 'i') }];
  if (to) query.$or = [{ toCode: new RegExp(to, 'i') }, { toCity: new RegExp(to, 'i') }];
  if (from && to) {
    query.$and = [
      { $or: [{ fromCode: new RegExp(from, 'i') }, { fromCity: new RegExp(from, 'i') }] },
      { $or: [{ toCode: new RegExp(to, 'i') }, { toCity: new RegExp(to, 'i') }] },
    ];
    delete query.$or;
  }
  if (travelClass && travelClass !== 'Any') query.travelClass = travelClass;

  const records = await Flight.find(query).lean();
  const date = departureDate ? toISODate(new Date(departureDate)) : toISODate(new Date());

  const results = records.map((f) => ({
    id: f._id,
    airline: f.airline,
    flightNumber: f.flightNumber,
    from: { code: f.fromCode, city: f.fromCity },
    to: { code: f.toCode, city: f.toCity },
    departureDate: date,
    depTime: f.depTime,
    arrTime: f.arrTime,
    durationMin: f.durationMin,
    stops: f.stops,
    travelClass: f.travelClass,
    fare: f.fare,
    baggage: f.baggage,
    refundable: f.refundable,
    seatsAvailable: availabilityFor(`${f.flightNumber}-${date}`, f.seatsTotal),
  }));

  return results.sort((a, b) => a.fare - b.fare);
}

export async function searchHotels({ city, checkIn, checkOut, guests = 1, rooms = 1, starRating }) {
  const query = {};
  if (city) query.city = new RegExp(city, 'i');
  if (starRating) query.starRating = Number(starRating);
  const records = await Hotel.find(query).lean();
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 1;
  const totalGuests = Number(guests) || 1;

  const results = records.map((h) => ({
    id: h._id,
    name: h.name,
    city: h.city,
    area: h.area,
    starRating: h.starRating,
    roomType: h.roomType,
    pricePerNight: h.pricePerNight,
    totalPrice: h.pricePerNight * nights * (Number(rooms) || 1),
    nights,
    breakfastIncluded: h.breakfastIncluded,
    amenities: h.amenities,
    cancellationPolicy: h.cancellationPolicy,
    roomsAvailable: h.roomsAvailable,
    guests: totalGuests,
  }));

  return results.sort((a, b) => a.pricePerNight - b.pricePerNight);
}

export async function searchTrains({ from, to, date, passengers = 1, trainClass }) {
  const query = {};
  if (from) query.$or = [{ fromStation: new RegExp(from, 'i') }, { fromCity: new RegExp(from, 'i') }];
  if (to) query.$or = [{ toStation: new RegExp(to, 'i') }, { toCity: new RegExp(to, 'i') }];
  if (from && to) {
    query.$and = [
      { $or: [{ fromStation: new RegExp(from, 'i') }, { fromCity: new RegExp(from, 'i') }] },
      { $or: [{ toStation: new RegExp(to, 'i') }, { toCity: new RegExp(to, 'i') }] },
    ];
    delete query.$or;
  }

  const records = await Train.find(query).lean();
  const journeyDate = date ? toISODate(new Date(date)) : toISODate(new Date());

  const results = [];
  for (const t of records) {
    const classes = t.classes
      .filter((c) => !trainClass || trainClass === 'Any' || c.className === trainClass)
      .map((c) => ({
        className: c.className,
        fare: c.fare,
        availability: availabilityFor(`${t.trainNumber}-${c.className}-${journeyDate}`, c.availability + 60),
      }));
    if (classes.length === 0) continue;
    results.push({
      id: t._id,
      trainName: t.trainName,
      trainNumber: t.trainNumber,
      from: { station: t.fromStation, city: t.fromCity },
      to: { station: t.toStation, city: t.toCity },
      journeyDate,
      depTime: t.depTime,
      arrTime: t.arrTime,
      durationMin: t.durationMin,
      trainType: t.trainType,
      classes,
    });
  }
  return results;
}

/** Lookup endpoints used by search forms (From / To selectors). */
export async function getAirportList() {
  const rows = await Flight.find().select('fromCode fromCity -_id').lean();
  const map = new Map();
  for (const r of rows) map.set(r.fromCode, { code: r.fromCode, city: r.fromCity });
  return [...map.values()].sort((a, b) => a.city.localeCompare(b.city));
}

export async function getStationList() {
  const rows = await Train.find().select('fromStation fromCity -_id').lean();
  const map = new Map();
  for (const r of rows) map.set(r.fromStation, { station: r.fromStation, city: r.fromCity });
  return [...map.values()].sort((a, b) => a.city.localeCompare(b.city));
}

export async function getHotelCityList() {
  const rows = await Hotel.distinct('city');
  return rows.sort();
}
