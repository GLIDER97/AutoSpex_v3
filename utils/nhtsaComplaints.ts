// Owner complaints filed with NHTSA (api.nhtsa.gov): what real owners of a
// given year/make/model have reported. Free, no key, browser-friendly.
import { componentName, nhtsaDate, nhtsaResults, resolveVehicle, splitComponents } from './nhtsa';

export interface Complaint {
  id: number;
  date: string; // YYYY-MM-DD, when the complaint was filed
  components: string[];
  summary: string;
  crash: boolean;
  fire: boolean;
  injuries: number;
  deaths: number;
}

export interface ComplaintSummary {
  make: string | null;
  models: string[];
  total: number;
  crashes: number;
  fires: number;
  injuries: number;
  /** Complaint counts per component category, largest first. */
  byComponent: { component: string; label: string; count: number }[];
  complaints: Complaint[];
}

interface NhtsaComplaint {
  odiNumber: number;
  dateComplaintFiled: string; // MM/DD/YYYY
  components: string;
  summary: string;
  crash: boolean;
  fire: boolean;
  numberOfInjuries: number;
  numberOfDeaths: number;
}

export async function searchComplaints(year: number, make: string, model: string): Promise<ComplaintSummary> {
  const vehicle = await resolveVehicle(year, make, model, 'c', 4);
  const empty: ComplaintSummary = {
    make: vehicle.make, models: vehicle.models, total: 0, crashes: 0, fires: 0, injuries: 0, byComponent: [], complaints: [],
  };
  if (!vehicle.make || !vehicle.models.length) return empty;

  const lists = await Promise.all(
    vehicle.models.map((m) =>
      nhtsaResults<NhtsaComplaint>(
        `/complaints/complaintsByVehicle?${new URLSearchParams({ make: vehicle.make!, model: m, modelYear: String(year) })}`,
      ),
    ),
  );
  const seen = new Set<number>();
  const complaints: Complaint[] = lists
    .flat()
    .filter((c) => !seen.has(c.odiNumber) && seen.add(c.odiNumber))
    .map((c) => ({
      id: c.odiNumber,
      date: nhtsaDate(c.dateComplaintFiled, 'mdy'),
      components: splitComponents(c.components),
      summary: (c.summary ?? '').trim(),
      crash: Boolean(c.crash),
      fire: Boolean(c.fire),
      injuries: Number(c.numberOfInjuries) || 0,
      deaths: Number(c.numberOfDeaths) || 0,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const counts = new Map<string, number>();
  for (const c of complaints) for (const comp of new Set(c.components)) counts.set(comp, (counts.get(comp) ?? 0) + 1);

  return {
    ...empty,
    total: complaints.length,
    crashes: complaints.filter((c) => c.crash).length,
    fires: complaints.filter((c) => c.fire).length,
    injuries: complaints.reduce((n, c) => n + c.injuries, 0),
    byComponent: [...counts.entries()]
      .map(([component, count]) => ({ component, label: componentName(component), count }))
      .sort((a, b) => b.count - a.count),
    complaints,
  };
}
