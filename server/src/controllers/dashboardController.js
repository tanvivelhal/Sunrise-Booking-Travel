import mongoose from 'mongoose';
import { Booking, TravelRequest, User } from '../models/index.js';
import { toISODate, isSameDay } from '../utils/date.js';

const populate = [
  { path: 'employee', select: 'name designation department salaryBand employeeId' },
  { path: 'manager', select: 'name email' },
  { path: 'request', select: 'requestId travelPurpose purposeNote status managerComment' },
];

const now = () => new Date();

/** GET /api/dashboard/employee — everything computed from stored records */
export const employeeDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const today = now();

    const [requests, bookings] = await Promise.all([
      TravelRequest.find({ employee: userId }).sort({ createdAt: -1 }),
      Booking.find({ employee: userId }).populate(populate).sort({ createdAt: -1 }),
    ]);

    const upcomingTrips = bookings.filter(
      (b) => (b.status === 'Ticketed' || b.status === 'Approved') && new Date(b.departureDate) >= today
    );
    const travelSpend = bookings
      .filter((b) => b.status === 'Ticketed' || b.status === 'Approved')
      .reduce((sum, b) => sum + (b.fare || 0), 0);

    const stats = {
      upcomingTrips: upcomingTrips.length,
      pendingRequests: requests.filter((r) => r.status === 'Pending').length,
      approvedTrips: requests.filter((r) => r.status === 'Approved').length,
      ticketedBookings: bookings.filter((b) => b.status === 'Ticketed').length,
      cancelledTrips: bookings.filter((b) => b.status === 'Cancelled').length,
      travelSpend,
    };

    res.json({ stats, upcomingTrips, recentRequests: requests.slice(0, 5), recentBookings: bookings.slice(0, 5) });
  } catch (err) {
    next(err);
  }
};

/** GET /api/dashboard/manager */
export const managerDashboard = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const today = now();

    const [requests, bookings, employees] = await Promise.all([
      TravelRequest.find({ manager: managerId }).populate('employee', 'name designation department salaryBand').sort({ createdAt: -1 }),
      Booking.find({ manager: managerId }).populate(populate).sort({ createdAt: -1 }),
      User.find({ manager: managerId, role: 'employee', status: 'active' }).select('name designation department salaryBand employeeId'),
    ]);

    const pending = requests.filter((r) => r.status === 'Pending');
    const teamSpending = bookings
      .filter((b) => b.status === 'Ticketed' || b.status === 'Approved')
      .reduce((sum, b) => sum + (b.fare || 0), 0);
    const upcomingTrips = bookings.filter(
      (b) => (b.status === 'Ticketed' || b.status === 'Approved') && new Date(b.departureDate) >= today
    );

    const stats = {
      pendingApprovals: pending.length,
      approvedRequests: requests.filter((r) => r.status === 'Approved').length,
      rejectedRequests: requests.filter((r) => r.status === 'Rejected').length,
      teamTravel: bookings.length,
      teamSpending,
      upcomingTrips: upcomingTrips.length,
      teamSize: employees.length,
    };

    res.json({ stats, pending, requests: requests.slice(0, 8), upcomingTrips: upcomingTrips.slice(0, 6), team: employees });
  } catch (err) {
    next(err);
  }
};

/** GET /api/dashboard/admin — the Project Sunrise Module 5 dashboard */
export const adminDashboard = async (req, res, next) => {
  try {
    const today = now();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [requests, bookings, employees, activeEmployees] = await Promise.all([
      TravelRequest.find().populate('employee', 'name designation department salaryBand').sort({ createdAt: -1 }),
      Booking.find().populate(populate).sort({ createdAt: -1 }),
      User.find({ role: 'employee' }).select('name department salaryBand status'),
      User.countDocuments({ role: 'employee', status: 'active' }),
    ]);

    const todayBookings = bookings.filter((b) => isSameDay(new Date(b.createdAt), today));
    const cancelled = bookings.filter((b) => b.status === 'Cancelled');
    const pendingApprovals = requests.filter((r) => r.status === 'Pending');

    const spendEligible = bookings.filter((b) => b.status === 'Ticketed' || b.status === 'Approved');
    const travelSpend = spendEligible.reduce((sum, b) => sum + (b.fare || 0), 0);

    // Most travelled city from actual booking destinations
    const cityCount = {};
    for (const b of spendEligible) {
      const city = b.destination;
      cityCount[city] = (cityCount[city] || 0) + 1;
    }
    const mostTravelledCity = Object.entries(cityCount).sort((a, b2) => b2[1] - a[1])[0]?.[0] || '—';

    const stats = {
      todayBookings: todayBookings.length,
      pendingApprovals: pendingApprovals.length,
      cancelledBookings: cancelled.length,
      travelSpend,
      mostTravelledCity,
      activeEmployees,
      totalBookings: bookings.length,
      totalRequests: requests.length,
      ticketedBookings: bookings.filter((b) => b.status === 'Ticketed').length,
    };

    res.json({
      stats,
      todayBookings: todayBookings.slice(0, 6),
      pendingApprovals: pendingApprovals.slice(0, 6),
      recentBookings: bookings.slice(0, 6),
      recentRequests: requests.slice(0, 6),
      employees,
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/dashboard/admin/analytics — chart datasets from stored data */
export const adminAnalytics = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      status: { $in: ['Ticketed', 'Approved', 'Cancelled', 'Rejected'] },
    }).populate('employee', 'department salaryBand designation');

    const today = now();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('en-IN', { month: 'short' }), spend: 0, count: 0 });
    }

    const spendByMonth = months.map((m) => ({ label: m.label, spend: 0, count: 0 }));
    const typeCount = { flight: 0, hotel: 0, railway: 0, multi: 0 };
    const statusCount = { Pending: 0, Approved: 0, Rejected: 0, Ticketed: 0, Cancelled: 0 };
    const cityCount = {};
    const deptSpend = {};
    const violationStats = { COMPLIANT: 0, WARNING: 0, VIOLATION: 0 };

    for (const b of bookings) {
      const created = new Date(b.createdAt);
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      const monthIndex = months.findIndex((m) => m.key === key);
      if (monthIndex >= 0) {
        spendByMonth[monthIndex].spend += b.fare || 0;
        spendByMonth[monthIndex].count += 1;
      }
      typeCount[b.travelType] = (typeCount[b.travelType] || 0) + 1;
      statusCount[b.status] = (statusCount[b.status] || 0) + 1;
      cityCount[b.destination] = (cityCount[b.destination] || 0) + 1;
      const dept = b.employee?.department || 'Unassigned';
      deptSpend[dept] = (deptSpend[dept] || 0) + (b.fare || 0);
      violationStats[b.policyResult?.status] = (violationStats[b.policyResult?.status] || 0) + 1;
    }

    const mostTravelledCities = Object.entries(cityCount)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const departmentSpending = Object.entries(deptSpend)
      .map(([department, spend]) => ({ department, spend }))
      .sort((a, b) => b.spend - a.spend);

    res.json({
      spendByMonth,
      bookingsByType: Object.entries(typeCount).map(([type, count]) => ({ type, count })),
      statusDistribution: Object.entries(statusCount).map(([status, count]) => ({ status, count })),
      mostTravelledCities,
      departmentSpending,
      policyViolations: violationStats,
      totalSpend: spendByMonth.reduce((s, m) => s + m.spend, 0),
    });
  } catch (err) {
    next(err);
  }
};
