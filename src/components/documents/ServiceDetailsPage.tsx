"use client";

import React from "react";
import type { Booking } from "@/types/aviation";
import { docMoney, passengerFeeRows, serviceRows } from "@/lib/documentData";
import { DocPage, Letterhead, Section, thCls } from "./docKit";

/** "Service details" page shared by the quotation (page 2) and the charter agreement (page 3). */
export function hasServiceDetails(booking: Booking): boolean {
  return serviceRows(booking).length > 0 || passengerFeeRows(booking).length > 0;
}

export default function ServiceDetailsPage({
  booking,
  footerLeft,
  page,
  pages,
  showPrices,
  currency
}: {
  booking: Booking;
  footerLeft: string;
  page: number;
  pages: number;
  showPrices: boolean;
  currency: string;
}) {
  const rows = serviceRows(booking);
  const fees = passengerFeeRows(booking);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const hasChauffeur = rows.some((r) => r.kind === "limousine");

  return (
    <DocPage footerLeft={footerLeft} page={page} pages={pages}>
      <Letterhead />
      <h2 className="text-[24px] leading-none font-bold tracking-tight text-[#111827] m-0 mb-6">Service details</h2>

      {rows.length > 0 && (
        <>
          <Section className="mb-2">Additional services</Section>
          {/* Smaller print (10.5 px); with prices off the same services are listed without prices or a subtotal */}
          <table className="w-full border-collapse mb-2 text-[10.5px] leading-[1.4]">
            <thead>
              <tr className="border-b-2 border-[#111827]">
                <th className={`${thCls} !text-[9.5px] w-[48px]`}>Leg</th>
                <th className={`${thCls} !text-[9.5px]`}>Service</th>
                {showPrices && <th className={`${thCls} !text-[9.5px] text-right w-[120px]`}>Price</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.title}-${i}`} className="border-b border-[#E5E7EB] align-top">
                  <td className="py-[6px] px-[6px]">{r.leg}</td>
                  <td className="py-[6px] px-[6px]">
                    <div className="font-bold">{r.title}</div>
                    {r.detail && <div className="text-[#6B7280]">{r.detail}</div>}
                  </td>
                  {showPrices && <td className="py-[6px] px-[6px] text-right whitespace-nowrap">{r.included ? "Included" : docMoney(r.amount, currency)}</td>}
                </tr>
              ))}
              {showPrices && (
                <tr className="border-b-2 border-[#111827]">
                  <td className="py-[6px] px-[6px]" />
                  <td className="py-[6px] px-[6px] font-bold">Additional services total</td>
                  <td className="py-[6px] px-[6px] text-right font-bold whitespace-nowrap">{docMoney(total, currency)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {fees.length > 0 && (
        <>
          <Section className="mt-6 mb-2">Passenger fees</Section>
          <table className="w-full border-collapse mb-2 text-[10.5px] leading-[1.4]">
            <tbody>
              {fees.map((f, i) => (
                <tr key={`fee-${i}`} className="border-b border-[#E5E7EB]">
                  <td className="py-[6px] px-[6px]">{f.label}</td>
                  <td className="py-[6px] px-[6px] text-right whitespace-nowrap w-[120px]">{docMoney(f.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11.5px] text-[#6B7280] mt-1 mb-0">Passenger fees are charged by the airports and passed on at cost.</p>
        </>
      )}

      {hasChauffeur && (
        <p className="text-[11.5px] text-[#6B7280] mt-6 mb-0">
          Chauffeurs wait at the aircraft or the terminal exit with a name board. Pick-up times follow the actual landing time; waiting time on the day is
          included.
        </p>
      )}
    </DocPage>
  );
}
