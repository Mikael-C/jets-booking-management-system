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
  const width = compact ? 260 : 380;
  const height = compact ? 130 : 180;

  // Calculate relative SVG positions
  // Compute bearing / angle
  const deltaX = dLng - oLng;
  const deltaY = dLat - oLat;
  const angleRad = Math.atan2(deltaY, deltaX);
  const angleDeg = (angleRad * 180) / Math.PI;

  // Origin point on SVG
  const x1 = compact ? 50 : 65;
  const y1 = compact ? 85 : 120;

  // Destination point on SVG
  const x2 = width - (compact ? 50 : 65);
  const y2 = compact ? 45 : 55;

  // Quadratic curve control point for graceful parabolic arch
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - (compact ? 25 : 45);

  const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gold/30 bg-[#0B101A] shadow-inner select-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(201, 160, 82, 0.08) 0%, transparent 80%), 
                          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), 
                          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 20px 20px, 20px 20px"
      }}
    >
      {/* Top Header Badge */}
      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 z-10">
        <span className="flex h-2 w-2 rounded-full bg-gold animate-ping" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gold/90 font-mono">
          LEG {legNumber} ROUTE RADAR
        </span>
      </div>

      <div className="absolute top-2.5 right-3 flex items-center gap-1.5 z-10 text-[10px] text-gray-400 font-mono">
        <Navigation className="w-3 h-3 text-gold" />
        <span>{distanceNm} NM</span>
        <span className="text-gray-600">•</span>
        <span className="text-white font-medium">{flightTime}</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block"
        style={{ minHeight: compact ? "110px" : "150px" }}
      >
        <defs>
          <linearGradient id={`goldGrad-${legNumber}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9A052" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FF6B00" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#E8D5A3" stopOpacity="0.8" />
          </linearGradient>

          <filter id={`glow-${legNumber}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Radar Range Rings */}
        <circle cx={x1} cy={y1} r="28" fill="none" stroke="rgba(201, 160, 82, 0.12)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={x2} cy={y2} r="28" fill="none" stroke="rgba(201, 160, 82, 0.12)" strokeWidth="1" strokeDasharray="3 3" />

        {/* Flight Path Background Glow */}
        <path
          d={pathD}
          fill="none"
          stroke="#C9A052"
          strokeWidth="3"
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
          <circle r="12" fill="rgba(201, 160, 82, 0.15)" />
          <circle r="6" fill="#C9A052" />
          <circle r="2.5" fill="#0B101A" />
        </g>

        {/* Destination Pin */}
        <g transform={`translate(${x2}, ${y2})`}>
          <circle r="12" fill="rgba(16, 185, 129, 0.15)" />
          <circle r="6" fill="#10B981" />
          <circle r="2.5" fill="#0B101A" />
        </g>

        {/* Mid-flight Aircraft Indicator */}
        <g transform={`translate(${cx}, ${cy}) rotate(${angleDeg > 0 ? -angleDeg : angleDeg})`}>
          <circle r="10" fill="#0F1420" stroke="#C9A052" strokeWidth="1.5" />
          <path
            d="M -4 -3 L 4 0 L -4 3 L -2 0 Z"
            fill="#C9A052"
            transform="scale(1.2)"
          />
        </g>
      </svg>

      {/* Bottom Labels */}
      <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-xs z-10">
        <div className="flex flex-col">
          <span className="font-bold text-white text-xs tracking-wider flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-gold/20 text-gold text-[10px] font-mono">
              {origin.iata || origin.icao}
            </span>
            <span className="truncate max-w-[110px] text-gray-200">{origin.city}</span>
          </span>
          <span className="text-[10px] text-gray-400 font-mono">{origin.icao}</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-gold/80 px-2 py-0.5 rounded-full bg-navy/80 border border-gold/20">
          <Plane className="w-2.5 h-2.5 transform rotate-45" />
          <span className="font-mono">DIRECT ROUTE</span>
        </div>

        <div className="flex flex-col items-end">
          <span className="font-bold text-white text-xs tracking-wider flex items-center gap-1">
            <span className="truncate max-w-[110px] text-gray-200">{destination.city}</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
              {destination.iata || destination.icao}
            </span>
          </span>
          <span className="text-[10px] text-gray-400 font-mono">{destination.icao}</span>
        </div>
      </div>
    </div>
  );
}
