import {
  searchFlights,
  searchHotels,
  searchTrains,
  getAirportList,
  getStationList,
  getHotelCityList,
} from '../services/travelSearchService.js';
import { validateForUser } from '../services/policyService.js';

/** GET /api/flights */
export const flights = async (req, res, next) => {
  try {
    const results = await searchFlights({
      from: req.query.from,
      to: req.query.to,
      departureDate: req.query.departureDate,
      tripType: req.query.tripType,
      passengers: req.query.passengers,
      travelClass: req.query.travelClass,
    });
    res.json({ count: results.length, results });
  } catch (err) {
    next(err);
  }
};

/** GET /api/hotels */
export const hotels = async (req, res, next) => {
  try {
    const results = await searchHotels({
      city: req.query.city,
      checkIn: req.query.checkIn,
      checkOut: req.query.checkOut,
      guests: req.query.guests,
      rooms: req.query.rooms,
      starRating: req.query.starRating,
    });
    res.json({ count: results.length, results });
  } catch (err) {
    next(err);
  }
};

/** GET /api/trains */
export const trains = async (req, res, next) => {
  try {
    const results = await searchTrains({
      from: req.query.from,
      to: req.query.to,
      date: req.query.date,
      passengers: req.query.passengers,
      trainClass: req.query.trainClass,
    });
    res.json({ count: results.length, results });
  } catch (err) {
    next(err);
  }
};

/** GET /api/lookup/airports */
export const airports = async (req, res, next) => {
  try {
    res.json({ results: await getAirportList() });
  } catch (err) {
    next(err);
  }
};

/** GET /api/lookup/stations */
export const stations = async (req, res, next) => {
  try {
    res.json({ results: await getStationList() });
  } catch (err) {
    next(err);
  }
};

/** GET /api/lookup/cities */
export const hotelCities = async (req, res, next) => {
  try {
    res.json({ results: await getHotelCityList() });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/policy/validate
 * Real policy engine: evaluates the authenticated user's selections against
 * their salary band entitlement.
 */
export const validatePolicy = async (req, res, next) => {
  try {
    const { selections } = req.body;
    if (!selections) {
      return res.status(400).json({ message: 'Selections are required for policy validation.' });
    }
    const result = await validateForUser(req.user, selections);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
