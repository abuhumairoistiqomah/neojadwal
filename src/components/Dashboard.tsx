import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Teacher, ScheduleItem, LogIzinItem, ActivePage, JadwalInsidentalItem,
  isSameDay, checkIsITBA, isITBACoreSubject, isClassMatch, checkIsNative, isAlQuranOrTahsin,
  renderTaskWithLinks
} from "../types";
import { 
  Search, Calendar, BookOpen, Clock, Users, UserPlus, 
  History, BarChart2, Shield, User, ChevronRight, X, Table, ChevronDown, Bell, Eye, EyeOff, AlertTriangle 
} from "lucide-react";

export const JAM_TIME_MAP: Record<number, string> = {
  0: "07:00 - 07:30",
  1: "07:30 - 08:15",
  2: "08:15 - 09:00",
  3: "09:00 - 09:45",
  4: "10:15 - 11:00",
  5: "11:00 - 11:45",
  6: "11:45 - 12:30"
};

// Helper to check if Grade 1 or 2
export const isGrade1Or2 = (className: string): boolean => {
  if (!className) return false;
  const name = className.trim().toLowerCase();
  return /^(0?1|0?2)\b|^(0?1|0?2)[a-z]/i.test(name) || /class\s*(0?1|0?2)\b/i.test(name) || /grade\s*(0?1|0?2)\b/i.test(name) || /primary\s*(0?1|0?2)\b/i.test(name);
};

interface DashboardProps {
  teachers: Teacher[];
  schedules: ScheduleItem[];
  logs: LogIzinItem[];
  jadwalInsidental?: JadwalInsidentalItem[];
  selectedTeacher: string;
  setSelectedTeacher: (name: string) => void;
  isAdmin: boolean;
  setPage: (page: ActivePage) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  teachers,
  schedules,
  logs = [],
  jadwalInsidental = [],
  selectedTeacher,
  setSelectedTeacher,
  isAdmin,
  setPage,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDay, setSelectedDay] = useState<"Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat">("Senin");
  const [dashboardType, setDashboardType] = useState<"guru" | "wali-kelas">("guru");
  const [showNotifications, setShowNotifications] = useState<boolean>(true);
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    return localStorage.getItem("dashboard_selected_class") || "";
  });
  const [taskModalData, setTaskModalData] = useState<{
    isOpen: boolean;
    kelas: string;
    mapel: string;
    guru_izin: string;
    tugas: string;
  } | null>(null);

  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Compute all unique classes from schedules
  const classesList = useMemo(() => {
    const unique = new Set<string>();
    schedules.forEach(s => {
      if (s.kelas) {
        unique.add(s.kelas.trim());
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [schedules]);

  // Sync selectedClass with localStorage when it changes
  useEffect(() => {
    if (selectedClass) {
      localStorage.setItem("dashboard_selected_class", selectedClass);
    }
  }, [selectedClass]);

  // Set default class if not set or if current selected class is invalid
  useEffect(() => {
    if (classesList.length > 0) {
      const saved = localStorage.getItem("dashboard_selected_class");
      if (saved && classesList.includes(saved)) {
        setSelectedClass(saved);
      } else if (!selectedClass || !classesList.includes(selectedClass)) {
        setSelectedClass(classesList[0]);
      }
    }
  }, [classesList]);

  // Compute daily schedule for the selected class
  const classSchedulesToday = useMemo(() => {
    if (!selectedClass) return [];
    return schedules
      .filter(s => isSameDay(s.hari, selectedDay) && s.kelas && s.kelas.trim().toLowerCase() === selectedClass.trim().toLowerCase())
      .sort((a, b) => a.jam_ke - b.jam_ke);
  }, [schedules, selectedDay, selectedClass]);

  // Map daily class schedule to 1-6 periods
  const classTimetable = useMemo(() => {
    const periods = [1, 2, 3, 4, 5, 6];
    return periods.map(jamKe => {
      const items = classSchedulesToday.filter(s => s.jam_ke === jamKe);
      if (items.length === 0) {
        return {
          jam_ke: jamKe,
          isEmpty: true,
          mapel: "Jam Kosong / Mandiri / Istirahat",
          ruangan: "",
          keterangan_khusus: "",
          teachers: [] as string[],
          items: [] as ScheduleItem[]
        };
      }
      
      const mapel = [...new Set(items.map(i => i.mapel))].filter(Boolean).join(", ");
      const ruangan = [...new Set(items.map(i => i.ruangan || "").filter(Boolean))].join(", ");
      const keterangan_khusus = [...new Set(items.map(i => i.keterangan_khusus || "").filter(Boolean))].join(", ");
      
      const allTeachers: string[] = [];
      items.forEach(i => {
        [i.guru1, i.guru2, i.guru3, i.guru4, i.guru5, i.guru6].forEach(g => {
          if (g && g.trim() && !allTeachers.includes(g.trim())) {
            allTeachers.push(g.trim());
          }
        });
      });

      return {
        jam_ke: jamKe,
        isEmpty: false,
        mapel,
        ruangan,
        keterangan_khusus,
        teachers: allTeachers,
        items
      };
    });
  }, [classSchedulesToday]);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  // Automatically sync selectedDay when selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;
    const d = new Date(selectedDate);
    if (isNaN(d.getTime())) return;
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dayName = daysIndo[d.getDay()];
    if (["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].includes(dayName)) {
      setSelectedDay(dayName as any);
    } else {
      setSelectedDay("Senin"); // Default if weekend
    }
  }, [selectedDate]);

  // Helper to change both day and sync date to the current week's respective day
  const handleDaySelect = (dayName: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat") => {
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const targetIdx = daysIndo.indexOf(dayName);
    const today = new Date();
    const currentIdx = today.getDay();
    const diff = targetIdx - currentIdx;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dVal = String(targetDate.getDate()).padStart(2, "0");
    
    setSelectedDate(`${year}-${month}-${dVal}`);
    setSelectedDay(dayName);
  };

  // Sync searchQuery with selectedTeacher on load
  useEffect(() => {
    setSearchQuery(selectedTeacher);
  }, [selectedTeacher]);

  // Click outside listener for suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter teachers for autocomplete
  const filteredTeachers = searchQuery.trim() === ""
    ? []
    : teachers.filter(t => 
        t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.mapel_utama.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSelectTeacher = (teacherName: string) => {
    setSelectedTeacher(teacherName);
    setSearchQuery(teacherName);
    setShowSuggestions(false);
  };

  const clearSelection = () => {
    setSelectedTeacher("");
    setSearchQuery("");
  };

  // Find current teacher details
  const currentTeacherObj = teachers.find(t => t.nama === selectedTeacher);
  const isNativeTeacher = useMemo(() => checkIsNative(currentTeacherObj), [currentTeacherObj]);

  // 1. Get incidentals for selected date
  const todaysIncidentals = useMemo(() => {
    if (!jadwalInsidental) return [];
    return jadwalInsidental.filter(inc => inc.tanggal === selectedDate);
  }, [jadwalInsidental, selectedDate]);

  // 2. Process master schedules for selected day with Jadwal_Insidental override
  const processedMasterSchedulesForDay = useMemo(() => {
    const daySchedules = schedules.filter(s => isSameDay(s.hari, selectedDay));

    return daySchedules.map(s => {
      // Find matching incidental item by kelas and jam_ke for selectedDate
      const incMatch = todaysIncidentals.find(inc => 
        inc.kelas && inc.kelas.trim().toLowerCase() === s.kelas.trim().toLowerCase() &&
        Number(inc.jam_ke) === Number(s.jam_ke)
      );

      if (incMatch) {
        // OVERRIDE: Timpa mapel dan guru1 s/d guru6
        return {
          ...s,
          mapel: incMatch.mapel || s.mapel,
          guru1: incMatch.guru1 !== undefined && incMatch.guru1 !== "" ? incMatch.guru1 : s.guru1,
          guru2: incMatch.guru2 !== undefined ? incMatch.guru2 : s.guru2,
          guru3: incMatch.guru3 !== undefined ? incMatch.guru3 : s.guru3,
          guru4: incMatch.guru4 !== undefined ? incMatch.guru4 : s.guru4,
          guru5: incMatch.guru5 !== undefined ? incMatch.guru5 : s.guru5,
          guru6: incMatch.guru6 !== undefined ? incMatch.guru6 : s.guru6,
          keterangan_khusus: incMatch.keterangan_khusus || s.keterangan_khusus,
          isOverridden: true,
          keterangan_insidental: incMatch.keterangan_khusus || "",
          alasan_insidental: incMatch.alasan || "",
          tipe_insidental: incMatch.tipe_insidental || ""
        };
      }

      return {
        ...s,
        isOverridden: false,
        keterangan_insidental: "",
        alasan_insidental: "",
        tipe_insidental: ""
      };
    });
  }, [schedules, selectedDay, todaysIncidentals]);

  // 3. Filter regular schedules for selected teacher
  const teacherRegularSchedules = useMemo(() => {
    if (!selectedTeacher) return [];

    const sTeacherLower = selectedTeacher.trim().toLowerCase();

    let filtered = processedMasterSchedulesForDay.filter(s => {
      const gurus = [s.guru1, s.guru2, s.guru3, s.guru4, s.guru5, s.guru6];
      return gurus.some(g => g && g.trim().toLowerCase() === sTeacherLower);
    });

    // Layer 2: Native Speaker / Syaikh Filtering
    if (isNativeTeacher) {
      filtered = filtered.filter(s => {
        const ketKhusus = (s.keterangan_khusus || "").toLowerCase();
        const isRoutineNative = ketKhusus.includes("native");
        const isIncidentalNative = s.isOverridden === true; // guru1-6 is already checked in filtered
        return isRoutineNative || isIncidentalNative;
      });
    }

    return filtered.sort((a, b) => Number(a.jam_ke) - Number(b.jam_ke));
  }, [processedMasterSchedulesForDay, selectedTeacher, isNativeTeacher]);

  // Group regular schedule items by jam_ke
  const groupedSchedules = useMemo(() => {
    const groups: Record<number, typeof teacherRegularSchedules> = {};
    teacherRegularSchedules.forEach(item => {
      if (!groups[item.jam_ke]) {
        groups[item.jam_ke] = [];
      }
      groups[item.jam_ke].push(item);
    });

    return Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b)
      .map(jamKe => {
        const items = groups[jamKe];
        const first = items[0];

        const mapel = [...new Set(items.map(i => i.mapel))].filter(Boolean).join(", ");
        const kelas = [...new Set(items.map(i => i.kelas))].filter(Boolean).join(", ");
        const ruangan = [...new Set(items.map(i => i.ruangan || "").filter(Boolean))].join(", ");
        const keterangan_khusus = [...new Set(items.map(i => i.keterangan_khusus || "").filter(Boolean))].join(", ");
        const keterangan_insidental = [...new Set(items.map(i => i.keterangan_insidental || "").filter(Boolean))].join(", ");
        const alasan_insidental = [...new Set(items.map(i => i.alasan_insidental || "").filter(Boolean))].join(", ");
        const tipe_insidental = [...new Set(items.map(i => i.tipe_insidental || "").filter(Boolean))].join(", ");
        const isOverridden = items.some(i => i.isOverridden);

        const isIya = items.some(i => {
          const kg = String(i.kelasgabung || "").trim().toLowerCase();
          return kg === "iya" || kg === "ya";
        });

        return {
          id: `merged-${jamKe}-${first.id}`,
          jam_ke: jamKe,
          mulai: first.mulai,
          selesai: first.selesai,
          mapel,
          kelas,
          ruangan,
          keterangan_khusus,
          keterangan_insidental,
          alasan_insidental,
          tipe_insidental,
          isOverridden,
          kelasgabung: isIya ? "Iya" : "Tidak",
          isConflict: items.length > 1,
          isInval: false,
          guru_izin: "",
          alasan: "",
          items
        };
      });
  }, [teacherRegularSchedules]);

  // Filter active logs (Tugas Inval) for the selected teacher on this date
  const activeInvalLogs = useMemo(() => {
    if (!selectedTeacher || !logs) return [];
    return logs.filter(log => 
      log.tanggal === selectedDate && 
      log.guru_pengganti && log.guru_pengganti.trim().toLowerCase() === selectedTeacher.trim().toLowerCase()
    );
  }, [logs, selectedDate, selectedTeacher]);

  const invalSchedules = useMemo(() => {
    return activeInvalLogs.map(log => {
      const matchingSched = processedMasterSchedulesForDay.find(s => 
        s.kelas && s.kelas.trim().toLowerCase() === log.kelas.trim().toLowerCase() && 
        Number(s.jam_ke) === Number(log.jam_ke)
      );

      return {
        id: `inval-${log.id}`,
        jam_ke: Number(log.jam_ke),
        mulai: matchingSched?.mulai || JAM_TIME_MAP[log.jam_ke]?.split(" - ")[0] || "",
        selesai: matchingSched?.selesai || JAM_TIME_MAP[log.jam_ke]?.split(" - ")[1] || "",
        mapel: log.mapel || matchingSched?.mapel || "",
        kelas: log.kelas,
        ruangan: matchingSched?.ruangan || "",
        keterangan_khusus: matchingSched?.keterangan_khusus || "",
        keterangan_insidental: matchingSched?.keterangan_insidental || "",
        alasan_insidental: matchingSched?.alasan_insidental || "",
        tipe_insidental: matchingSched?.tipe_insidental || "",
        isOverridden: false,
        kelasgabung: matchingSched?.kelasgabung || "Tidak",
        isConflict: false,
        isInval: true,
        guru_izin: log.guru_izin,
        alasan: log.alasan,
        tugas: log.tugas,
        items: matchingSched ? [matchingSched] : []
      };
    });
  }, [activeInvalLogs, processedMasterSchedulesForDay]);

  // Merge regular schedules and inval schedules with conflict handling (Inval vs Reguler)
  const mergedAllSchedules = useMemo(() => {
    const invalJamSet = new Set(invalSchedules.map(inv => inv.jam_ke));

    const regularWithConflictFlags = groupedSchedules.map(reg => {
      const hasInvalConflict = invalJamSet.has(reg.jam_ke);
      return {
        ...reg,
        isCancelledForInval: hasInvalConflict
      };
    });

    const invalWithFlags = invalSchedules.map(inv => ({
      ...inv,
      isCancelledForInval: false
    }));

    const combined = [...regularWithConflictFlags, ...invalWithFlags];

    return combined.sort((a, b) => {
      if (a.jam_ke !== b.jam_ke) {
        return a.jam_ke - b.jam_ke;
      }
      // If same jam_ke, show regular schedule (dibatalkan) first, then inval schedule
      if (a.isInval !== b.isInval) {
        return a.isInval ? 1 : -1;
      }
      return 0;
    });
  }, [groupedSchedules, invalSchedules]);

  // Extract Wali kelas class name
  const waliClass = useMemo(() => {
    if (!currentTeacherObj) return null;
    const tugas = (currentTeacherObj.tugas_tambahan || "").toLowerCase().trim();
    const ket = (currentTeacherObj.keterangan || "").trim();
    const wk = (currentTeacherObj.wali_kelas || "").trim();

    if (tugas.includes("wali") || wk) {
      if (ket && ket !== "-" && wk && !ket.toLowerCase().includes(wk.toLowerCase())) {
        return `${wk}, ${ket}`;
      }
      return wk || (ket !== "-" ? ket : null);
    }
    return wk || null;
  }, [currentTeacherObj]);

  // Filter logs for Wali kelas notification
  const waliLogsToday = useMemo(() => {
    if (!waliClass || !logs) return [];
    return logs
      .filter(log => 
        log.tanggal === selectedDate && 
        isClassMatch(log.kelas, waliClass)
      )
      .sort((a, b) => Number(a.jam_ke || 0) - Number(b.jam_ke || 0));
  }, [logs, selectedDate, waliClass]);

  // Extract Pendamping kelas class name
  const pendampingClass = useMemo(() => {
    if (!currentTeacherObj) return null;
    const tugas = (currentTeacherObj.tugas_tambahan || "").toLowerCase().trim();
    const ket = (currentTeacherObj.keterangan || "").trim();
    const pk = (currentTeacherObj.pendamping_kelas || "").trim();

    if (tugas.includes("pendamping") || pk) {
      if (ket && ket !== "-" && pk && !ket.toLowerCase().includes(pk.toLowerCase())) {
        return `${pk}, ${ket}`;
      }
      return pk || (ket !== "-" ? ket : null);
    }
    return pk || null;
  }, [currentTeacherObj]);

  // Filter logs for Pendamping kelas notification
  const pendampingLogsToday = useMemo(() => {
    if (!pendampingClass || !logs) return [];
    return logs
      .filter(log => 
        log.tanggal === selectedDate && 
        isClassMatch(log.kelas, pendampingClass)
      )
      .sort((a, b) => Number(a.jam_ke || 0) - Number(b.jam_ke || 0));
  }, [logs, selectedDate, pendampingClass]);

  return (
    <div className="space-y-6">
      {/* Dashboard Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex gap-2">
        <button
          id="tab-dashboard-guru"
          onClick={() => setDashboardType("guru")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            dashboardType === "guru"
              ? "bg-blue-600 text-white shadow-sm font-extrabold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <User className="w-5 h-5" />
          <span>Dashboard Guru</span>
        </button>
        <button
          id="tab-dashboard-wali-kelas"
          onClick={() => setDashboardType("wali-kelas")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            dashboardType === "wali-kelas"
              ? "bg-blue-600 text-white shadow-sm font-extrabold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Dashboard Wali Kelas</span>
        </button>
      </div>

      {/* Alert Banner Container for Wali Kelas & Pendamping Kelas with Hide/Show Toggle */}
      {selectedTeacher && (waliLogsToday.length > 0 || pendampingLogsToday.length > 0) && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5 sm:mt-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-2 flex-wrap">
                  <span>Warning Notifikasi Guru Ganti Hari Ini</span>
                  <span className="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full font-black">
                    {waliLogsToday.length + pendampingLogsToday.length} Informasi
                  </span>
                </h3>
                <p className="text-xs text-amber-800/90 font-medium mt-0.5">
                  Pengingat guru pengganti di kelas wali / dampingan Anda ({waliClass || pendampingClass})
                </p>
              </div>
            </div>

            <button
              id="btn-toggle-notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full sm:w-auto text-xs font-extrabold text-amber-950 bg-white hover:bg-amber-100 border border-amber-300 px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              {showNotifications ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-700" />
                  <span>Sembunyikan Warning</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-amber-700" />
                  <span>Tampilkan Warning ({waliLogsToday.length + pendampingLogsToday.length})</span>
                </>
              )}
            </button>
          </div>

          {showNotifications && (
            <div className="space-y-3 pt-2 border-t border-amber-200/60">
              {/* Alert for Wali Kelas */}
              {waliClass && waliLogsToday.length > 0 && (
                <div className="bg-white border-l-4 border-amber-500 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs mb-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="uppercase tracking-wider">INFO KELAS WALI ({waliClass}):</span>
                  </div>
                  <div className="text-slate-800 text-xs space-y-2">
                    {waliLogsToday.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 bg-amber-50/80 p-2.5 rounded-lg border border-amber-100">
                        <span className="leading-relaxed">
                          🔔 Kelas <strong>{log.kelas}</strong> (Jam ke-{log.jam_ke} - <em>{log.mapel}</em>): Guru utama <strong>{log.guru_izin}</strong> izin. Digantikan oleh <strong className="text-amber-950 underline decoration-amber-400 font-extrabold">{log.guru_pengganti || "Belum Ditentukan"}</strong>.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alert for Pendamping Kelas */}
              {pendampingClass && pendampingLogsToday.length > 0 && (
                <div className="bg-white border-l-4 border-indigo-500 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-indigo-950 font-extrabold text-xs mb-2.5">
                    <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="uppercase tracking-wider">INFO KELAS DAMPINGAN ({pendampingClass}):</span>
                  </div>
                  <div className="text-slate-800 text-xs space-y-2">
                    {pendampingLogsToday.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-100">
                        <span className="leading-relaxed">
                          🔔 Kelas <strong>{log.kelas}</strong> (Jam ke-{log.jam_ke} - <em>{log.mapel}</em>): Guru utama <strong>{log.guru_izin}</strong> izin. Digantikan oleh <strong className="text-indigo-950 underline decoration-indigo-400 font-extrabold">{log.guru_pengganti || "Belum Ditentukan"}</strong>.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {dashboardType === "guru" ? (
        <>
          {/* Teacher Search Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Pencarian Guru
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Masukkan nama guru untuk menampilkan jadwal mengajar hari ini, jadwal lengkap mingguan, jam kosong, dan list mata pelajaran.
            </p>
            
            <div className="relative" ref={suggestionsRef}>
              <div className="relative">
                <input
                  id="teacher-search-input"
                  type="text"
                  className="w-full pl-11 pr-10 py-3.5 bg-slate-50 hover:bg-slate-100/75 focus:bg-white text-slate-800 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-medium text-base shadow-sm"
                  placeholder="Cari Nama Guru atau Mata Pelajaran..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                {selectedTeacher && (
                  <button
                    id="clear-search-btn"
                    onClick={clearSelection}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                    title="Hapus pilihan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Autocomplete Suggestions */}
              {showSuggestions && filteredTeachers.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {filteredTeachers.map((teacher) => (
                    <button
                      key={teacher.nama}
                      id={`suggest-${teacher.nama.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => handleSelectTeacher(teacher.nama)}
                      className="w-full text-left px-5 py-3 hover:bg-blue-50/50 flex flex-col transition-colors group"
                    >
                      <span className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                        {teacher.nama}
                      </span>
                      <span className="text-xs text-slate-400 mt-0.5">
                        Mapel Utama: {teacher.mapel_utama} | Rumpun: {teacher.rumpun} | {teacher.jenjang}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions && searchQuery.trim() !== "" && filteredTeachers.length === 0 && (
                <div className="absolute z-30 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-5 text-center text-slate-500 text-sm">
                  Tidak menemukan guru dengan kata kunci "{searchQuery}"
                </div>
              )}
            </div>

            {/* Selected Teacher Status Card */}
            {currentTeacherObj && (
              <div className="mt-4 p-4 bg-blue-50/40 border border-blue-100/50 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {currentTeacherObj.nama[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{currentTeacherObj.nama}</h3>
                    <p className="text-xs text-slate-500">
                      {currentTeacherObj.mapel_utama} • {currentTeacherObj.jenjang} 
                      {currentTeacherObj.wali_kelas ? ` • Wali Kelas ${currentTeacherObj.wali_kelas}` : ""}
                      {currentTeacherObj.pendamping_kelas ? ` • Pendamping Kelas ${currentTeacherObj.pendamping_kelas}` : ""}
                      {currentTeacherObj.is_manajemen ? " • Tim Manajemen" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                  Guru Terpilih
                </div>
              </div>
            )}
          </div>

          {/* Today's Schedule (Timetable vertikal) */}
          {selectedTeacher ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Jadwal Hari Ini
                  </h2>
                  <p className="text-sm text-slate-500">
                    Menampilkan jadwal mengajar hari <span className="font-semibold text-blue-600">{selectedDay}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  {/* Date Picker */}
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tanggal:</span>
                    <input
                      id="dashboard-date-picker"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    />
                  </div>

                  {/* Day Switcher */}
                  <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl flex-1 sm:flex-initial">
                    {(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const).map((day) => (
                      <button
                        key={day}
                        id={`day-switch-${day}`}
                        onClick={() => handleDaySelect(day)}
                        className={`flex-1 sm:flex-initial text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                          selectedDay === day
                            ? "bg-white text-slate-900 shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Schedule List */}
              {mergedAllSchedules.length > 0 ? (
                <div className="relative border-l border-blue-100 pl-6 ml-3 space-y-6">
                  {mergedAllSchedules.map((item) => {
                    const isConflict = item.isConflict;
                    const isGabung = item.kelasgabung === "Iya";
                    
                    const isITBA = currentTeacherObj ? checkIsITBA(currentTeacherObj) : false;
                    const isPendampingSlot = !item.isInval && item.items.some(scItem => {
                      if (isAlQuranOrTahsin(scItem.mapel)) {
                        return false;
                      }
                      const isGuru1 = scItem.guru1 && scItem.guru1.trim().toLowerCase() === selectedTeacher.trim().toLowerCase();
                      if (isITBA) {
                        const sName = (scItem.mapel || "").trim().toLowerCase();
                        const isArabic = 
                          sName.includes("arabic") || 
                          sName.includes("bahasa arab") || 
                          sName.includes("arab") || 
                          sName.includes("b. arab") || 
                          sName.includes("b.arab");
                        if (isArabic) {
                          return !isGuru1;
                        }
                        return !isITBACoreSubject(scItem.mapel, selectedTeacher);
                      } else {
                        const isSupervisingCol = scItem.selainguru1_mengawas && (scItem.selainguru1_mengawas.trim().toLowerCase() === "yes" || scItem.selainguru1_mengawas.trim().toLowerCase() === "ya");
                        return !isGuru1 && isSupervisingCol;
                      }
                    });

                    let cardBgClass = "bg-blue-50 hover:bg-blue-100/60 border-blue-200 text-blue-950";
                    let badgeClass = "bg-blue-100 text-blue-900 border border-blue-200";
                    let dotClass = "bg-blue-500";
                    let labelText = "Kelas Tunggal";
                    let tagClass = "bg-blue-200/70 text-blue-900 border border-blue-300";

                    if (item.isCancelledForInval) {
                      cardBgClass = "bg-slate-100 hover:bg-slate-200/60 border-slate-300 text-slate-600 opacity-75 font-medium";
                      badgeClass = "bg-slate-200 text-slate-800 border border-slate-300 font-bold";
                      dotClass = "bg-slate-400";
                      labelText = "❌ Dibatalkan";
                      tagClass = "bg-red-100 text-red-800 font-extrabold border border-red-300";
                    } else if (item.isInval) {
                      cardBgClass = "bg-yellow-50 hover:bg-yellow-100/70 border-yellow-300 border-l-4 border-l-yellow-500 text-yellow-950 shadow-xs";
                      badgeClass = "bg-yellow-200 text-yellow-900 border border-yellow-300 font-bold";
                      dotClass = "bg-yellow-500";
                      labelText = "🚨 Tugas Inval";
                      tagClass = "bg-yellow-300/75 text-yellow-950 font-extrabold border border-yellow-400";
                    } else if (item.isOverridden) {
                      cardBgClass = "bg-indigo-50/90 hover:bg-indigo-100/70 border-indigo-200 border-l-4 border-l-indigo-500 text-indigo-950 shadow-xs";
                      badgeClass = "bg-indigo-200 text-indigo-900 border border-indigo-300 font-bold";
                      dotClass = "bg-indigo-600";
                      labelText = item.tipe_insidental ? `📍 ${item.tipe_insidental}` : "📍 Insidental";
                      tagClass = "bg-indigo-200/80 text-indigo-950 font-extrabold border border-indigo-300";
                    } else if (isPendampingSlot) {
                      cardBgClass = "bg-purple-50 hover:bg-purple-100/60 border-purple-300 border-2 text-purple-950";
                      badgeClass = "bg-purple-100 text-purple-900 border border-purple-200";
                      dotClass = "bg-purple-500";
                      labelText = "Pendamping";
                      tagClass = "bg-purple-200/70 text-purple-900 border border-purple-300";
                    } else if (isConflict) {
                      if (isGabung) {
                        cardBgClass = "bg-emerald-50 hover:bg-emerald-100/60 border-emerald-200 text-emerald-950";
                        badgeClass = "bg-emerald-100 text-emerald-900 border border-emerald-200";
                        dotClass = "bg-emerald-500";
                        labelText = "Kelas Gabung (Iya)";
                        tagClass = "bg-emerald-200/70 text-emerald-900 border border-emerald-300";
                      } else {
                        cardBgClass = "bg-pink-50 hover:bg-pink-100/60 border-pink-200 text-pink-950";
                        badgeClass = "bg-pink-100 text-pink-900 border border-pink-200";
                        dotClass = "bg-pink-500";
                        labelText = "Bentrok! (Tidak Gabung)";
                        tagClass = "bg-pink-200/70 text-pink-900 border border-pink-300";
                      }
                    }

                    return (
                      <div key={item.id} className="relative group">
                        {/* Indicator Dot */}
                        <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-xs transition-transform group-hover:scale-125 duration-200 ${dotClass}`}></div>
                        
                        {/* Item Details */}
                        <div className={`${cardBgClass} border p-4 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs`}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${badgeClass}`}>
                                Jam Ke-{item.jam_ke}
                              </span>
                              <span className="text-sm font-medium opacity-85">
                                {(() => {
                                  const isMonToThu = ["Senin", "Selasa", "Rabu", "Kamis"].includes(selectedDay);
                                  const hasG12 = item.items.some(i => isGrade1Or2(i.kelas));
                                  if (isMonToThu && item.jam_ke === 6) {
                                    return hasG12 ? "14:00 - 14:20" : "14:00 - 15:00";
                                  }
                                  return item.mulai && item.selesai ? `${item.mulai} - ${item.selesai}` : JAM_TIME_MAP[item.jam_ke];
                                })()}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${tagClass}`}>
                                {labelText}
                              </span>
                            </div>

                            <h4 className="font-bold text-lg">{item.mapel}</h4>

                            {/* Cancelled Banner if conflict with Inval */}
                            {item.isCancelledForInval && (
                              <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg mt-1 w-fit shadow-2xs flex items-center gap-1.5">
                                <span>❌ Dibatalkan. Utamakan tugas inval di jam ke-{item.jam_ke}.</span>
                              </p>
                            )}

                            {/* Inval Info Banner */}
                            {item.isInval && (
                              <div className="mt-1 space-y-1">
                                <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5 bg-white/90 border border-amber-200 px-3 py-1.5 rounded-lg w-fit shadow-2xs">
                                  <span>Menggantikan: <strong>{item.guru_izin}</strong></span>
                                  {item.alasan && <span className="text-xs text-amber-700 font-medium">({item.alasan})</span>}
                                </p>
                                {item.tugas && (
                                  <div className="mt-2">
                                    <button
                                      onClick={() => setTaskModalData({
                                        isOpen: true,
                                        kelas: item.kelas,
                                        mapel: item.mapel,
                                        guru_izin: item.guru_izin,
                                        tugas: item.tugas
                                      })}
                                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm border border-blue-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <span>📋 Lihat Kegiatan Siswa / Tugas</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Incidental Override Info */}
                            {item.isOverridden && (
                              <div className="mt-1.5 space-y-1">
                                {item.keterangan_insidental && (
                                  <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 bg-indigo-100/80 border border-indigo-200 px-3 py-1 rounded-lg w-fit">
                                    <span>📍 Ruang: {item.keterangan_insidental}</span>
                                  </p>
                                )}
                                {item.alasan_insidental && (
                                  <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 bg-white/90 border border-indigo-100 px-3 py-1 rounded-lg w-fit">
                                    <span>💡 Info: {item.alasan_insidental}</span>
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Other Teachers Badge List if other teachers are teaching */}
                            {!item.isInval && (() => {
                              const otherTeachersList: string[] = [];
                              item.items.forEach(scItem => {
                                const scTeachers = [
                                  scItem.guru1,
                                  scItem.guru2,
                                  scItem.guru3,
                                  scItem.guru4,
                                  scItem.guru5,
                                  scItem.guru6
                                ].map(g => g?.trim()).filter(Boolean);
                                
                                scTeachers.forEach(tName => {
                                  if (tName.toLowerCase() !== selectedTeacher.toLowerCase() && !otherTeachersList.includes(tName)) {
                                    otherTeachersList.push(tName);
                                  }
                                });
                              });

                              if (otherTeachersList.length > 0) {
                                return (
                                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 bg-white/60 border border-slate-200/50 px-3 py-1.5 rounded-lg text-xs">
                                    <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider block mr-1">Team Teaching:</span>
                                    {otherTeachersList.map((tName, idx) => (
                                      <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold shadow-2xs">
                                        {tName}
                                      </span>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div>
                              <span className="block text-[10px] uppercase font-bold opacity-60">Kelas</span>
                              <span className="font-semibold">{item.kelas}</span>
                              {!item.isInval && item.keterangan_khusus && (
                                <span className="block text-[11px] font-medium text-indigo-600 mt-0.5">
                                  Keterangan Khusus: {item.keterangan_khusus}
                                </span>
                              )}
                            </div>
                            {item.isInval ? (
                              item.keterangan_khusus && (
                                <div>
                                  <span className="block text-[10px] uppercase font-bold opacity-60">Ruangan</span>
                                  <span className="font-semibold text-yellow-800">📍 Ruang: {item.keterangan_khusus}</span>
                                </div>
                              )
                            ) : (
                              item.ruangan && (
                                <div>
                                  <span className="block text-[10px] uppercase font-bold opacity-60">Ruangan</span>
                                  <span className="font-semibold">{item.ruangan}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-medium text-slate-600">Tidak ada jadwal mengajar pada hari {selectedDay}</p>
                  <p className="text-xs text-slate-400 mt-1">Hari ini adalah Jam Kosong (Free Period) bagi guru yang bersangkutan.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
              <User className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Informasi Jadwal Guru</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Silakan cari dan pilih nama guru terlebih dahulu untuk memuat jadwal, list mata pelajaran, dan analisis jam kosong secara interaktif.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Class Selection Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              Pilih Kelas
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Pilih kelas untuk menampilkan jadwal harian lengkap, wali kelas, pendamping kelas, dan urutan mata pelajaran per jam.
            </p>
            
            <div className="relative max-w-xs">
              <select
                id="class-select-dropdown"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 hover:bg-slate-100/75 focus:bg-white text-slate-800 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-bold text-base shadow-sm appearance-none cursor-pointer"
              >
                {classesList.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>

            {/* Class Metadata: Wali Kelas & Pendamping Kelas */}
            {selectedClass && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-slate-100">
                <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                    WK
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Wali Kelas</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {teachers.find(t => isClassMatch(t.wali_kelas, selectedClass))?.nama || "Belum Ditentukan"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-100/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                    PK
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Pendamping Kelas</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {teachers.find(t => isClassMatch(t.pendamping_kelas, selectedClass))?.nama || "Belum Ditentukan"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Today's Schedule for Class */}
          {selectedClass ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Jadwal Harian Kelas {selectedClass}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Menampilkan jadwal belajar hari <span className="font-semibold text-blue-600">{selectedDay}</span>
                  </p>
                </div>

                {/* Day Switcher */}
                <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                  {(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const).map((day) => (
                    <button
                      key={day}
                      id={`class-day-switch-${day}`}
                      onClick={() => setSelectedDay(day)}
                      className={`flex-1 sm:flex-initial text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        selectedDay === day
                          ? "bg-white text-slate-900 shadow-xs font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timetable List */}
              <div className="relative border-l border-blue-100 pl-6 ml-3 space-y-6">
                {classTimetable.map((period) => {
                  const isMonToThu = ["Senin", "Selasa", "Rabu", "Kamis"].includes(selectedDay);
                  const hasG12 = isGrade1Or2(selectedClass);

                  // Find any schedule in the database for this day and jam_ke to get the correct hours, matching the class type (G12 vs non-G12)
                  const matchingScheduleForTime = schedules.find(
                    s => isSameDay(s.hari, selectedDay) && 
                         s.jam_ke === period.jam_ke && 
                         isGrade1Or2(s.kelas) === hasG12 &&
                         s.mulai && s.selesai
                  );
                  const dbTime = matchingScheduleForTime ? `${matchingScheduleForTime.mulai} - ${matchingScheduleForTime.selesai}` : null;

                  const timeLabel = (isMonToThu && period.jam_ke === 6)
                    ? (hasG12 ? "14:00 - 14:20" : "14:00 - 15:00")
                    : dbTime 
                      ? dbTime
                      : JAM_TIME_MAP[period.jam_ke];

                  if (period.isEmpty) {
                    return (
                      <div key={period.jam_ke} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-slate-300 shadow-xs"></div>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-200 text-slate-600 border border-slate-300">
                                Jam Ke-{period.jam_ke}
                              </span>
                              <span className="text-sm font-medium text-slate-500">
                                {timeLabel}
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-400 italic">Jam Kosong / Istirahat / Belum Ada Jadwal</h4>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // If there is a lesson
                  return (
                    <div key={period.jam_ke} className="relative group">
                      <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-blue-500 shadow-xs transition-transform group-hover:scale-125 duration-200"></div>
                      
                      <div className="bg-blue-50/50 hover:bg-blue-100/40 border border-blue-100 p-4 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                              Jam Ke-{period.jam_ke}
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              {timeLabel}
                            </span>
                          </div>
                          <h4 className="font-bold text-lg text-slate-900">{period.mapel}</h4>
                          
                          {/* Teachers Display */}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 bg-white/70 border border-slate-200/40 px-3 py-1.5 rounded-lg text-xs max-w-max">
                            <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider block mr-1">Guru:</span>
                            {period.teachers.map((teacherName, idx) => {
                              // Determine if pendamping
                              const isTeacherITBA = checkIsITBA({ nama: teacherName } as any);
                              const relevantItem = period.items.find(i => 
                                [i.guru1, i.guru2, i.guru3, i.guru4, i.guru5, i.guru6].some(g => g && g.trim().toLowerCase() === teacherName.trim().toLowerCase())
                              );
                              const isGuru1 = relevantItem?.guru1?.trim().toLowerCase() === teacherName.trim().toLowerCase();
                              
                              let isPendampingRole = false;
                              if (relevantItem) {
                                if (isAlQuranOrTahsin(relevantItem.mapel)) {
                                  isPendampingRole = false;
                                } else if (isTeacherITBA) {
                                  const sName = (relevantItem.mapel || "").trim().toLowerCase();
                                  const isArabic = 
                                    sName.includes("arabic") || 
                                    sName.includes("bahasa arab") || 
                                    sName.includes("arab") || 
                                    sName.includes("b. arab") || 
                                    sName.includes("b.arab");
                                  if (isArabic) {
                                    isPendampingRole = !isGuru1;
                                  } else {
                                    isPendampingRole = !isITBACoreSubject(relevantItem.mapel, teacherName);
                                  }
                                } else {
                                  const isSupervisingCol = relevantItem.selainguru1_mengawas && (relevantItem.selainguru1_mengawas.trim().toLowerCase() === "yes" || relevantItem.selainguru1_mengawas.trim().toLowerCase() === "ya");
                                  isPendampingRole = !isGuru1 && isSupervisingCol;
                                }
                              }

                              return (
                                <span 
                                  key={idx} 
                                  className={`px-2 py-0.5 rounded-md font-semibold shadow-2xs border ${
                                    isPendampingRole
                                      ? "bg-purple-100 text-purple-900 border-purple-200"
                                      : "bg-blue-100 text-blue-900 border-blue-200"
                                  }`}
                                >
                                  {teacherName} {isPendampingRole ? "(Pendamping)" : ""}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          {period.ruangan && (
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-slate-400">Ruangan</span>
                              <span className="font-semibold text-slate-700">{period.ruangan}</span>
                            </div>
                          )}
                          {period.keterangan_khusus && (
                            <div className="max-w-[200px]">
                              <span className="block text-[10px] uppercase font-bold text-slate-400">Keterangan</span>
                              <span className="text-xs font-semibold text-slate-600 block line-clamp-2" title={period.keterangan_khusus}>
                                {period.keterangan_khusus}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
              <Users className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">Informasi Jadwal Kelas</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Silakan pilih kelas terlebih dahulu untuk memuat jadwal pelajaran harian lengkap.
              </p>
            </div>
          )}
        </>
      )}

      {/* Grid Menu Button */}
      <div>
        <h3 className="text-base font-bold text-slate-400 uppercase tracking-wider mb-4">Navigasi Fitur Sistem</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Menu a: Jadwal Pelajaran Lengkap */}
          <button
            id="menu-jadwal-lengkap"
            onClick={() => setPage("jadwal-lengkap")}
            className="group relative bg-white border border-slate-200 hover:border-blue-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4"
          >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1 pr-6 flex-1">
              <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                Jadwal Pelajaran Lengkap
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Menampilkan jadwal mengajar guru seminggu penuh (Senin - Jumat) dalam bentuk grid/card.
              </p>
            </div>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Menu b: List Mapel yang Diajar */}
          <button
            id="menu-list-mapel"
            onClick={() => setPage("list-mapel")}
            className="group relative bg-white border border-slate-200 hover:border-blue-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4"
          >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1 pr-6 flex-1">
              <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                Mata Pelajaran Diampu
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Daftar mata pelajaran yang diajar, kelas, dan jumlah Jam Pelajaran (JP) dengan fitur sorting.
              </p>
            </div>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Menu c: Jam Kosong Individu */}
          <button
            id="menu-jam-kosong-individu"
            onClick={() => setPage("jam-kosong-individu")}
            className="group relative bg-white border border-slate-200 hover:border-amber-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4"
          >
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1 pr-6 flex-1">
              <h4 className="font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                Jam Kosong Individu
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Melihat slot waktu mengajar kosong untuk guru terpilih guna penjadwalan mandiri.
              </p>
            </div>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </button>

          {/* ADMIN ONLY SECTIONS */}
          {isAdmin ? (
            <>
              {/* Menu: Tabel Jam Kosong */}
              <button
                id="menu-tabel-jam-kosong"
                onClick={() => setPage("tabel-jam-kosong")}
                className="group relative bg-blue-50/30 border border-blue-100/70 hover:border-blue-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4"
              >
                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Table className="w-6 h-6" />
                </div>
                <div className="space-y-1 pr-6 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                      Tabel Jam Kosong Guru
                    </h4>
                    <span className="text-[9px] bg-blue-200 text-blue-800 font-bold px-1.5 py-0.5 rounded-md uppercase">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Peta ketersediaan (matrix tabel) ketersediaan jam kosong seluruh guru per hari.
                  </p>
                </div>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Menu d: Jam Kosong Semua Guru */}
              <button
                id="menu-jam-kosong-semua"
                onClick={() => setPage("jam-kosong-semua")}
                className="group relative bg-blue-50/30 border border-blue-100/70 hover:border-blue-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4"
              >
                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1 pr-6 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                      Jam Kosong Semua Guru
                    </h4>
                    <span className="text-[9px] bg-blue-200 text-blue-800 font-bold px-1.5 py-0.5 rounded-md uppercase">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Menampilkan daftar seluruh guru yang kosong pada hari dan jam pelajaran tertentu.
                  </p>
                </div>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Menu e: Input Guru Pengganti */}
              <button
                id="menu-input-pengganti"
                onClick={() => setPage("input-pengganti")}
                className="group relative bg-blue-50/30 border border-blue-100/70 hover:border-blue-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4"
              >
                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="space-y-1 pr-6 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                      Input Guru Pengganti (Inval)
                    </h4>
                    <span className="text-[9px] bg-blue-200 text-blue-800 font-bold px-1.5 py-0.5 rounded-md uppercase">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Input guru izin dan rekomendasikan guru pengganti pintar otomatis berdasarkan 5 kriteria.
                  </p>
                </div>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Menu f: Log Guru Pengganti */}
              <button
                id="menu-log-pengganti"
                onClick={() => setPage("log-pengganti")}
                className="group relative bg-blue-50/30 border border-blue-100/70 hover:border-blue-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4"
              >
                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <History className="w-6 h-6" />
                </div>
                <div className="space-y-1 pr-6 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                      Log Guru Pengganti
                    </h4>
                    <span className="text-[9px] bg-blue-200 text-blue-800 font-bold px-1.5 py-0.5 rounded-md uppercase">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Histori lengkap data izin & penggantian. Dilengkapi tombol salin teks format siaran WhatsApp.
                  </p>
                </div>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Menu g: Statistik Guru Pengganti */}
              <button
                id="menu-statistik"
                onClick={() => setPage("statistik")}
                className="group relative bg-blue-50/30 border border-blue-100/70 hover:border-blue-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4"
              >
                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div className="space-y-1 pr-6 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                      Statistik Guru Pengganti
                    </h4>
                    <span className="text-[9px] bg-blue-200 text-blue-800 font-bold px-1.5 py-0.5 rounded-md uppercase">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Dashboard analitik total JP, top guru izin, top alasan, dan 10 pahlawan guru pengganti.
                  </p>
                </div>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>
            </>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-2xl p-5 flex flex-col justify-center items-center text-center bg-slate-50 sm:col-span-2 lg:col-span-3">
              <Shield className="w-8 h-8 text-slate-300 mb-2" />
              <h4 className="font-bold text-slate-700 text-sm">Akses Fitur Khusus Admin Terkunci</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Fitur tambahan (Jam Kosong Semua Guru, Rekomendasi Pintar Inval, Log Izin & Analytics) hanya dapat diakses oleh Admin. Aktifkan mode Admin lewat navigasi atas atau ketik URL tersembunyi.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* MODAL TUGAS INVAL */}
      {taskModalData?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">📝 Detail Kegiatan / Tugas</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Kelas {taskModalData.kelas} • {taskModalData.mapel}
                </p>
              </div>
              <button 
                onClick={() => setTaskModalData(null)}
                className="p-1.5 bg-slate-200 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pesan dari {taskModalData.guru_izin}:</p>
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-sm text-slate-700 leading-relaxed">
                {renderTaskWithLinks(taskModalData.tugas)}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setTaskModalData(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
