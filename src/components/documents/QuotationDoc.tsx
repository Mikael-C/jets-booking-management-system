"use client";

import React from "react";
import { Booking } from "@/types/aviation";
import { useAviation } from "@/lib/aviationContext";
import { initialSettings } from "@/data/initialSettings";
import DocumentHeader from "./DocumentHeader";
import DocumentFooter from "./DocumentFooter";

interface QuotationDocProps {
  booking: Booking;
}

export function formatDocCurrency(amount: number, currency: string = "EUR"): string {
  const symbolMap: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    CHF: "CHF"
  };
  const sym = symbolMap[currency] || "€";
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (amount < 0) {
    return `− ${sym} ${formatted}`;
  }
  return `${sym} ${formatted}`;
}

export default function QuotationDoc({ booking }: QuotationDocProps) {
  const { settings } = useAviation();
  const company = settings?.company || initialSettings.company;

  const {
    client,
    aircraft,
    legs,
    pricing,
    tripNumber,
    quoteReference,
    accountNumber,
    contractDate,
    quoteExpirationDate
  } = booking;

  const quoteId = quoteReference || (tripNumber ? `Q-${tripNumber}` : "Q-MX5521-001");
  const currency = pricing?.currency || "EUR";
  const totalPrice = pricing?.totalFlightPrice ?? 58844;
  const cardPrice = booking.totalWithCardFee ?? (totalPrice * 1.035);

  // Dynamic Service Items from booking
  const itemizedServices = React.useMemo(() => {
    if (booking.manualServices && booking.manualServices.length > 0) {
      return booking.manualServices.map((ms) => ({
        name: ms.name,
        details: ms.details || ms.description || "",
        price: Number(ms.price ?? 0)
      }));
    }

    const items: Array<{ name: string; details: string; price: number }> = [];
    if (booking.services?.limousineService) {
      items.push({
        name: "VIP limousine",
        details: "arrival transfer",
        price: 300
      });
    }
    if (booking.services?.vipCateringDetails || booking.services?.vipCateringDetails !== undefined) {
      items.push({
        name: "Catering",
        details: booking.services?.vipCateringDetails || "VIP menu 1 · both legs",
        price: 0
      });
    }
    if (booking.services?.helicopterService) {
      items.push({
        name: "Helicopter transfer",
        details: "VIP charter connector",
        price: 850
      });
    }
    if (booking.services?.deicingInsurance && booking.services.deicingInsurance !== "none") {
      items.push({
        name: "De-icing protection",
        details: "holdover protection package",
        price: booking.services.deicingCostPerLeg || 450
      });
    }
    if (booking.services?.carbonOffset && booking.services.carbonOffset !== "none") {
      items.push({
        name: "Carbon offset",
        details: "Gold Standard certified climate credit",
        price: booking.services.carbonOffsetRatePerHour || 65
      });
    }
    return items;
  }, [booking.manualServices, booking.services]);

  const servicesTotal = itemizedServices.reduce((sum, item) => sum + item.price, 0);
  const baseCharterPrice = pricing?.flightPrice ?? Math.max(0, totalPrice - servicesTotal);

  // Exterior & Interior photos
  const exteriorPhoto = booking.aircraftCustomImages?.exterior || aircraft?.imageExterior;
  const cabinPhoto = booking.aircraftCustomImages?.interior || aircraft?.imageInterior;

  // Representative fallback
  const repName = booking.agentName || "Camille Laurent";
  const repEmail = booking.agentEmail || "c.laurent@monacojets.mc";
  const repPhone = "+377 98 06 20 00";

  return (
    <div className="quotation-document text-slate-900 bg-transparent font-sans max-w-[820px] mx-auto select-none print:max-w-none">
      {/* ================= PAGE 1: CHARTER QUOTATION ================= */}
      <div className="doc-page min-h-[1123px] bg-white p-10 sm:p-12 rounded-sm shadow-xl border border-slate-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between box-border">
        <div className="space-y-5">
          {/* Top Brand Header */}
          <DocumentHeader booking={booking} />

          {/* Title & Document Meta */}
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Charter quotation
            </h1>
            <div className="text-right text-xs space-y-1">
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">QUOTE</span>
                <span className="font-semibold text-slate-900 font-mono w-28 text-right">{quoteId}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">DATE</span>
                <span className="font-medium text-slate-900 w-28 text-right">{contractDate || "14 Nov 2026"}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">VALID UNTIL</span>
                <span className="font-medium text-slate-900 w-36 text-right whitespace-nowrap">{quoteExpirationDate || "16 Nov 2026, 18:00 LT"}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">CURRENCY</span>
                <span className="font-semibold text-slate-900 font-mono w-28 text-right">{currency}</span>
              </div>
            </div>
          </div>

          {/* Prepared For & Representative */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-1">
            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                PREPARED FOR
              </p>
              <p className="font-bold text-slate-900 text-sm">{client?.companyName || client?.fullName || "Adeyemi Holdings Ltd"}</p>
              <p className="text-slate-800">
                Authorised Owner: <span className="font-semibold text-slate-900">{client?.fullName || "Edward Brinkmann"}</span>
              </p>
              {(client?.isHandledByPa || booking.isHandledByPa) && (client?.paName || booking.paName) && (
                <div className="text-[11px] text-amber-900 font-medium bg-amber-50/90 border border-amber-200 rounded px-2 py-1 mt-1">
                  c/o Representative / PA: <span className="font-bold">{client?.paName || booking.paName}</span>
                  {(client?.paEmail || booking.paEmail || client?.paPhone || booking.paPhone) && (
                    <span className="block text-[10px] text-amber-800/90 font-mono mt-0.5">
                      {[client?.paEmail || booking.paEmail, client?.paPhone || booking.paPhone].filter(Boolean).join(" • ")}
                    </span>
                  )}
                </div>
              )}
              <p className="text-slate-600 mt-1">{client?.streetAddress || "14 Bourdillon Road, Ikoyi"}</p>
              <p className="text-slate-600">{client?.cityPostalCountry || "Lagos, Nigeria"}</p>
              <p className="text-slate-600 font-mono mt-0.5">Account {accountNumber || "ACC-30412"}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-1.5">
                YOUR REPRESENTATIVE
              </p>
              <p className="font-semibold text-slate-900 text-sm">{repName}</p>
              <p className="text-slate-700">{repEmail}</p>
              <p className="text-slate-600">{repPhone}</p>
            </div>
          </div>

          {/* ITINERARY */}
          <div className="pt-1">
            <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
              ITINERARY
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-2 pr-2 font-bold w-10">LEG</th>
                  <th className="py-2 px-2 font-bold w-24">DATE</th>
                  <th className="py-2 px-2 font-bold">FROM</th>
                  <th className="py-2 px-2 font-bold">TO</th>
                  <th className="py-2 px-2 font-bold text-center whitespace-nowrap">DEPARTS (LT)</th>
                  <th className="py-2 px-2 font-bold text-center whitespace-nowrap">ARRIVES (LT)</th>
                  <th className="py-2 px-2 font-bold text-center whitespace-nowrap">BLOCK</th>
                  <th className="py-2 pl-2 font-bold text-right w-10">PAX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {legs && legs.length > 0 ? (
                  legs.map((leg, index) => {
                    const originIcao = leg.origin?.icao || "LFPB";
                    const originCity = leg.origin?.city || leg.origin?.name || "Paris Le Bourget";
                    const originFbo = leg.departureHandling?.name || (originIcao === "LFPB" ? "Jet Aviation" : "Executive Handling");
                    const destIcao = leg.destination?.icao || "DNAA";
                    const destCity = leg.destination?.city || leg.destination?.name || "Abuja";
                    const destFbo = leg.arrivalHandling?.name || (destIcao === "DNAA" ? "Execujet" : "Executive Handling");

                    return (
                      <tr key={leg.legNumber || index} className="align-top">
                        <td className="py-2.5 pr-2 font-medium text-slate-900">{leg.legNumber || index + 1}</td>
                        <td className="py-2.5 px-2 text-slate-800 whitespace-nowrap">{leg.flightDate || "Tue 24 Nov"}</td>
                        <td className="py-2.5 px-2">
                          <div className="font-semibold text-slate-900">{originIcao} {originCity}</div>
                          <div className="text-[11px] text-slate-500">FBO {originFbo}</div>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="font-semibold text-slate-900">{destIcao} {destCity}</div>
                          <div className="text-[11px] text-slate-500">FBO {destFbo}</div>
                          {booking.tripType === "multi_leg" && leg.aircraftType && (
                            <div className="text-[10px] text-amber-700 font-mono font-bold mt-0.5">
                              ✈ {leg.aircraftType}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-800">{leg.departureTimeLocal || "08:30"}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-800">{leg.arrivalTimeLocal || "14:00"}</td>
                        <td className="py-2.5 px-2 text-center text-slate-800 whitespace-nowrap">{leg.flightTimeFormatted || "5 h 30"}</td>
                        <td className="py-2.5 pl-2 text-right font-medium text-slate-900">{leg.paxCount || 5}</td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr className="align-top">
                      <td className="py-2.5 pr-2 font-medium text-slate-900">1</td>
                      <td className="py-2.5 px-2 text-slate-800 whitespace-nowrap">Tue 24 Nov</td>
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-slate-900">LFPB Paris Le Bourget</div>
                        <div className="text-[11px] text-slate-500">FBO Jet Aviation</div>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-slate-900">DNAA Abuja</div>
                        <div className="text-[11px] text-slate-500">FBO Execujet</div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-800">08:30</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-800">14:00</td>
                      <td className="py-2.5 px-2 text-center text-slate-800">5 h 30</td>
                      <td className="py-2.5 pl-2 text-right font-medium text-slate-900">5</td>
                    </tr>
                    <tr className="align-top">
                      <td className="py-2.5 pr-2 font-medium text-slate-900">2</td>
                      <td className="py-2.5 px-2 text-slate-800 whitespace-nowrap">Mon 30 Nov</td>
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-slate-900">DNAA Abuja</div>
                        <div className="text-[11px] text-slate-500">FBO Execujet</div>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-slate-900">LFPB Paris Le Bourget</div>
                        <div className="text-[11px] text-slate-500">FBO Jet Aviation</div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-800">16:00</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-800">21:30</td>
                      <td className="py-2.5 px-2 text-center text-slate-800">5 h 30</td>
                      <td className="py-2.5 pl-2 text-right font-medium text-slate-900">5</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            <p className="text-[10px] text-slate-500 mt-2">
              Times are local at each airport. Block times are estimates and depend on routing and winds on the day.
            </p>
          </div>

          {/* Two Columns: AIRCRAFT & PRICE */}
          <div className="grid grid-cols-2 gap-8 pt-2">
            {/* Left Column: AIRCRAFT */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
                AIRCRAFT
              </h3>
              {/* Photo Placeholders */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="h-24 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400 overflow-hidden relative">
                  {exteriorPhoto ? (
                    <img
                      src={exteriorPhoto}
                      alt="Exterior"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>Exterior photo</span>
                  )}
                </div>
                <div className="h-24 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400 overflow-hidden relative">
                  {cabinPhoto ? (
                    <img
                      src={cabinPhoto}
                      alt="Cabin"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>Cabin photo</span>
                  )}
                </div>
              </div>

              {/* Aircraft Specs */}
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="font-bold text-slate-900 text-[10px] tracking-wider uppercase mr-2">TYPE</span>
                  <span className="text-slate-800">{aircraft?.name || "Bombardier Challenger 350"} · {aircraft?.categoryLabel || "Super midsize"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-[10px] tracking-wider uppercase mr-2">BUILT · REFURBISHED</span>
                  <span className="text-slate-800">{aircraft?.yearOfManufacture || "2018"} · {aircraft?.yearOfRefurbishment || "2023"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-[10px] tracking-wider uppercase mr-2">SEATS</span>
                  <span className="text-slate-800">{aircraft?.passengers || 9} · {aircraft?.toilette ? "enclosed lavatory" : "standard"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-[10px] tracking-wider uppercase mr-2">LUGGAGE</span>
                  <span className="text-slate-800">6 large suitcases, 2 soft bags · fits hold</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                Photos are representative of the aircraft type until the aircraft is assigned. The operating carrier, an approved AOC holder, and the registration are confirmed on the flight brief.
              </p>
            </div>

            {/* Right Column: PRICE */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
                PRICE
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-700 leading-snug">
                    Charter, {legs?.length || 2} legs, all-inclusive of landing, handling and crew costs
                  </span>
                  <span className="font-medium text-slate-900 whitespace-nowrap">
                    {formatDocCurrency(baseCharterPrice, currency)}
                  </span>
                </div>

                {itemizedServices.map((srv, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-4">
                    <span className="text-slate-700 leading-snug">
                      {srv.name}{srv.details ? ` · ${srv.details}` : ""}
                    </span>
                    <span className="font-medium text-slate-900 whitespace-nowrap">
                      {srv.price === 0 ? "Included" : formatDocCurrency(srv.price, currency)}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-700 leading-snug">
                    VAT · <span className="text-[10px] text-slate-500 font-mono">{company.vatExemptionClause}</span>
                  </span>
                  <span className="font-medium text-slate-900 whitespace-nowrap">
                    {formatDocCurrency(0, currency)}
                  </span>
                </div>

                {/* Total Row */}
                <div className="border-t border-slate-900 pt-2 flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-900 font-bold">Total</span>
                  <span className="text-slate-900 font-bold text-base font-mono">
                    {formatDocCurrency(totalPrice, currency)}
                  </span>
                </div>

                {/* Bank Transfer and Card Options */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
                    <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase">
                      BANK TRANSFER
                    </p>
                    <p className="font-semibold text-slate-900 text-xs mt-1">
                      {formatDocCurrency(totalPrice, currency)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">no surcharge</p>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
                    <p className="text-[10px] font-bold text-slate-900 tracking-wider uppercase">
                      CARD
                    </p>
                    <p className="font-semibold text-slate-900 text-xs mt-1">
                      {formatDocCurrency(cardPrice, currency)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">includes 3.5 % card fee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Step Callout */}
          <div className="pt-2">
            <p className="text-[10.5px] text-slate-600 leading-relaxed">
              <strong className="text-slate-900">Next step.</strong> To book, confirm with your representative. A charter agreement is issued for signature; the booking is final once it is signed. This quotation is subject to aircraft availability at the time of booking, slots, permits and operator confirmation. Prices are valid until the date above. <span className="bg-[#FEF3C7] text-[#92400E] px-1 py-0.5 rounded text-[10px]">[Cancellation terms reference: see charter agreement]</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <DocumentFooter
          leftText={`${quoteId} · ${client?.companyName || client?.fullName || "Bello Group Ltd"}`}
          currentPage={1}
          totalPages={1}
        />
      </div>
    </div>
  );
}
