import { Teacher, ScheduleItem, LogIzinItem, AdminAccount } from "./types";

export const INITIAL_ACCOUNTS: AdminAccount[] = [
  { id: "admin", password: "admin", nama: "Administrator" },
  { id: "admin01", password: "321123", nama: "Istiqomah As Sayfullooh" }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    nama: "OSY BENU ISMAIL, S.Pd.",
    mapel_utama: "English",
    rumpun: "English",
    jenjang: "SD",
    tugas_tambahan: "Manajemen",
    keterangan: "",
    is_manajemen: true
  },
  {
    nama: "ISTIQOMAH ASY SAYFULLOH, M.Pd",
    mapel_utama: "Math",
    rumpun: "Math",
    jenjang: "SD",
    tugas_tambahan: "Manajemen",
    keterangan: "",
    is_manajemen: true
  },
  {
    nama: "MUHAMAD JAKI FARHANSYAH, S.H.",
    mapel_utama: "SKI, Akidah Akhlaq",
    rumpun: "Diniyah",
    jenjang: "SD",
    tugas_tambahan: "Manajemen",
    keterangan: "",
    is_manajemen: true
  },
  {
    nama: "HAFASH UBAIDILLAH, Lc., M.S.I.",
    mapel_utama: "Akidah",
    rumpun: "Diniyah",
    jenjang: "SMP",
    tugas_tambahan: "Manajemen",
    keterangan: "",
    is_manajemen: true
  },
  {
    nama: "ADJI HAERUN MUTAKIN, M.Pd",
    mapel_utama: "Arabic",
    rumpun: "Diniyah",
    jenjang: "SMP, SMA",
    tugas_tambahan: "Manajemen",
    keterangan: "",
    is_manajemen: true
  },
  {
    nama: "JAVIER NOVAL ATHALLAH, S.Si.",
    mapel_utama: "Math",
    rumpun: "Math",
    jenjang: "SD, SMA",
    tugas_tambahan: "Manajemen",
    keterangan: "",
    is_manajemen: true
  },
  {
    nama: "ENDANG IRAWAN, S.Pd",
    mapel_utama: "English",
    rumpun: "English",
    jenjang: "SMP, SMA",
    tugas_tambahan: "Manajemen",
    keterangan: "",
    is_manajemen: true
  },
  {
    nama: "MUHAMMAD RIJAL ABDURAHMAN, S.M.Gr.",
    mapel_utama: "Math, Tematik Indo",
    rumpun: "Math",
    jenjang: "SD",
    tugas_tambahan: "Wali kelas",
    keterangan: "01 INTER 1",
    wali_kelas: "01 INTER 1"
  },
  {
    nama: "HUDZAIFAH AZZAM, B.A.",
    mapel_utama: "SKI, Akidah Akhlaq, Fiqh, Akhlaq, Arabic",
    rumpun: "Diniyah",
    jenjang: "SD, SMP",
    tugas_tambahan: "Wali kelas",
    keterangan: "02 INTER 2",
    wali_kelas: "02 INTER 2"
  },
  {
    nama: "BINTANG PARAMITHA",
    mapel_utama: "English",
    rumpun: "English",
    jenjang: "SD",
    tugas_tambahan: "Wali kelas",
    keterangan: "01 INTER 4",
    wali_kelas: "01 INTER 4"
  }
];

export const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: "s1",
    kelas: "01 INTER 1",
    hari: "Senin",
    jam_ke: 1,
    mulai: "07:40",
    selesai: "08:40",
    mapel: "Al-Qur'an",
    guru1: "AHMAD ZAKI",
    guru2: "MR QUR'AN 1",
    guru3: "",
    guru4: "",
    guru5: "",
    guru6: "",
    kelasgabung: "Tidak"
  },
  {
    id: "s2",
    kelas: "01 INTER 1",
    hari: "Senin",
    jam_ke: 2,
    mulai: "08:40",
    selesai: "09:40",
    mapel: "Math",
    guru1: "MUHAMMAD RIJAL ABDURAHMAN, S.M.Gr.",
    guru2: "",
    guru3: "",
    guru4: "",
    guru5: "",
    guru6: "",
    kelasgabung: "Tidak"
  },
  {
    id: "s3",
    kelas: "01 INTER 1",
    hari: "Senin",
    jam_ke: 3,
    mulai: "10:00",
    selesai: "11:00",
    mapel: "English",
    guru1: "OSY BENU ISMAIL, S.Pd.",
    guru2: "",
    guru3: "",
    guru4: "",
    guru5: "",
    guru6: "",
    kelasgabung: "Tidak"
  },
  {
    id: "s4",
    kelas: "02 INTER 2",
    hari: "Senin",
    jam_ke: 1,
    mulai: "07:40",
    selesai: "08:40",
    mapel: "SKI",
    guru1: "HUDZAIFAH AZZAM, B.A.",
    guru2: "",
    guru3: "",
    guru4: "",
    guru5: "",
    guru6: "",
    kelasgabung: "Tidak"
  },
  {
    id: "s5",
    kelas: "02 INTER 2",
    hari: "Senin",
    jam_ke: 2,
    mulai: "08:40",
    selesai: "09:40",
    mapel: "Arabic",
    guru1: "ADJI HAERUN MUTAKIN, M.Pd",
    guru2: "",
    guru3: "",
    guru4: "",
    guru5: "",
    guru6: "",
    kelasgabung: "Tidak"
  },
  {
    id: "s6",
    kelas: "01 INTER 4",
    hari: "Senin",
    jam_ke: 1,
    mulai: "07:40",
    selesai: "08:40",
    mapel: "English",
    guru1: "BINTANG PARAMITHA",
    guru2: "",
    guru3: "",
    guru4: "",
    guru5: "",
    guru6: "",
    kelasgabung: "Tidak"
  },
  {
    id: "s7",
    kelas: "01 INTER 1",
    hari: "Selasa",
    jam_ke: 1,
    mulai: "07:40",
    selesai: "08:40",
    mapel: "Math",
    guru1: "ISTIQOMAH ASY SAYFULLOH, M.Pd",
    guru2: "",
    guru3: "",
    guru4: "",
    guru5: "",
    guru6: "",
    kelasgabung: "Tidak"
  }
];

export const INITIAL_LOGS: LogIzinItem[] = [
  {
    id: "log1",
    tanggal: "2026-07-06",
    guru_izin: "MUHAMMAD RIJAL ABDURAHMAN, S.M.Gr.",
    alasan: "Sakit (Flu berat)",
    jam_ke: 2,
    kelas: "01 INTER 1",
    mapel: "Math",
    guru_pengganti: "ISTIQOMAH ASY SAYFULLOH, M.Pd"
  }
];
