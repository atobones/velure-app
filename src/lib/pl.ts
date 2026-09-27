export function pieczatki(n: number): string {
  if (n === 1) return "pieczątka";
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && !(t >= 12 && t <= 14) ? "pieczątki" : "pieczątek";
}

export function kawy(n: number): string {
  if (n === 1) return "kawa";
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && !(t >= 12 && t <= 14) ? "kawy" : "kaw";
}

export function formatCard(n: string): string {
  return `${n.slice(0, 4)} ${n.slice(4)}`;
}

export function toDate(sqlUtc: string): Date {
  return new Date(sqlUtc.replace(" ", "T") + "Z");
}

export function hhmm(sqlUtc: string): string {
  return toDate(sqlUtc).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
}

export function ddmm(sqlUtc: string): string {
  return toDate(sqlUtc).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", timeZone: "Europe/Warsaw" });
}

export function greeting(): string {
  const h = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Warsaw" }));
  return h >= 18 || h < 4 ? "Dobry wieczór" : "Dzień dobry";
}
