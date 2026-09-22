import { FeedstockConfig, FeedstockType, ChemicalState, FacilityState } from '../types';

export const FEEDSTOCKS: Record<FeedstockType, FeedstockConfig> = {
  slaked_lime: {
    id: 'slaked_lime',
    name: 'Calcium Hydroxide (Slaked Lime)',
    chemicalFormula: 'Ca(OH)₂',
    dissolutionRate: 0.95, // Rapid kinetic dissolution
    co2DrawdownRatio: 1.65, // ~1.65 - 1.8 mol CO2 per mol Ca(OH)2
    solubilityLimit: 1.73, // g/L at 20°C
    slurryDensity: 1120, // kg/m^3
    color: '#10b981', // Emerald green LED
    description: 'Ultrafine aqueous suspension. High dissolution kinetics, immediate alkalinity generation with low residue.',
  },
  brucite: {
    id: 'brucite',
    name: 'Magnesium Hydroxide (Brucite)',
    chemicalFormula: 'Mg(OH)₂',
    dissolutionRate: 0.65,
    co2DrawdownRatio: 1.82,
    solubilityLimit: 0.009, // g/L
    slurryDensity: 1250,
    color: '#06b6d4', // Cyan
    description: 'Slower, buffering dissolution with lower risk of runaway local pH spikes. High thermodynamic yield.',
  },
  olivine: {
    id: 'olivine',
    name: 'Milled Forsteritic Olivine',
    chemicalFormula: 'Mg₂SiO₄',
    dissolutionRate: 0.35,
    co2DrawdownRatio: 3.35, // 4 eq per mol
    solubilityLimit: 0.015,
    slurryDensity: 1400,
    color: '#84cc16', // Lime green
    description: 'Abundant natural ultramafic mineral. High theoretical CO2 capacity, release of beneficial silicate for diatoms.',
  },
  sodium_bicarbonate: {
    id: 'sodium_bicarbonate',
    name: 'Enriched Sodium Bicarbonate Buffer',
    chemicalFormula: 'NaHCO₃ / Na₂CO₃',
    dissolutionRate: 0.99,
    co2DrawdownRatio: 0.92,
    solubilityLimit: 96.0,
    slurryDensity: 1100,
    color: '#3b82f6', // Cobalt
    description: 'Completely soluble synthetic buffer used for precision calibration and baseline sensitivity tests.',
  },
};

/**
 * Calculates updated geochemical state based on dosing input, seawater flow, and air-sea equilibration
 */
export function calculateGeochemistry(
  prevState: ChemicalState,
  facility: FacilityState,
  feedstock: FeedstockConfig,
  totalActiveDosingKgHr: number,
  deltaSeconds: number,
  simSpeedMultiplier: number
): ChemicalState {
  const dt = (deltaSeconds * simSpeedMultiplier) / 3600; // in hours

  // Basin volume estimated at 20m x 15m x 3.5m = 1050 m^3 ≈ 1,076,000 kg seawater (density ~1025 kg/m^3)
  const basinMassKg = 1076000;
  
  // Baseline typical seawater values
  const BASELINE_TA = 2320; // umol/kg
  const BASELINE_PCO2 = 418; // uatm (atmospheric baseline)
  const BASELINE_PH = 8.12;

  // Mineral molar weights (approx)
  // Ca(OH)2: 74.09 g/mol, provides 2 eq TA
  // Mg(OH)2: 58.32 g/mol, provides 2 eq TA
  // Mg2SiO4: 140.69 g/mol, provides 4 eq TA
  // NaHCO3: 84.0 g/mol, provides 1 eq TA
  let eqPerKg = 0;
  switch (feedstock.id) {
    case 'slaked_lime':
      eqPerKg = (1000 / 74.09) * 2; // ~27.0 eq/kg
      break;
    case 'brucite':
      eqPerKg = (1000 / 58.32) * 2; // ~34.3 eq/kg
      break;
    case 'olivine':
      eqPerKg = (1000 / 140.69) * 4; // ~28.4 eq/kg
      break;
    case 'sodium_bicarbonate':
      eqPerKg = (1000 / 84.0) * 1; // ~11.9 eq/kg
      break;
  }

  // Active dosing addition rate
  const dissolvedAlkalinityEqHr = totalActiveDosingKgHr * eqPerKg * feedstock.dissolutionRate;
  
  // Seawater flush effect: turnover removes enriched water and brings in baseline seawater
  const turnoverFractionPerHour = Math.max(0.01, facility.intakeFlowM3PerHour / 1050);

  // Delta Alkalinity calculation (umol / kg)
  const alkalinityAdditionUmolKgHr = (dissolvedAlkalinityEqHr * 1e6) / basinMassKg;
  
  // Dynamic relaxation towards steady state:
  // dTA/dt = Addition - turnover * (TA - BaselineTA)
  const dTA = (alkalinityAdditionUmolKgHr - turnoverFractionPerHour * (prevState.totalAlkalinity - BASELINE_TA)) * dt;
  const newTA = Math.max(BASELINE_TA, prevState.totalAlkalinity + dTA);

  // Estimate pH from Total Alkalinity shift:
  // ΔpH ≈ 0.8 * (ΔTA / BASELINE_TA) (calibrated carbonate system approximation for typical seawater buffer factor)
  const deltaTA_ratio = (newTA - BASELINE_TA) / BASELINE_TA;
  const targetPH = BASELINE_PH + 0.95 * Math.log10(1 + 4.2 * deltaTA_ratio);
  
  // Smooth pH transition
  const newPH = prevState.pH + (targetPH - prevState.pH) * Math.min(1, dt * 10);

  // CO2 drawdown and pCO2 reduction
  // As alkalinity increases and pH rises, aqueous CO2 shifts to bicarbonate/carbonate:
  // pCO2 drops significantly in the localized plume, pulling CO2 from air
  const pCO2_ratio = Math.max(0.2, 1.0 - 0.7 * (newPH - BASELINE_PH));
  const newPCO2 = Math.max(90, BASELINE_PCO2 * pCO2_ratio);

  // Aragonite saturation state:
  // Baseline seawater Omega_arag ~ 2.6. As pH and [CO3(2-)] rise, Omega increases.
  // Critical runaway precipitation occurs if Omega > 4.5
  const newOmega = 2.6 + 3.2 * (newPH - BASELINE_PH) * 1.8;
  
  let precipitationRisk: 'none' | 'moderate' | 'critical' = 'none';
  if (newOmega >= 4.8 || newPH >= 8.85) {
    precipitationRisk = 'critical';
  } else if (newOmega >= 3.9 || newPH >= 8.55) {
    precipitationRisk = 'moderate';
  }

  // Carbonate speciation approximation (% distribution of DIC)
  // At normal pH 8.1: ~89% HCO3-, ~10.5% CO3(2-), ~0.5% CO2(aq)
  // At higher pH 8.5: ~80% HCO3-, ~19.5% CO3(2-), ~0.1% CO2(aq)
  const phOffset = newPH - BASELINE_PH;
  const carbFrac = Math.min(35, Math.max(5, 10.5 + phOffset * 22));
  const co2Frac = Math.max(0.05, 0.5 - phOffset * 0.9);
  const bicarbFrac = 100 - carbFrac - co2Frac;

  // Dissolved Inorganic Carbon (DIC)
  const newDIC = 2050 + (newTA - BASELINE_TA) * 0.82;

  // Sequestration rate in metric tons of CO2 per day:
  // 1 eq of Alkalinity sequester ~0.8 to 0.85 mol of CO2 once fully air-equilibrated.
  // 1 mol CO2 = 44.01 g = 0.04401 kg
  const activeEqPerDay = dissolvedAlkalinityEqHr * 24;
  const kgCO2PerDay = activeEqPerDay * 0.82 * 0.04401;
  const sequestrationRateTonsPerDay = kgCO2PerDay / 1000;

  // Cumulative sequestered
  const newCumulativeKg = prevState.cumulativeCO2SequesteredKg + (kgCO2PerDay / 24) * dt;

  return {
    ...prevState,
    pH: Number(newPH.toFixed(3)),
    totalAlkalinity: Math.round(newTA),
    pCO2: Math.round(newPCO2),
    dic: Math.round(newDIC),
    aragoniteSaturation: Number(newOmega.toFixed(2)),
    cumulativeCO2SequesteredKg: Number(newCumulativeKg.toFixed(2)),
    sequestrationRateTonsPerDay: Number(sequestrationRateTonsPerDay.toFixed(3)),
    carbonateFraction: Number(carbFrac.toFixed(1)),
    bicarbonateFraction: Number(bicarbFrac.toFixed(1)),
    aqueousCO2Fraction: Number(co2Frac.toFixed(2)),
    precipitationRisk,
  };
}
