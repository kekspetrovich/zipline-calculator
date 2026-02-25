/**
 * Physics utilities for Zipline calculations
 */

export interface Point {
  x: number;
  y: number;
  speed?: number; // km/h
}

export interface ZiplineResults {
  points: Point[]; // Static profile with load at fixed position
  travelProfile: Point[]; // Profile as if person is moving (for speed graph)
  reactions: {
    start: { horizontal: number; vertical: number };
    end: { horizontal: number; vertical: number };
  };
  maxTensionNewtons: number;
  cableLength: number;
}

/**
 * Calculates the optimal tension for a given span.
 * Professional target: Aim for a specific total sag when a 120kg load is at the center.
 * This ensures the line is pre-tensioned enough to handle real-world use.
 */
export const calculateOptimalTension = (span: number, ropeWeight: number, targetSagRatio: number = 0.02): number => {
  const g = 9.81;
  const q = ropeWeight * g;
  const P = 120 * g; // Target load: 120kg
  const targetSag = span * targetSagRatio;
  
  // Formula for tension with point load at center + cable weight:
  // Sag = (P*L)/(4*T) + (q*L^2)/(8*T)
  // => T = (P*L/4 + q*L^2/8) / Sag
  const tensionN = ( (P * span) / 4 + (q * Math.pow(span, 2)) / 8 ) / targetSag;
  return tensionN / g; // Return in kg
};

/**
 * Calculates the sag, speed and anchor reactions of a zipline.
 */
export const calculateZiplineCurve = (
  span: number,
  hStart: number,
  hEnd: number,
  ropeWeightPerMeter: number, // kg/m
  tensionKg: number,
  loadWeightKg: number = 0,
  loadPositionX: number = 0, // 0 to span
  temperature: number = 20, // Celsius
  equipmentWeightKg: number = 2, // Weight of trolley/carabiners
  dragArea: number = 0.5, // Cd * A (m^2)
  numPoints: number = 100
): ZiplineResults => {
  const g = 9.81;
  const rho = 1.225; // Air density at sea level (kg/m^3)
  const alpha = 12e-6;
  const tRef = 20;
  const deltaT = temperature - tRef;
  const adjustedTensionNewtons = (tensionKg * g) * (1 - alpha * deltaT * 100); 

  const q = ropeWeightPerMeter * g; 
  const totalLoadKg = loadWeightKg + (loadWeightKg > 0 ? equipmentWeightKg : 0);
  const P = totalLoadKg * g; 
  const H = hStart - hEnd;
  const slope = H / span;

  const getPointAt = (x: number, currentLoadX: number) => {
    const yStraight = hStart - (x / span) * H;
    const ySagRope = (q * x * (span - x)) / (2 * adjustedTensionNewtons);
    
    let ySagLoad = 0;
    if (P > 0) {
      const a = currentLoadX;
      const b = span - currentLoadX;
      if (x <= a) {
        ySagLoad = (P * b * x) / (adjustedTensionNewtons * span);
      } else {
        ySagLoad = (P * a * (span - x)) / (adjustedTensionNewtons * span);
      }
    }
    return yStraight - ySagRope - ySagLoad;
  };

  // 1. Static points (load at fixed position)
  const points: Point[] = [];
  let cableLength = 0;
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * span;
    const y = getPointAt(x, loadPositionX);
    points.push({ x, y });
    
    if (i > 0) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      cableLength += Math.sqrt(dx * dx + dy * dy);
    }
  }

  // 2. Travel profile (speed calculation with numerical integration)
  const travelProfile: Point[] = [];
  let currentV = 0; // m/s
  const dx = span / numPoints;
  const rollingFrictionCoeff = 0.02; // Typical for pulley on steel

  for (let i = 0; i <= numPoints; i++) {
    const x = i * dx;
    const yAtX = getPointAt(x, x);
    
    if (i > 0) {
      const prevX = (i - 1) * dx;
      const prevY = travelProfile[i - 1].y;
      const dy = yAtX - prevY;
      const ds = Math.sqrt(dx * dx + dy * dy);
      const sinTheta = -dy / ds; // Positive for downhill
      const cosTheta = dx / ds;

      // Forces
      const Fg = totalLoadKg * g * sinTheta;
      const Fdrag = 0.5 * rho * currentV * currentV * dragArea;
      const Ffriction = rollingFrictionCoeff * totalLoadKg * g * cosTheta;
      
      const Fnet = Fg - Fdrag - Ffriction;
      const acceleration = Fnet / totalLoadKg;

      // Update velocity: v^2 = v0^2 + 2*a*ds
      currentV = Math.sqrt(Math.max(0, currentV * currentV + 2 * acceleration * ds));
    }

    travelProfile.push({ x, y: yAtX, speed: currentV * 3.6 });
  }

  // Calculate reactions at anchors
  const Rh = adjustedTensionNewtons;
  const angleStart = Math.atan(slope + (q * span) / (2 * Rh) + (P * (span - loadPositionX)) / (Rh * span));
  const angleEnd = Math.atan(slope - (q * span) / (2 * Rh) - (P * loadPositionX) / (Rh * span));

  return {
    points,
    travelProfile,
    reactions: {
      start: { horizontal: Rh / g, vertical: (Rh * Math.tan(angleStart)) / g },
      end: { horizontal: Rh / g, vertical: (Rh * Math.tan(angleEnd)) / g }
    },
    maxTensionNewtons: adjustedTensionNewtons / Math.cos(angleStart),
    cableLength
  };
};
