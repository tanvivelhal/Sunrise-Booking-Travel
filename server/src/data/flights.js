/**
 * Mock flight catalogue (routes x classes). The search service turns these
 * records into per-date results with deterministic availability/fares.
 * No live airline APIs are used.
 */
export const FLIGHT_SEED = [
  // Mumbai -> Delhi
  { airline: 'IndiGo', flightNumber: '6E-501', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'DEL', toCity: 'Delhi', depTime: '06:10', arrTime: '08:20', durationMin: 130, stops: 0, travelClass: 'Economy', fare: 4850, baggage: '15 kg check-in', refundable: false, seatsTotal: 180 },
  { airline: 'Vistara', flightNumber: 'UK-945', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'DEL', toCity: 'Delhi', depTime: '09:15', arrTime: '11:25', durationMin: 130, stops: 0, travelClass: 'Economy', fare: 7850, baggage: '25 kg check-in', refundable: true, seatsTotal: 150 },
  { airline: 'Vistara', flightNumber: 'UK-945', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'DEL', toCity: 'Delhi', depTime: '09:15', arrTime: '11:25', durationMin: 130, stops: 0, travelClass: 'Premium Economy', fare: 12400, baggage: '25 kg check-in', refundable: true, seatsTotal: 42 },
  { airline: 'Air India', flightNumber: 'AI-101', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'DEL', toCity: 'Delhi', depTime: '16:40', arrTime: '18:55', durationMin: 135, stops: 0, travelClass: 'Business', fare: 28900, baggage: '2 x 23 kg check-in', refundable: true, seatsTotal: 24 },
  { airline: 'Air India', flightNumber: 'AI-101', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'DEL', toCity: 'Delhi', depTime: '16:40', arrTime: '18:55', durationMin: 135, stops: 0, travelClass: 'Economy', fare: 9850, baggage: '15 kg check-in', refundable: true, seatsTotal: 120 },
  { airline: 'SpiceJet', flightNumber: 'SG-8192', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'DEL', toCity: 'Delhi', depTime: '21:30', arrTime: '23:45', durationMin: 135, stops: 0, travelClass: 'Economy', fare: 5950, baggage: '15 kg check-in', refundable: false, seatsTotal: 189 },
  // Delhi -> Mumbai
  { airline: 'IndiGo', flightNumber: '6E-502', fromCode: 'DEL', fromCity: 'Delhi', toCode: 'BOM', toCity: 'Mumbai', depTime: '07:05', arrTime: '09:15', durationMin: 130, stops: 0, travelClass: 'Economy', fare: 5050, baggage: '15 kg check-in', refundable: false, seatsTotal: 180 },
  { airline: 'Vistara', flightNumber: 'UK-946', fromCode: 'DEL', fromCity: 'Delhi', toCode: 'BOM', toCity: 'Mumbai', depTime: '11:30', arrTime: '13:40', durationMin: 130, stops: 0, travelClass: 'Economy', fare: 8150, baggage: '25 kg check-in', refundable: true, seatsTotal: 150 },
  { airline: 'Air India', flightNumber: 'AI-102', fromCode: 'DEL', fromCity: 'Delhi', toCode: 'BOM', toCity: 'Mumbai', depTime: '18:20', arrTime: '20:30', durationMin: 130, stops: 0, travelClass: 'Business', fare: 31200, baggage: '2 x 23 kg check-in', refundable: true, seatsTotal: 24 },
  // Mumbai -> Bengaluru
  { airline: 'IndiGo', flightNumber: '6E-531', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'BLR', toCity: 'Bengaluru', depTime: '08:00', arrTime: '10:05', durationMin: 125, stops: 0, travelClass: 'Economy', fare: 4650, baggage: '15 kg check-in', refundable: false, seatsTotal: 180 },
  { airline: 'Air India', flightNumber: 'AI-601', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'BLR', toCity: 'Bengaluru', depTime: '14:25', arrTime: '16:30', durationMin: 125, stops: 0, travelClass: 'Economy', fare: 7350, baggage: '15 kg check-in', refundable: true, seatsTotal: 120 },
  { airline: 'Air India', flightNumber: 'AI-601', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'BLR', toCity: 'Bengaluru', depTime: '14:25', arrTime: '16:30', durationMin: 125, stops: 0, travelClass: 'Premium Economy', fare: 11800, baggage: '25 kg check-in', refundable: true, seatsTotal: 42 },
  // Mumbai -> Hyderabad
  { airline: 'IndiGo', flightNumber: '6E-547', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'HYD', toCity: 'Hyderabad', depTime: '10:15', arrTime: '11:45', durationMin: 90, stops: 0, travelClass: 'Economy', fare: 4290, baggage: '15 kg check-in', refundable: false, seatsTotal: 180 },
  { airline: 'Vistara', flightNumber: 'UK-873', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'HYD', toCity: 'Hyderabad', depTime: '19:05', arrTime: '20:35', durationMin: 90, stops: 0, travelClass: 'Economy', fare: 6890, baggage: '25 kg check-in', refundable: true, seatsTotal: 150 },
  // Mumbai -> Pune
  { airline: 'Star Air', flightNumber: 'S5-701', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'PNQ', toCity: 'Pune', depTime: '09:30', arrTime: '10:10', durationMin: 40, stops: 0, travelClass: 'Economy', fare: 3450, baggage: '15 kg check-in', refundable: false, seatsTotal: 72 },
  // Delhi -> Bengaluru
  { airline: 'IndiGo', flightNumber: '6E-205', fromCode: 'DEL', fromCity: 'Delhi', toCode: 'BLR', toCity: 'Bengaluru', depTime: '06:40', arrTime: '09:25', durationMin: 165, stops: 0, travelClass: 'Economy', fare: 6750, baggage: '15 kg check-in', refundable: false, seatsTotal: 180 },
  { airline: 'Air India', flightNumber: 'AI-503', fromCode: 'DEL', fromCity: 'Delhi', toCode: 'BLR', toCity: 'Bengaluru', depTime: '15:50', arrTime: '18:35', durationMin: 165, stops: 0, travelClass: 'Business', fare: 24800, baggage: '2 x 23 kg check-in', refundable: true, seatsTotal: 24 },
  // Delhi -> Hyderabad
  { airline: 'IndiGo', flightNumber: '6E-215', fromCode: 'DEL', fromCity: 'Delhi', toCode: 'HYD', toCity: 'Hyderabad', depTime: '08:30', arrTime: '10:40', durationMin: 130, stops: 0, travelClass: 'Economy', fare: 6140, baggage: '15 kg check-in', refundable: false, seatsTotal: 180 },
  // Delhi -> Jaipur
  { airline: 'IndiGo', flightNumber: '6E-225', fromCode: 'DEL', fromCity: 'Delhi', toCode: 'JAI', toCity: 'Jaipur', depTime: '12:20', arrTime: '13:15', durationMin: 55, stops: 0, travelClass: 'Economy', fare: 3650, baggage: '15 kg check-in', refundable: false, seatsTotal: 180 },
  // Bengaluru -> Hyderabad
  { airline: 'IndiGo', flightNumber: '6E-625', fromCode: 'BLR', fromCity: 'Bengaluru', toCode: 'HYD', toCity: 'Hyderabad', depTime: '11:00', arrTime: '12:05', durationMin: 65, stops: 0, travelClass: 'Economy', fare: 3990, baggage: '15 kg check-in', refundable: false, seatsTotal: 180 },
  // Mumbai -> Chennai
  { airline: 'IndiGo', flightNumber: '6E-611', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'MAA', toCity: 'Chennai', depTime: '13:10', arrTime: '15:05', durationMin: 115, stops: 0, travelClass: 'Economy', fare: 4720, baggage: '15 kg check-in', refundable: false, seatsTotal: 180 },
  { airline: 'Air India', flightNumber: 'AI-571', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'MAA', toCity: 'Chennai', depTime: '17:45', arrTime: '19:40', durationMin: 115, stops: 0, travelClass: 'Economy', fare: 8250, baggage: '15 kg check-in', refundable: true, seatsTotal: 120 },
  // Delhi -> Kolkata
  { airline: 'IndiGo', flightNumber: '6E-245', fromCode: 'DEL', fromCity: 'Delhi', toCode: 'CCU', toCity: 'Kolkata', depTime: '07:50', arrTime: '10:00', durationMin: 130, stops: 0, travelClass: 'Economy', fare: 5840, baggage: '15 kg check-in', refundable: false, seatsTotal: 180 },
  { airline: 'Air India', flightNumber: 'AI-401', fromCode: 'DEL', fromCity: 'Delhi', toCode: 'CCU', toCity: 'Kolkata', depTime: '16:10', arrTime: '18:20', durationMin: 130, stops: 0, travelClass: 'Business', fare: 22100, baggage: '2 x 23 kg check-in', refundable: true, seatsTotal: 24 },
  // Mumbai -> Kolkata
  { airline: 'IndiGo', flightNumber: '6E-181', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'CCU', toCity: 'Kolkata', depTime: '09:40', arrTime: '12:05', durationMin: 145, stops: 0, travelClass: 'Economy', fare: 6350, baggage: '15 kg check-in', refundable: false, seatsTotal: 180 },
  // Goa
  { airline: 'IndiGo', flightNumber: '6E-671', fromCode: 'BOM', fromCity: 'Mumbai', toCode: 'GOI', toCity: 'Goa', depTime: '15:20', arrTime: '16:30', durationMin: 70, stops: 0, travelClass: 'Economy', fare: 4520, baggage: '15 kg check-in', refundable: false, seatsTotal: 180 },
];
