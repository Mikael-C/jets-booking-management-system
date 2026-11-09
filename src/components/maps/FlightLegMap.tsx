"use client";

import React from "react";
import { Airport } from "@/types/aviation";
import { Plane, Navigation } from "lucide-react";

interface FlightLegMapProps {
  origin: Airport;
  destination: Airport;
  flightTime?: string;
  distanceNm?: number;
  legNumber?: number;
  className?: string;
  compact?: boolean;
}

export default function FlightLegMap({
  origin,
  destination,
  flightTime = "1h 15m",
  distanceNm = 240,
  legNumber = 1,
  className = "",
  compact = false
}: FlightLegMapProps) {
  // Coordinates fallback if undefined
  const oLat = origin.coordinates?.lat ?? 46.2;
  const oLng = origin.coordinates?.lng ?? 6.1;
  const dLat = destination.coordinates?.lat ?? 44.4;
  const dLng = destination.coordinates?.lng ?? 8.8;

  // Normalized SVG canvas dimensions
  const width = compact ? 280 : 420;
  const height = compact ? 150 : 200;

  // Calculate real geographic orientation
  const dLngSpan = dLng - oLng;
  const dLatSpan = dLat - oLat; // lat increases North; in SVG y increases downward

  const isEastbound = dLngSpan >= 0;
  const isNorthbound = dLatSpan >= 0;

  // Compute angle for plane rotation
  const angleDeg = (Math.atan2(dLatSpan, dLngSpan) * 180) / Math.PI;

  // Proportional projection so the track reflects reality (e.g. Geneva to Genoa is South/Southeast)
  const absLng = Math.abs(dLngSpan) || 0.01;
  const absLat = Math.abs(dLatSpan) || 0.01;
  const ratio = Math.min(Math.max(absLng / (absLng + absLat), 0.2), 0.8);
  const vRatio = 1 - ratio;

  let relX1 = isEastbound ? 0.5 - ratio * 0.42 : 0.5 + ratio * 0.42;
  let relX2 = isEastbound ? 0.5 + ratio * 0.42 : 0.5 - ratio * 0.42;
  let relY1 = isNorthbound ? 0.5 + vRatio * 0.32 : 0.5 - vRatio * 0.32;
  let relY2 = isNorthbound ? 0.5 - vRatio * 0.32 : 0.5 + vRatio * 0.32;

  // Safe clamping inside view
  const x1 = Math.round(Math.min(Math.max(width * relX1, 55), width - 55));
  const y1 = Math.round(Math.min(Math.max(height * relY1, 40), height - 45));
  const x2 = Math.round(Math.min(Math.max(width * relX2, 55), width - 55));
  const y2 = Math.round(Math.min(Math.max(height * relY2, 40), height - 45));

  // Natural aerodynamic curved flight track
  const midX = (x1 + x2) / 2;
  const cx = midX;
  const cy = Math.min(y1, y2) - (compact ? 22 : 36);

  const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#C9A052]/30 bg-[#0B101A] shadow-inner select-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(201, 160, 82, 0.08) 0%, transparent 80%), 
                          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), 
                          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 20px 20px, 20px 20px"
      }}
    >
      {/* Top Header Badge */}
      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 z-10">
        <span className="flex h-2 w-2 rounded-full bg-[#C9A052] animate-ping" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C9A052] font-mono">
          LEG {legNumber} ROUTE RADAR
        </span>
      </div>

      <div className="absolute top-2.5 right-3 flex items-center gap-1.5 z-10 text-[10px] text-gray-400 font-mono">
        <Navigation className="w-3 h-3 text-[#C9A052]" />
        <span>{distanceNm} NM</span>
        <span className="text-gray-600">•</span>
        <span className="text-white font-medium">{flightTime}</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block"
        style={{ minHeight: compact ? "130px" : "175px" }}
      >
        <defs>
          <linearGradient id={`goldGrad-${legNumber}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9A052" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FF6B00" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#E8D5A3" stopOpacity="0.85" />
          </linearGradient>

          <filter id={`glow-${legNumber}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Radar Range Rings */}
        <circle cx={x1} cy={y1} r="26" fill="none" stroke="rgba(201, 160, 82, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={x2} cy={y2} r="26" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" strokeDasharray="3 3" />

        {/* Flight Path Background Glow */}
        <path
          d={pathD}
          fill="none"
          stroke="#C9A052"
          strokeWidth="3.5"
          strokeOpacity="0.25"
          filter={`url(#glow-${legNumber})`}
        />

        {/* Flight Arc Line */}
        <path
          d={pathD}
          fill="none"
          stroke={`url(#goldGrad-${legNumber})`}
          strokeWidth="2.5"
          strokeDasharray="6 4"
          className="animate-pulse"
        />

        {/* Origin Pin */}
        <g transform={`translate(${x1}, ${y1})`}>
          <circle r="12" fill="rgba(201, 160, 82, 0.2)" />
          <circle r="5.5" fill="#C9A052" />
          <circle r="2" fill="#0B101A" />
          <text
            y="20"
            textAnchor="middle"
            fill="#C9A052"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {origin.icao}
          </text>
        </g>

        {/* Destination Pin */}
        <g transform={`translate(${x2}, ${y2})`}>
          <circle r="12" fill="rgba(16, 185, 129, 0.2)" />
          <circle r="5.5" fill="#10B981" />
          <circle r="2" fill="#0B101A" />
          <text
            y="20"
            textAnchor="middle"
            fill="#10B981"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {destination.icao}
          </text>
        </g>

        {/* Mid-flight Aircraft Indicator */}
        <g transform={`translate(${cx}, ${cy}) rotate(${-angleDeg})`}>
          <circle r="11" fill="#0F1420" stroke="#C9A052" strokeWidth="1.5" />
          <path
            d="M -5 -3.5 L 5 0 L -5 3.5 L -2.5 0 Z"
            fill="#C9A052"
            transform="scale(1.2)"
          />
        </g>
      </svg>

      {/* Bottom Labels with Exact Airport Names & City Locations */}
      <div className="absolute bottom-2 inset-x-3 flex items-center justify-between text-xs z-10 bg-[#0B101A]/85 backdrop-blur-xs py-1 px-2 rounded-lg border border-white/5">
        <div className="flex flex-col max-w-[45%]">
          <span className="font-bold text-white text-[11px] tracking-wide flex items-center gap-1">
            <span className="px-1.5 py-0.2 rounded bg-[#C9A052]/25 text-[#C9A052] text-[10px] font-mono font-bold">
              {origin.iata ? `${origin.icao}/${origin.iata}` : origin.icao}
            </span>
            <span className="truncate text-gray-200">{origin.city}</span>
          </span>
          <span className="text-[10px] text-gray-400 truncate">{origin.name}</span>
        </div>

        <div className="flex items-center gap-1 text-[9px] text-[#C9A052] px-2 py-0.5 rounded-full bg-[#141A29] border border-[#C9A052]/30">
          <Plane className="w-2.5 h-2.5 transform rotate-45 text-[#C9A052]" />
          <span className="font-mono font-bold">DIRECT</span>
        </div>

        <div className="flex flex-col items-end max-w-[45%] text-right">
          <span className="font-bold text-white text-[11px] tracking-wide flex items-center gap-1">
            <span className="truncate text-gray-200">{destination.city}</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/25 text-emerald-400 text-[10px] font-mono font-bold">
              {destination.iata ? `${destination.icao}/${destination.iata}` : destination.icao}
            </span>
          </span>
          <span className="text-[10px] text-gray-400 truncate">{destination.name}</span>
        </div>
      </div>
    </div>
  );
}
