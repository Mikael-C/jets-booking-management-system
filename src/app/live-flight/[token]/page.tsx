"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plane, Compass, Clock, MapPin, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function LiveFlightSharedPage() {
  const params = useParams();
  const token = params?.token as string;
  const [flightData, setFlightData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (token) {
          const res = await api.flightWatch.getShared(token);
          if (res?.success && res.data) {
            setFlightData(res.data);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="text-gray-500 font-mono text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E59700] animate-ping" />
          Acquiring ADS-B telemetry...
        </div>
      </div>
    );
  }

  const data = flightData || {
    tripNumber: "FE4578",
    aircraft: "Phenom 300E (D-IOBA)",
    route: "LEIB (Ibiza) → LSGG (Geneva)",
    status: "Airborne · on time",
    altitude: "FL410",
    distanceRemainingKm: 210,
    scheduledDeparture: "08:30 UTC",
    estimatedArrival: "10:05 UTC",
    expiresNotice: "Expires 2 hours after landing",
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-[#0B1320] text-white py-4 px-6 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded-[4px] bg-[#E59700]" />
          <span className="font-bold tracking-tight text-sm">Orbelo · Live Flight Watch</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>ADS-B Live Feed</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Status Hero Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                FLIGHT {data.tripNumber}
              </div>
              <h1 className="text-xl font-bold text-gray-900 mt-0.5">{data.aircraft}</h1>
            </div>
            <span className="self-start sm:self-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
              {data.status}
            </span>
          </div>

          {/* Route Display */}
          <div className="py-2">
            <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#E59700]" />
              <span>{data.route}</span>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>Departed {data.scheduledDeparture}</span>
              <span>Est. Arrival {data.estimatedArrival}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="bg-[#0284C7] h-full w-[68%] rounded-full animate-pulse" />
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase">CURRENT ALTITUDE</div>
              <div className="text-base font-bold text-gray-900 font-mono mt-0.5">{data.altitude}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase">DISTANCE REMAINING</div>
              <div className="text-base font-bold text-gray-900 font-mono mt-0.5">{data.distanceRemainingKm} km</div>
            </div>
          </div>
        </div>

        {/* Security / Privacy Banner */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-4 text-xs text-gray-500 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span>
            This is a secure, read-only tracking link for family or an assistant. No passenger names or financial pricing are displayed. {data.expiresNotice}.
          </span>
        </div>
      </main>
    </div>
  );
}
