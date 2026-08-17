/**
 * Mock Indian railway catalogue with realistic train names, numbers and
 * class-level fares. No live railway system is connected.
 */
export const TRAIN_SEED = [
  {
    trainName: 'Mumbai Rajdhani', trainNumber: '12951', fromStation: 'Mumbai Central', fromCity: 'Mumbai', toStation: 'New Delhi', toCity: 'Delhi',
    depTime: '17:00', arrTime: '08:30', durationMin: 930, trainType: 'Rajdhani',
    classes: [
      { className: '3AC', fare: 2735, availability: 42 },
      { className: '2AC', fare: 3945, availability: 28 },
      { className: '1AC', fare: 6635, availability: 8 },
    ],
  },
  {
    trainName: 'Mumbai Rajdhani', trainNumber: '12952', fromStation: 'New Delhi', fromCity: 'Delhi', toStation: 'Mumbai Central', toCity: 'Mumbai',
    depTime: '16:25', arrTime: '08:15', durationMin: 950, trainType: 'Rajdhani',
    classes: [
      { className: '3AC', fare: 2735, availability: 35 },
      { className: '2AC', fare: 3945, availability: 22 },
      { className: '1AC', fare: 6635, availability: 6 },
    ],
  },
  {
    trainName: 'Mumbai Shatabdi', trainNumber: '12025', fromStation: 'Mumbai Central', fromCity: 'Mumbai', toStation: 'Pune Junction', toCity: 'Pune',
    depTime: '06:25', arrTime: '09:25', durationMin: 180, trainType: 'Shatabdi',
    classes: [
      { className: 'CC', fare: 565, availability: 120 },
      { className: 'Executive Chair Car', fare: 1315, availability: 40 },
    ],
  },
  {
    trainName: 'Deccan Queen', trainNumber: '12123', fromStation: 'Pune Junction', fromCity: 'Pune', toStation: 'Mumbai Central', toCity: 'Mumbai',
    depTime: '17:15', arrTime: '20:35', durationMin: 200, trainType: 'Express',
    classes: [
      { className: 'CC', fare: 545, availability: 110 },
      { className: '2AC', fare: 950, availability: 30 },
    ],
  },
  {
    trainName: 'Udyan Express', trainNumber: '11301', fromStation: 'Mumbai CSMT', fromCity: 'Mumbai', toStation: 'KSR Bengaluru', toCity: 'Bengaluru',
    depTime: '09:40', arrTime: '15:40', durationMin: 3600, trainType: 'Express',
    classes: [
      { className: 'Sleeper', fare: 585, availability: 180 },
      { className: '3AC', fare: 1545, availability: 60 },
      { className: '2AC', fare: 2245, availability: 30 },
    ],
  },
  {
    trainName: 'Devagiri Express', trainNumber: '17057', fromStation: 'Mumbai CSMT', fromCity: 'Mumbai', toStation: 'Secunderabad Junction', toCity: 'Hyderabad',
    depTime: '19:20', arrTime: '06:05', durationMin: 645, trainType: 'Express',
    classes: [
      { className: 'Sleeper', fare: 555, availability: 160 },
      { className: '3AC', fare: 1470, availability: 55 },
      { className: '2AC', fare: 2130, availability: 25 },
    ],
  },
  {
    trainName: 'Chennai Express', trainNumber: '11041', fromStation: 'Mumbai CSMT', fromCity: 'Mumbai', toStation: 'Chennai Central', toCity: 'Chennai',
    depTime: '17:30', arrTime: '17:45', durationMin: 1455, trainType: 'Express',
    classes: [
      { className: 'Sleeper', fare: 610, availability: 150 },
      { className: '3AC', fare: 1620, availability: 50 },
      { className: '2AC', fare: 2350, availability: 24 },
    ],
  },
  {
    trainName: 'Duronto Express', trainNumber: '12213', fromStation: 'Mumbai Central', fromCity: 'Mumbai', toStation: 'Delhi Sarai Rohilla', toCity: 'Delhi',
    depTime: '23:40', arrTime: '10:35', durationMin: 655, trainType: 'Duronto',
    classes: [
      { className: '3AC', fare: 2490, availability: 48 },
      { className: '2AC', fare: 3620, availability: 26 },
      { className: '1AC', fare: 6120, availability: 7 },
    ],
  },
  {
    trainName: 'Rajdhani Express', trainNumber: '12431', fromStation: 'Mumbai Central', fromCity: 'Mumbai', toStation: 'Trivandrum Central', toCity: 'Trivandrum',
    depTime: '11:30', arrTime: '12:15', durationMin: 1365, trainType: 'Rajdhani',
    classes: [
      { className: '3AC', fare: 3225, availability: 30 },
      { className: '2AC', fare: 4590, availability: 15 },
    ],
  },
  {
    trainName: 'Bengaluru Shatabdi', trainNumber: '12027', fromStation: 'KSR Bengaluru', fromCity: 'Bengaluru', toStation: 'Chennai Central', toCity: 'Chennai',
    depTime: '06:00', arrTime: '10:30', durationMin: 270, trainType: 'Shatabdi',
    classes: [
      { className: 'CC', fare: 755, availability: 100 },
      { className: 'Executive Chair Car', fare: 1745, availability: 35 },
    ],
  },
  {
    trainName: 'Pune Shatabdi', trainNumber: '12026', fromStation: 'Pune Junction', fromCity: 'Pune', toStation: 'Mumbai Central', toCity: 'Mumbai',
    depTime: '17:45', arrTime: '20:45', durationMin: 180, trainType: 'Shatabdi',
    classes: [
      { className: 'CC', fare: 565, availability: 115 },
      { className: 'Executive Chair Car', fare: 1315, availability: 38 },
    ],
  },
  {
    trainName: 'Duronto Express', trainNumber: '12263', fromStation: 'Pune Junction', fromCity: 'Pune', toStation: 'Hazrat Nizamuddin', toCity: 'Delhi',
    depTime: '18:45', arrTime: '08:10', durationMin: 805, trainType: 'Duronto',
    classes: [
      { className: '3AC', fare: 1920, availability: 45 },
      { className: '2AC', fare: 2780, availability: 22 },
    ],
  },
  {
    trainName: 'Jan Shatabdi', trainNumber: '12015', fromStation: 'New Delhi', fromCity: 'Delhi', toStation: 'Jaipur Junction', toCity: 'Jaipur',
    depTime: '06:05', arrTime: '10:35', durationMin: 270, trainType: 'Shatabdi',
    classes: [
      { className: 'CC', fare: 645, availability: 95 },
      { className: 'Executive Chair Car', fare: 1495, availability: 30 },
    ],
  },
  {
    trainName: 'Howrah Rajdhani', trainNumber: '12301', fromStation: 'Howrah Junction', fromCity: 'Kolkata', toStation: 'New Delhi', toCity: 'Delhi',
    depTime: '16:50', arrTime: '09:55', durationMin: 1025, trainType: 'Rajdhani',
    classes: [
      { className: '3AC', fare: 2415, availability: 40 },
      { className: '2AC', fare: 3465, availability: 24 },
      { className: '1AC', fare: 5805, availability: 6 },
    ],
  },
  {
    trainName: 'Goa Express', trainNumber: '12779', fromStation: 'Vasco Da Gama', fromCity: 'Goa', toStation: 'KSR Bengaluru', toCity: 'Bengaluru',
    depTime: '17:00', arrTime: '08:40', durationMin: 940, trainType: 'Express',
    classes: [
      { className: 'Sleeper', fare: 480, availability: 140 },
      { className: '3AC', fare: 1260, availability: 50 },
      { className: '2AC', fare: 1820, availability: 22 },
    ],
  },
  {
    trainName: 'Hyderabad Duronto', trainNumber: '12285', fromStation: 'Hazrat Nizamuddin', fromCity: 'Delhi', toStation: 'Secunderabad Junction', toCity: 'Hyderabad',
    depTime: '14:35', arrTime: '07:10', durationMin: 995, trainType: 'Duronto',
    classes: [
      { className: '3AC', fare: 2540, availability: 38 },
      { className: '2AC', fare: 3680, availability: 20 },
    ],
  },
  {
    trainName: 'Karnataka Express', trainNumber: '12627', fromStation: 'New Delhi', fromCity: 'Delhi', toStation: 'KSR Bengaluru', toCity: 'Bengaluru',
    depTime: '20:30', arrTime: '06:10', durationMin: 580, trainType: 'Express',
    classes: [
      { className: 'Sleeper', fare: 745, availability: 170 },
      { className: '3AC', fare: 2015, availability: 55 },
      { className: '2AC', fare: 2935, availability: 28 },
    ],
  },
];
