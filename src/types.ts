export interface Teacher {
  nama: string;
  mapel_utama: string;
  rumpun: string;
  jenjang: string;
  tugas_tambahan: string;
  keterangan: string;
  wali_kelas?: string | null;
  pendamping_kelas?: string | null;
  is_manajemen?: boolean;
}

export interface ScheduleItem {
  id: string;
  kelas: string;
  hari: string;
  jam_ke: number;
  mulai: string;
  selesai: string;
  mapel: string;
  guru1: string;
  guru2: string;
  guru3: string;
  guru4: string;
  guru5: string;
  guru6: string;
  kelasgabung: string;
  ruangan?: string;
}

export interface LogIzinItem {
  id: string;
  tanggal: string; // YYYY-MM-DD
  guru_izin: string;
  alasan: string;
  jam_ke: number; // Single hour (1-6)
  kelas: string;
  mapel: string;
  guru_pengganti: string; // Name of replacement
  created_at?: string;
}

export interface AdminAccount {
  id: string;
  password: string;
  nama: string;
}

export type ActivePage = 
  | "dashboard"
  | "jadwal-lengkap"
  | "list-mapel"
  | "jam-kosong-individu"
  | "jam-kosong-semua"
  | "input-pengganti"
  | "log-pengganti"
  | "statistik";

export interface DBState {
  teachers: Teacher[];
  schedules: ScheduleItem[];
  logs: LogIzinItem[];
  apiUrl: string; // Configured Google Apps Script API URL
  apiConnected: boolean; // Is it currently fetching from the custom API
}

export function normalizeDay(day: string): "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | string {
  if (!day) return "";
  const d = day.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (d === "senin" || d === "monday") return "Senin";
  if (d === "selasa" || d === "tuesday") return "Selasa";
  if (d === "rabu" || d === "wednesday") return "Rabu";
  if (d === "kamis" || d === "thursday") return "Kamis";
  if (d === "jumat" || d === "jum'at" || d === "friday") return "Jumat";
  return day.trim();
}

export function isSameDay(dayA: string, dayB: string): boolean {
  return normalizeDay(dayA) === normalizeDay(dayB);
}


