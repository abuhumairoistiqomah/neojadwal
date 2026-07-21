export interface Teacher {
  nama: string;
  panggilan?: string | null;
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
  selainguru1_mengawas?: string;
  keterangan_khusus?: string;
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
  | "jadwal-kelas"
  | "list-mapel"
  | "jam-kosong-individu"
  | "jam-kosong-semua"
  | "tabel-jam-kosong"
  | "input-pengganti"
  | "log-pengganti"
  | "statistik"
  | "rekap-guru";

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

export function checkIsITBA(teacher: Teacher | undefined): boolean {
  if (!teacher) return false;
  const name = (teacher.nama || "").toUpperCase();
  const tugas = (teacher.tugas_tambahan || "").toUpperCase();
  const ket = (teacher.keterangan || "").toUpperCase();
  const mapel = (teacher.mapel_utama || "").toUpperCase();
  return (
    name.includes("ITBA") || 
    tugas.includes("ITBA") || 
    ket.includes("ITBA") ||
    mapel.includes("ITBA") ||
    name.includes("KHOLID") ||
    name.includes("HARIYADI")
  );
}

export function isITBACoreSubject(mapelName: string, teacherName?: string): boolean {
  if (!mapelName) return false;
  const sName = mapelName.trim().toLowerCase();
  
  // Arabic & Qur'an core subjects
  const isCoreQuranyOrArabic = 
    sName.includes("qur'an") || 
    sName.includes("quran") || 
    sName.includes("tahsin") || 
    sName.includes("tajwid") ||
    sName.includes("tahfidz") ||
    sName.includes("tahfizh") ||
    sName.includes("tahfid") ||
    sName.includes("tilawah") ||
    sName.includes("murottal") ||
    sName.includes("arabic") ||
    sName.includes("bahasa arab") ||
    sName.includes("arab") ||
    sName.includes("b. arab") ||
    sName.includes("b.arab");

  if (isCoreQuranyOrArabic) return true;

  // PE for Kholid or Hariyadi
  if (teacherName) {
    const tUpper = teacherName.toUpperCase();
    const isKholidOrHariyadiq = 
      tUpper.includes("KHOLID") || 
      tUpper.includes("HARIYADIQ") ||
      tUpper.includes("HARIYADI");
    
    if (isKholidOrHariyadiq) {
      const isPE = 
        sName.includes("pe") || 
        sName.includes("pjok") || 
        sName.includes("penjas") || 
        sName.includes("olahraga") ||
        sName.includes("physical");
      if (isPE) return true;
    }
  }

  return false;
}

export function isClassMatch(classField: string | null | undefined, targetClass: string): boolean {
  if (!classField) return false;
  const targetClean = targetClass.trim().toLowerCase();
  if (!targetClean) return false;

  // Split by common delimiters: comma, semicolon, slash, vertical bar, or newline
  const parts = classField.split(/[;,/|\n]+/).map(p => p.trim().toLowerCase());
  
  return parts.some(part => {
    const pClean = part.trim();
    if (pClean === targetClean) return true;
    
    // Normalize consecutive spaces to single spaces
    const normalizedPart = pClean.replace(/\s+/g, ' ');
    const normalizedTarget = targetClean.replace(/\s+/g, ' ');
    return normalizedPart === normalizedTarget;
  });
}



