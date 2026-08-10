"use client";

import { motion } from "motion/react";
import {
  dayHandRotation,
  getSector,
  monthHandRotation,
  yearHandRotation,
} from "@/lib/cosmic-clock-math";

export type CosmicClockProps = {
  day: number;
  month: number;
  year: number;
  size?: number;
};

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const SECTOR_COLORS = ["#2d5f96", "#8c2855", "#7a5f10"] as const;

export function CosmicClock({
  day,
  month,
  year,
  size = 180,
}: CosmicClockProps) {
  const hourRotation = yearHandRotation(year);
  const minuteRotation = monthHandRotation(month);
  const secondRotation = dayHandRotation(day);

  const hourSector = getSector(hourRotation);
  const minuteSector = getSector(minuteRotation);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  const outerTickR = r - 6;
  const innerTickR = r - 16;
  const innerSmallR = r - 12;
  const numR = r - 30;

  const sectorPath = (i: number) => {
    const sectorR = r - 2;
    const startAngle = (i * 30 - 90) * (Math.PI / 180);
    const endAngle = ((i + 1) * 30 - 90) * (Math.PI / 180);
    const x1 = cx + sectorR * Math.cos(startAngle);
    const y1 = cy + sectorR * Math.sin(startAngle);
    const x2 = cx + sectorR * Math.cos(endAngle);
    const y2 = cy + sectorR * Math.sin(endAngle);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${sectorR} ${sectorR} 0 0 1 ${x2} ${y2} Z`;
  };

  const outerArcPath = (sectorIndex: number, arcR: number) => {
    const startAngle = (sectorIndex * 30 - 90) * (Math.PI / 180);
    const endAngle = ((sectorIndex + 1) * 30 - 90) * (Math.PI / 180);
    const x1 = cx + arcR * Math.cos(startAngle);
    const y1 = cy + arcR * Math.sin(startAngle);
    const x2 = cx + arcR * Math.cos(endAngle);
    const y2 = cy + arcR * Math.sin(endAngle);
    return `M ${x1} ${y1} A ${arcR} ${arcR} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div className="absolute inset-0 rounded-full bg-blue-500/15 blur-2xl" />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r - 1}
          fill="rgba(0,0,0,0.55)"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1.8"
        />

        {HOURS.map((_, i) => (
          <path
            key={`sector-${i}`}
            d={sectorPath(i)}
            fill={SECTOR_COLORS[i % 3]}
          />
        ))}

        <path
          d={outerArcPath(hourSector, r + 7)}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="9"
          strokeLinecap="round"
          style={{ filter: "blur(4px)" }}
          opacity="0.7"
        />
        <path
          d={outerArcPath(hourSector, r + 7)}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d={outerArcPath(minuteSector, r + 7)}
          fill="none"
          stroke="#c084fc"
          strokeWidth="9"
          strokeLinecap="round"
          style={{ filter: "blur(4px)" }}
          opacity="0.7"
        />
        <path
          d={outerArcPath(minuteSector, r + 7)}
          fill="none"
          stroke="#c084fc"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {HOURS.map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          return (
            <line
              key={`sep-${i}`}
              x1={cx}
              y1={cy}
              x2={cx + (r - 2) * Math.cos(angle)}
              y2={cy + (r - 2) * Math.sin(angle)}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="0.8"
            />
          );
        })}

        <circle
          cx={cx}
          cy={cy}
          r={r * 0.8}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r * 0.6}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />

        {HOURS.map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const isMajor = i % 3 === 0;
          const x1 = cx + outerTickR * Math.cos(angle);
          const y1 = cy + outerTickR * Math.sin(angle);
          const x2 = cx + (isMajor ? innerTickR : innerSmallR) * Math.cos(angle);
          const y2 = cy + (isMajor ? innerTickR : innerSmallR) * Math.sin(angle);
          return (
            <line
              key={`tick-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={
                isMajor ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)"
              }
              strokeWidth={isMajor ? 2 : 1.2}
              strokeLinecap="round"
            />
          );
        })}

        {HOURS.map((h, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x = cx + numR * Math.cos(angle);
          const y = cy + numR * Math.sin(angle);
          const isMajor = i % 3 === 0;
          return (
            <text
              key={h}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={
                isMajor ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.75)"
              }
              fontSize={isMajor ? size * 0.075 : size * 0.063}
              fontFamily="inherit"
              fontWeight={isMajor ? 800 : 600}
            >
              {h}
            </text>
          );
        })}
      </svg>

      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: hourRotation }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute origin-bottom bottom-1/2 rounded-full bg-blue-400"
        style={{
          width: "20px",
          height: `${size * 0.28}px`,
          boxShadow: "0 0 10px rgba(96,165,250,0.65)",
        }}
      />

      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: minuteRotation }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute origin-bottom bottom-1/2 rounded-full bg-purple-400"
        style={{
          width: "11px",
          height: `${size * 0.35}px`,
          boxShadow: "0 0 8px rgba(192,132,252,0.6)",
        }}
      />

      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: secondRotation }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        className="absolute origin-bottom bottom-1/2 rounded-full bg-indigo-400/70"
        style={{ width: "2px", height: `${size * 0.35}px` }}
      />

      <div
        className="absolute z-10 rounded-full border-2 border-blue-500 bg-white"
        style={{ width: `${size * 0.06}px`, height: `${size * 0.06}px` }}
      />
    </div>
  );
}
