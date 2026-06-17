/**
 * Physics utilities for Zipline calculations (Unified High-Fidelity Engine)
 */

export interface Point {
  x: number;
  y: number;
  v?: number; // m/s (used in dynamics)
  speed?: number; // m/s
  speedNoWind?: number; // m/s
  t?: number;
  stopped?: boolean;
}

export interface RopeType {
  name: string;
  construction: string;
  layType: string;
  grade: string;
  weight: number; // kg/m
  breaking: number; // kN
}

export const ROPE_DATABASE: Record<string, {
  name: string;
  construction: string;
  layType: string;
  grade: string;
  diameters: Record<number, { weight: number; breaking: number }>;
}> = {
  "1xK43": {
    name: "Triniks ZL",
    construction: "1×K43",
    layType: "1×K43 (1+6+12+12+12)",
    grade: "1770 Н/мм²",
    diameters: {
      12: { weight: 0.89, breaking: 166 },
      14: { weight: 1.21, breaking: 226 },
      16: { weight: 1.58, breaking: 295 },
      18: { weight: 2.00, breaking: 374 }
    }
  },
  "1x37": {
    name: "ГОСТ 3064-80",
    construction: "1×37",
    layType: "1×37 (1+6+12+18)",
    grade: "1770 Н/мм²",
    diameters: {
      12: { weight: 0.84, breaking: 101 },
      14: { weight: 1.14, breaking: 138 },
      16: { weight: 1.49, breaking: 180 },
      18: { weight: 1.89, breaking: 227 }
    }
  },
  "1x19": {
    name: "1×19 DIN 3051",
    construction: "1×19",
    layType: "1×19 (1+6+12)",
    grade: "1770 Н/мм²",
    diameters: {
      12: { weight: 0.66, breaking: 102 },
      14: { weight: 0.90, breaking: 139 },
      16: { weight: 1.17, breaking: 181 },
      18: { weight: 1.49, breaking: 230 }
    }
  }
};

/**
 * Calculates air density based on altitude, temperature, and relative humidity.
 */
export const calculateAirDensity = (altitude: number, temperature: number, humidity: number): number => {
  const Tk = temperature + 273.15;
  const P0 = 101325; // Sea level standard pressure (Pa)
  const P = P0 * Math.pow(1 - 0.0000225577 * altitude, 5.25588);
  const Psat = 610.78 * Math.pow(10, (7.5 * temperature) / (237.3 + temperature));
  const Pv = (humidity / 100) * Psat;
  const Pd = P - Pv;
  const rho = (Pd / (287.05 * Tk)) + (Pv / (461.495 * Tk));
  return parseFloat(rho.toFixed(4));
};

/**
 * Calculates tension needed to achieve a target sag ratio at the center.
 */
export const calculateOptimalTension = (
  span: number,
  ropeWeight: number,
  targetSagRatio: number = 0.02,
  loadWeight: number = 80
): number => {
  const g = 9.81;
  const q = ropeWeight * g;
  const P = loadWeight * g;
  const targetSag = span * targetSagRatio;
  
  // Sag = (P * L) / (4 * T) + (q * L^2) / (8 * T)
  // => T = (P * L / 4 + q * L^2 / 8) / Sag
  const tensionN = ((P * span) / 4 + (q * Math.pow(span, 2)) / 8) / Math.max(targetSag, 0.01);
  return tensionN / g; // Return in kg
};

export interface ZiplineInput {
  span: number;
  hStart: number;
  hEnd: number;
  tensionKg: number;
  ropeWeight: number; // kg/m
  ropeDiameter: number; // mm
  ropeBreakingLoadKn: number;
  
  // Trolley & Sheaves
  sheaveDiameter1: number; // mm
  sheaveDiameter2: number; // mm
  bearingEfficiency: number; // 0 to 1
  sheaveMaterial: "steel" | "polyacetal";

  // Rider
  riderMass: number;
  dragCd: number;
  dragArea: number; // m^2

  // Atmosphere
  altitude: number;
  temperature: number;
  humidity: number;

  // Wind
  windSpeed: number; // m/s
  windDirection: number; // degrees, 0 = tailwind, 180 = headwind

  // UI helpers
  loadPositionX: number;
}

export interface ZiplineResults {
  points: Point[]; // Loaded profile at loadPositionX
  unloadedPoints: Point[]; // Cable profile with NO rider
  travelProfile: Point[]; // Travel path with wind (detailed RK4 output)
  ptsNW: Point[]; // Travel path without wind
  ptsW40: Point[]; // Travel path for 40kg rider
  ptsW120: Point[]; // Travel path for 120kg rider
  ptsAero: Point[]; // Travel path with gravity + drag (no friction)
  ptsIdeal: Point[]; // Travel path with gravity ONLY
  
  reactions: {
    start: { horizontal: number; vertical: number };
    end: { horizontal: number; vertical: number };
  };
  maxTensionNewtons: number;
  safetyFactor: number;
  cableLength: number;
  
  maxSpeed: number; // m/s
  maxSpeedNoWind: number; // m/s
  finishSpeed: number; // m/s
  finishSpeedNoWind: number; // m/s
  avgSpeed: number; // m/s
  totalTime: number; // s
  totalTimeNoWind: number; // s
  maxVx: number; // m
}

export const simulateZipline = (input: ZiplineInput): ZiplineResults => {
  const g = 9.81;
  const span = input.span;
  const drop = input.hStart - input.hEnd;
  
  if (span <= 0) {
    return {
      points: [], unloadedPoints: [], travelProfile: [], ptsNW: [], ptsW40: [], ptsW120: [], ptsAero: [], ptsIdeal: [],
      reactions: { start: { horizontal: 0, vertical: 0 }, end: { horizontal: 0, vertical: 0 } },
      maxTensionNewtons: 0, safetyFactor: 0, cableLength: 0,
      maxSpeed: 0, maxSpeedNoWind: 0, finishSpeed: 0, finishSpeedNoWind: 0, avgSpeed: 0, totalTime: 0, totalTimeNoWind: 0, maxVx: 0
    };
  }

  // Adjust pre-tension for temperature (standard thermal expansion of steel)
  // α = 12e-6 /°C for steel; ΔT = deviation from 20°C installation reference
  // Strain ε = α * ΔT → tension reduced if warmer (cable expands → sags more)
  const alpha = 12e-6;
  const tRef = 20;
  const deltaT = input.temperature - tRef;
  const adjustedTensionNewtons = (input.tensionKg * g) * (1 - alpha * deltaT * span);

  const q = input.ropeWeight * g;
  const rho = calculateAirDensity(input.altitude, input.temperature, input.humidity);
  
  // Sheave friction parameters
  const sheaveFriction = input.sheaveMaterial === "polyacetal" ? 0.05 : 0.12;
  const sheaveDiaAvgM = (input.sheaveDiameter1 + input.sheaveDiameter2) / 2000;
  const eta = input.bearingEfficiency;

  // Wind decomposition
  const windDirRad = input.windDirection * Math.PI / 180;
  const headwind = -input.windSpeed * Math.cos(windDirRad); // blows against rider if positive
  const crosswind = input.windSpeed * Math.sin(windDirRad);

  const c_damp = 0.00025 * q * Math.sqrt(g * span); // Cable vibration damping

  // Helper equations for cable shape
  const getCableY = (x: number, riderX: number, riderWeightKg: number) => {
    const s = x / span;
    const yStraight = input.hStart - s * drop;
    const ySagRope = (q * x * (span - x)) / (2 * adjustedTensionNewtons);
    
    let ySagLoad = 0;
    if (riderWeightKg > 0) {
      const P = (riderWeightKg + 2) * g; // rider + 2kg equipment
      const a = riderX;
      const b = span - riderX;
      if (x <= a) {
        ySagLoad = (P * b * x) / (adjustedTensionNewtons * span);
      } else {
        ySagLoad = (P * a * (span - x)) / (adjustedTensionNewtons * span);
      }
    }
    return yStraight - ySagRope - ySagLoad;
  };

  const getCableSlope = (x: number, riderX: number, riderWeightKg: number) => {
    const step = 0.1;
    const x1 = Math.max(0, x - step);
    const x2 = Math.min(span, x + step);
    return (getCableY(x2, riderX, riderWeightKg) - getCableY(x1, riderX, riderWeightKg)) / (x2 - x1);
  };

  const getCurvatureRadius = (x: number, riderWeightKg: number) => {
    const P = (riderWeightKg + 2) * g;
    const K = q / (2 * adjustedTensionNewtons) + P / (adjustedTensionNewtons * span);
    const yPrime = -drop / span - K * (span - 2 * x);
    const yDoublePrime = 2 * K;
    return Math.abs(Math.pow(1 + yPrime * yPrime, 1.5) / Math.max(yDoublePrime, 1e-9));
  };

  // 1. Static profiles (100 points)
  const numPoints = 100;
  const points: Point[] = [];
  const unloadedPoints: Point[] = [];
  let cableLength = 0;

  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * span;
    const y = getCableY(x, input.loadPositionX, input.riderMass);
    const yUnloaded = getCableY(x, 0, 0);
    points.push({ x, y });
    unloadedPoints.push({ x, y: yUnloaded });

    if (i > 0) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      cableLength += Math.sqrt(dx * dx + dy * dy);
    }
  }

  // 2. High-fidelity RK4 simulation of rider dynamics
  const simulateRider = (mRider: number, CdA: number, useWind: boolean) => {
    const mTotal = mRider + 2; // rider + 2kg equipment
    const N_steps = 300;
    const dx_sample = span / N_steps;
    
    const getAccel = (x: number, v: number): number => {
      const xc = Math.max(0, Math.min(x, span));
      const yp = getCableSlope(xc, xc, mRider); 
      const theta = Math.atan(yp);
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const R_curv = getCurvatureRadius(xc, mRider);

      const Fg = mTotal * g * sinT;
      const Fcentripetal = mTotal * v * v / R_curv;
      const Fnormal = mTotal * g * Math.abs(cosT) + Fcentripetal;

      const mu_rolling = sheaveFriction < 0.08 ? 0.001 : 0.002;
      const mu_bearing_loss = 0.002 * (10 / Math.max(sheaveDiaAvgM * 1000, 5));
      const Froll = (mu_rolling + mu_bearing_loss) * Fnormal;
      const Feta = (1 - eta) * Math.abs(Fg);
      const wrapAngle = Math.min(Fnormal / Math.max(adjustedTensionNewtons, 500), 0.1);
      const Fwrap = mu_rolling * wrapAngle * Fnormal;

      let Fd_rider = 0;
      if (useWind) {
        const Vrel_along = v + headwind;
        const Vrel_total = Math.sqrt(Vrel_along * Vrel_along + crosswind * crosswind);
        Fd_rider = 0.5 * rho * CdA * Vrel_total * Vrel_along;
      } else {
        Fd_rider = 0.5 * rho * CdA * v * v;
      }

      const Fvibration = c_damp * v * 0.05;
      const vSign = v > 0.001 ? 1 : (v < -0.001 ? -1 : 0);
      const F_resist = (Froll + Feta + Fwrap + Fvibration) * vSign + Fd_rider;

      return (Fg - F_resist) / mTotal;
    };

    const pts: Point[] = [{ x: 0, y: getCableY(0, 0, mRider), v: 0, t: 0 }];
    let x = 0, v = 0, t = 0;
    const dt = 0.005, maxIter = 100000;
    let iter = 0;

    while (x < span && iter < maxIter) {
      iter++;
      const k1v = getAccel(x, v); const k1x = Math.max(v, 0);
      const k2v = getAccel(x + 0.5 * dt * k1x, Math.max(v + 0.5 * dt * k1v, 0)); const k2x = Math.max(v + 0.5 * dt * k1v, 0);
      const k3v = getAccel(x + 0.5 * dt * k2x, Math.max(v + 0.5 * dt * k2v, 0)); const k3x = Math.max(v + 0.5 * dt * k2v, 0);
      const k4v = getAccel(x + dt * k3x, Math.max(v + dt * k3v, 0)); const k4x = Math.max(v + dt * k3v, 0);
      v = Math.max(v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v), 0);
      x = Math.max(x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x), x);
      t += dt;
      if (v <= 0.001 && t > 2) {
        pts.push({ x, y: getCableY(x, x, mRider), v: 0, t, stopped: true });
        break;
      }
      const lp = pts[pts.length - 1];
      if (x - lp.x >= dx_sample || x >= span) {
        pts.push({ x: Math.min(x, span), y: getCableY(Math.min(x, span), Math.min(x, span), mRider), v, t });
      }
    }
    const lp = pts[pts.length - 1];
    if (lp.x < span && !lp.stopped) {
      pts.push({ x: span, y: getCableY(span, span, mRider), v: lp.v, t: lp.t });
    }
    return pts;
  };

  // Run simulations
  const travelProfile = simulateRider(input.riderMass, input.dragArea, true);
  const ptsNW = simulateRider(input.riderMass, input.dragArea, false);
  const ptsW40 = simulateRider(40, 0.4, true); 
  const ptsW120 = simulateRider(120, 0.8, true); 

  // Aero-only: gravity + drag, NO friction
  const ptsAero = (() => {
    const m = input.riderMass + 2, CdA = input.dragArea;
    const getAccelAero = (x: number, v: number) => {
      const xc = Math.max(0, Math.min(x, span));
      const yp = getCableSlope(xc, xc, input.riderMass);
      const theta = Math.atan(yp);
      const Fg = m * g * Math.sin(theta);
      const Fd = 0.5 * rho * CdA * v * v;
      return (Fg - (v > 0.001 ? Fd : 0)) / m;
    };
    const pts: Point[] = [{ x: 0, y: getCableY(0, 0, input.riderMass), v: 0, t: 0 }];
    let x = 0, v = 0, t = 0, dt = 0.005, iter = 0;
    while (x < span && iter < 100000) {
      iter++;
      const k1v = getAccelAero(x, v); const k1x = Math.max(v, 0);
      const k2v = getAccelAero(x + 0.5 * dt * k1x, Math.max(v + 0.5 * dt * k1v, 0)); const k2x = Math.max(v + 0.5 * dt * k1v, 0);
      const k3v = getAccelAero(x + 0.5 * dt * k2x, Math.max(v + 0.5 * dt * k2v, 0)); const k3x = Math.max(v + 0.5 * dt * k2v, 0);
      const k4v = getAccelAero(x + dt * k3x, Math.max(v + dt * k3v, 0)); const k4x = Math.max(v + dt * k3v, 0);
      v = Math.max(v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v), 0);
      x = Math.max(x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x), x);
      t += dt;
      if (v <= 0.001 && t > 2) break;
      const lp = pts[pts.length - 1];
      if (x - lp.x >= (span / 300) || x >= span) pts.push({ x: Math.min(x, span), y: getCableY(Math.min(x, span), Math.min(x, span), input.riderMass), v, t });
    }
    return pts;
  })();

  // Ideal: gravity ONLY
  const ptsIdeal = (() => {
    const getAccelIdeal = (x: number) => {
      const xc = Math.max(0, Math.min(x, span));
      const yp = getCableSlope(xc, xc, input.riderMass);
      return g * Math.sin(Math.atan(yp));
    };
    const pts: Point[] = [{ x: 0, y: getCableY(0, 0, input.riderMass), v: 0, t: 0 }];
    let x = 0, v = 0, t = 0, dt = 0.005, iter = 0;
    while (x < span && iter < 100000) {
      iter++;
      const k1v = getAccelIdeal(x); const k1x = Math.max(v, 0);
      const k2v = getAccelIdeal(x + 0.5 * dt * k1x); const k2x = Math.max(v + 0.5 * dt * k1v, 0);
      const k3v = getAccelIdeal(x + 0.5 * dt * k2x); const k3x = Math.max(v + 0.5 * dt * k2v, 0);
      const k4v = getAccelIdeal(x + dt * k3x); const k4x = Math.max(v + dt * k3v, 0);
      v = Math.max(v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v), 0);
      x = Math.max(x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x), x);
      t += dt;
      const lp = pts[pts.length - 1];
      if (x - lp.x >= (span / 300) || x >= span) pts.push({ x: Math.min(x, span), y: getCableY(Math.min(x, span), Math.min(x, span), input.riderMass), v, t });
    }
    return pts;
  })();

  const maxV = Math.max(...travelProfile.map(p => p.v || 0));
  const maxVNW = Math.max(...ptsNW.map(p => p.v || 0));
  const finishV = travelProfile[travelProfile.length - 1].stopped ? 0 : (travelProfile[travelProfile.length - 1].v || 0);
  const finishVNW = ptsNW[ptsNW.length - 1].stopped ? 0 : (ptsNW[ptsNW.length - 1].v || 0);
  
  let totalTime = travelProfile[travelProfile.length - 1].t || 0;
  let totalTimeNoWind = ptsNW[ptsNW.length - 1].t || 0;
  
  let distSum = 0, vdSum = 0;
  for (let i = 0; i < travelProfile.length - 1; i++) {
    const dxi = travelProfile[i + 1].x - travelProfile[i].x;
    const vAvg = ((travelProfile[i].v || 0) + (travelProfile[i + 1].v || 0)) / 2;
    distSum += dxi; vdSum += vAvg * dxi;
  }
  const avgSpeed = distSum > 0 ? vdSum / distSum : 0;

  let maxVx = 0;
  for (const p of travelProfile) { if ((p.v || 0) >= maxV - 0.01) { maxVx = p.x; break; } }

  const Rh = adjustedTensionNewtons;
  const slopeStart = getCableSlope(0.01, input.loadPositionX, input.riderMass);
  const slopeEnd = getCableSlope(span - 0.01, input.loadPositionX, input.riderMass);
  const angleStart = Math.atan(slopeStart);
  const angleEnd = Math.atan(-slopeEnd);

  const reactions = {
    start: { horizontal: Rh / g, vertical: Math.abs(Rh * Math.tan(angleStart)) / g },
    end: { horizontal: Rh / g, vertical: Math.abs(Rh * Math.tan(angleEnd)) / g }
  };

  const maxTensionNewtons = Math.max(Rh / Math.cos(angleStart), Rh / Math.cos(angleEnd));
  const safetyFactor = (input.ropeBreakingLoadKn * 1000) / Math.max(maxTensionNewtons, 1);

  return {
    points, unloadedPoints, travelProfile, ptsNW, ptsW40, ptsW120, ptsAero, ptsIdeal,
    reactions, maxTensionNewtons, safetyFactor, cableLength,
    maxSpeed: maxV, maxSpeedNoWind: maxVNW, finishSpeed: finishV, finishSpeedNoWind: finishVNW,
    avgSpeed, totalTime, totalTimeNoWind, maxVx
  };
};
