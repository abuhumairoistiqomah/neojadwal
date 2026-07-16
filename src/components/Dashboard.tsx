import React, { useState, useEffect, useRef, useMemo } from "react";
import { Teacher, ScheduleItem, ActivePage, isSameDay } from "../types";
import { 
  Search, Calendar, BookOpen, Clock, Users, UserPlus, 
  History, BarChart2, Shield, User, ChevronRight, X 
} from "lucide-react";

export const JAM_TIME_MAP: Record<number, string> = {
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
  selectedTeacher: string;
  setSelectedTeacher: (name: string) => void;
  isAdmin: boolean;
  setPage: (page: ActivePage) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  teachers,
  schedules,
  selectedTeacher,
  setSelectedTeacher,
  isAdmin,
  setPage,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDay, setSelectedDay] = useState<"Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat">("Senin");
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Set today's day Indonesian name
  useEffect(() => {
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const todayIndex = new Date().getDay();
    const todayName = daysIndo[todayIndex];
    if (["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].includes(todayName)) {
      setSelectedDay(todayName as any);
    } else {
      setSelectedDay("Senin"); // Default to Monday if weekend
    }
  }, []);

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

  // Filter schedules for the selected teacher and selected day
  const todaysSchedules = schedules
    .filter(s => isSameDay(s.hari, selectedDay) && [s.guru1, s.guru2, s.guru3, s.guru4, s.guru5, s.guru6].some(
      g => g && g.trim().toLowerCase() === selectedTeacher.trim().toLowerCase()
    ))
    .sort((a, b) => a.jam_ke - b.jam_ke);

  // Group schedule items by jam_ke to merge two/three classes taught by the same teacher in 1 waktu
  const groupedSchedules = useMemo(() => {
    const groups: Record<number, ScheduleItem[]> = {};
    todaysSchedules.forEach(item => {
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

        // Combine fields
        const mapel = [...new Set(items.map(i => i.mapel))].filter(Boolean).join(", ");
        const kelas = [...new Set(items.map(i => i.kelas))].filter(Boolean).join(", ");
        const ruangan = [...new Set(items.map(i => i.ruangan || "").filter(Boolean))].join(", ");

        // Determine if kelasgabung is "iya" / "ya" (case-insensitive)
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
          kelasgabung: isIya ? "Iya" : "Tidak",
          isConflict: items.length > 1,
          items // keep original list
        };
      });
  }, [todaysSchedules]);

  return (
    <div className="space-y-6">
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Jadwal Hari Ini
              </h2>
              <p className="text-sm text-slate-500">
                Menampilkan jadwal mengajar hari <span className="font-semibold text-blue-600">{selectedDay}</span>
              </p>
            </div>

            {/* Day Switcher */}
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              {(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const).map((day) => (
                <button
                  key={day}
                  id={`day-switch-${day}`}
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

          {/* Schedule List */}
          {groupedSchedules.length > 0 ? (
            <div className="relative border-l border-blue-100 pl-6 ml-3 space-y-6">
              {groupedSchedules.map((item) => {
                const isConflict = item.isConflict;
                const isGabung = item.kelasgabung === "Iya";
                
                let cardBgClass = "bg-blue-50 hover:bg-blue-100/60 border-blue-200 text-blue-950";
                let badgeClass = "bg-blue-100 text-blue-900 border border-blue-200";
                let dotClass = "bg-blue-500";
                let labelText = "Kelas Tunggal";
                let tagClass = "bg-blue-200/70 text-blue-900 border border-blue-300";

                if (isConflict) {
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
                              if (isMonToThu && hasG12 && item.jam_ke === 6) {
                                return "14:00 - 14:20";
                              }
                              return item.mulai && item.selesai ? `${item.mulai} - ${item.selesai}` : JAM_TIME_MAP[item.jam_ke];
                            })()}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${tagClass}`}>
                            {labelText}
                          </span>
                        </div>
                        <h4 className="font-bold text-lg">{item.mapel}</h4>
                        
                        {/* Other Teachers Badge List if other teachers are teaching */}
                        {(() => {
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

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="block text-[10px] uppercase font-bold opacity-60">Kelas</span>
                          <span className="font-semibold">{item.kelas}</span>
                        </div>
                        {item.ruangan && (
                          <div>
                            <span className="block text-[10px] uppercase font-bold opacity-60">Ruangan</span>
                            <span className="font-semibold">{item.ruangan}</span>
                          </div>
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
    </div>
  );
};
