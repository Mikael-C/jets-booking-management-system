import fs from "fs";
import path from "path";
import { initialBookings } from "../../../src/data/initialBookings";

// Map each booking to ensure all fields are normalized for MongoDB backend
const bookingsToSeed = initialBookings.map((b) => {
  return {
    ...b,
    _id: b.id,
    tripNumber: b.tripNumber,
    invoiceNumber: b.invoiceNumber || "",
    accountNumber: b.accountNumber || "",
    contractDate: b.contractDate || "",
    quoteExpirationDate: b.quoteExpirationDate || "",
    paymentDueDate: b.paymentDueDate || "",
    status: b.status,
    tripType: b.tripType,
    aircraft: b.aircraft,
    client: b.client,
    operator: b.operator,
    legs: b.legs.map((leg) => ({
      ...leg,
      from: leg.origin?.name || leg.origin?.city || leg.origin?.icao || "Origin",
      fromIcao: leg.origin?.icao || "LSGG",
      to: leg.destination?.name || leg.destination?.city || leg.destination?.icao || "Destination",
      toIcao: leg.destination?.icao || "LIMJ",
      departureDate: leg.flightDate,
      departureTime: leg.departureTimeLocal,
      paxCount: leg.paxCount,
      distanceNm: leg.distanceNm || 150,
      flightTimeMinutes: 60,
    })),
    pricing: {
      ...b.pricing,
      totalAmount: b.pricing.totalFlightPrice,
      grandTotal: b.pricing.totalFlightPrice,
      baseCharterCost: b.pricing.flightPrice,
    },
    services: b.services,
    checklist: b.checklist.map((c) => ({
      ...c,
      completed: c.isCompleted,
    })),
    quoteStatus: b.quoteStatus || "draft",
    paymentStatus: b.paymentStatus || "unpaid",
    isDeleted: false,
    createdAt: b.createdAt || new Date().toISOString(),
    updatedAt: b.updatedAt || new Date().toISOString(),
  };
});

const outputPath = path.resolve(__dirname, "../seed/initialBookingsData.json");
fs.writeFileSync(outputPath, JSON.stringify(bookingsToSeed, null, 2), "utf8");
console.log(`✅ Successfully generated ${bookingsToSeed.length} initial flight bookings in ${outputPath}`);
