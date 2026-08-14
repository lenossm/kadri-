const GEL = new Intl.NumberFormat('en-US');

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(iso) {
  if (!iso) return 'TBD';
  const d = parseIso(iso);
  if (!d) return String(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(iso) {
  if (!iso) return 'TBD';
  const d = parseIso(iso);
  if (!d) return String(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '₾0';
  return `₾${GEL.format(Math.round(n))}`;
}

export function formatTime(seconds) {
  const n = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function parseIso(iso) {
  if (!iso) return null;
  const d = new Date(String(iso).length <= 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isPastDue(iso) {
  const d = parseIso(iso);
  if (!d) return false;
  const today = parseIso(todayIso());
  return d < today;
}

export function relativeDay(iso) {
  const d = parseIso(iso);
  const today = parseIso(todayIso());
  if (!d || !today) return formatDateShort(iso);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 8) return `In ${diff} days`;
  if (diff < 0 && diff > -8) return `${Math.abs(diff)} days ago`;
  return formatDateShort(iso);
}

export function slugify(value) {
  return String(value || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'item';
}

export function parseBudget(value) {
  const n = Number(String(value ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}
