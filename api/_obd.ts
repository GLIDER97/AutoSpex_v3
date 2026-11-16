// Official titles of the codes in the decoder's built-in list
// (data/obdCodes.ts), sent to the AI as reference definitions.
// tests/obd.test.ts checks that the two lists match.
export const OBD_TITLES: Record<string, string> = {
  P0101: 'Mass Air Flow (MAF) Circuit Range/Performance',
  P0106: 'Manifold Absolute Pressure (MAP) Barometric Pressure Circuit Range/Performance',
  P0113: 'Intake Air Temperature Sensor 1 Circuit High',
  P0118: 'Engine Coolant Temperature Sensor 1 Circuit High',
  P0122: 'Throttle Position Sensor A Circuit Low Input',
  P0128: 'Coolant Thermostat (Coolant Temp Below Regulating Temp)',
  P0135: 'O2 Sensor Heater Circuit (Bank 1 Sensor 1)',
  P0138: 'O2 Sensor Circuit High Voltage (Bank 1 Sensor 2)',
  P0141: 'O2 Sensor Heater Circuit (Bank 1 Sensor 2)',
  P0171: 'System Too Lean (Bank 1)',
  P0174: 'System Too Lean (Bank 2)',
  P0300: 'Random/Multiple Cylinder Misfire Detected',
  P0301: 'Cylinder 1 Misfire Detected',
  P0420: 'Catalyst System Efficiency Below Threshold (Bank 1)',
  P0440: 'Evaporative Emission Control System Malfunction',
  P0442: 'EVAP System Leak Detected (Small Leak)',
  P0455: 'EVAP System Leak Detected (Gross/Large Leak)',
  P0456: 'EVAP System Leak Detected (Very Small Leak)',
};
