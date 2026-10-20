import { PricingBreakdown, AdditionalServices, Aircraft, FlightLeg } from "@/types/aviation";

export function calculateDistanceNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Radius of the Earth in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function estimateFlightTimeMinutes(distanceNm: number, cruiseSpeedKtas: number = 400): number {
  // Add 25 minutes for taxi, climb, descent and pattern
  const flightHours = distanceNm / cruiseSpeedKtas;
  return Math.round(flightHours * 60 + 25);
}

export function formatFlightTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
}

export function calculatePricing(
  aircraft: Aircraft,
  legs: FlightLeg[],
  services: AdditionalServices,
  currency: "EUR" | "USD" | "GBP" | "CHF" = "EUR"
): PricingBreakdown {
  const totalLegs = Math.max(legs.length, 1);
  let totalFlightMinutes = 0;
  let totalPaxCount = 0;

  legs.forEach((leg) => {
    totalPaxCount += leg.paxCount || 2;
    const distance = leg.distanceNm || 200;
    totalFlightMinutes += estimateFlightTimeMinutes(distance);
  });

  const totalFlightHours = Math.max(totalFlightMinutes / 60, 1.2 * totalLegs);
  
  // Base flight charter rate
  const flightPrice = Math.round(totalFlightHours * aircraft.pricePerHour);

  // Airport landing, handling & navigation fees (~€450 - €600 per leg)
  const airportFees = totalLegs * 570;

  // Passenger APD / terminal charges (~€40 per pax)
  const passengerFees = totalPaxCount * 40;

  // Day of week discount / adjustment (demo calculation: -€250 for multi-leg)
  const dayOfWeekDiscount = totalLegs > 1 ? -250 : 0;

  // Passenger taxes (Inbound / Outbound)
  const inboundPassengerTax = totalPaxCount * 50;
  const outboundPassengerTax = totalPaxCount * 50;

  // Additional Services
  let additionalServicesTotal = 0;
  if (services.deicingInsurance === "at_reservation") {
    additionalServicesTotal += 400 * totalLegs;
  } else if (services.deicingInsurance === "within_48h") {
    additionalServicesTotal += 800 * totalLegs;
  }

  if (services.carbonOffset === "neutral") {
    additionalServicesTotal += Math.round(33 * totalFlightHours);
  } else if (services.carbonOffset === "positive") {
    additionalServicesTotal += Math.round(50 * totalFlightHours);
  } else if (services.carbonOffset === "double_neutral") {
    additionalServicesTotal += Math.round(66 * totalFlightHours);
  }

  if (services.limousineService) {
    additionalServicesTotal += 450 * totalLegs;
  }
  if (services.helicopterService) {
    additionalServicesTotal += 1800;
  }
  if (services.cancellationInsurance) {
    additionalServicesTotal += 1000 * totalLegs;
  }

  const subtotal =
    flightPrice +
    airportFees +
    passengerFees +
    dayOfWeekDiscount +
    inboundPassengerTax +
    outboundPassengerTax +
    additionalServicesTotal;

  // International cross-border business aviation is standard 0% VAT exempt (§6, Abs. 1, Zif. 3 Austrian VAT Act)
  const vatRate = 0;
  const vatAmount = Math.round((subtotal * vatRate) / 100);
  const totalFlightPrice = subtotal + vatAmount;

  return {
    flightPrice,
    airportFees,
    passengerFees,
    dayOfWeekDiscount,
    inboundPassengerTax,
    outboundPassengerTax,
    additionalServicesTotal,
    subtotal,
    vatRate,
    vatAmount,
    totalFlightPrice,
    currency
  };
}

export function formatCurrency(amount: number, currency: "EUR" | "USD" | "GBP" | "CHF" = "EUR"): string {
  const symbolMap = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    CHF: "CHF "
  };
  const sym = symbolMap[currency] || "€ ";
  const parts = Math.abs(amount).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (amount < 0) {
    return `-${sym} ${parts}`;
  }
  return `${sym} ${parts}`;
}
