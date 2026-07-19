import React, { useState, useMemo } from "react";
import { Teacher, ScheduleItem, LogIzinItem, checkIsITBA, isSameDay, isITBACoreSubject } from "../types";
import { 
  ArrowLeft, Calendar, UserCheck, HelpCircle, Save, 
  Trash2, Plus, Sparkles, CheckSquare, AlertTriangle, AlertCircle 
} from "lucide-react";
import { JAM_TIME_MAP } from "./Dashboard";

interface InputGuruPenggantiProps {
  teachers: Teacher[];
  schedules: ScheduleItem[];
  logs: LogIzinItem[];
  onAddLogs: (newLogs: Omit<LogIzinItem, "id">[]) => void;
  onBack: () => void;
}

const HARI_MAP_INDO: Record<number, "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat"> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat"
};

export const InputGuruPengganti: React.FC<InputGuruPenggantiProps> = ({
  teachers,
  schedules,
  logs,
  onAddLogs,
  onBack,
}) => {
  const [tanggal, setTanggal] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [guruIzin, setGuruIzin] = useState<string>("");
  const [searchTeacherQuery, setSearchTeacherQuery] = useState<string>("");
  const [showTeacherSuggestions, setShowTeacherSuggestions] = useState<boolean>(false);
  
  // Filtered teachers for search-as-you-type suggestions
  const filteredTeacherSuggestions = useMemo(() => {
    const query = searchTeacherQuery.trim().toLowerCase();
    if (!query) {
      return teachers;
    }
    return teachers.filter(t => {
      const nama = (t.nama || "").toLowerCase();
      const mapel = (t.mapel_utama || "").toLowerCase();
      const tugas = (t.tugas_tambahan || "").toLowerCase();
      const ket = (t.keterangan || "").toLowerCase();
      return nama.includes(query) || mapel.includes(query) || tugas.includes(query) || ket.includes(query);
    });
  }, [teachers, searchTeacherQuery]);

  const [alasan, setAlasan] = useState<string>("");
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [generatedRows, setGeneratedRows] = useState<Array<{
    jam_ke: number;
    kelas: string;
    mapel: string;
    selectedPengganti: string;
  }>>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Determine Day name of selected date
  const selectedDayName = useMemo(() => {
    if (!tanggal) return "Senin";
    const date = new Date(tanggal);
    const dayIndex = date.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    if (dayIndex === 0 || dayIndex === 6) {
      return "Senin"; // Fallback to Monday for weekends in mock database
    }
    return HARI_MAP_INDO[dayIndex] || "Senin";
  }, [tanggal]);

  // Handle Hour checkbox change
  const handleHourToggle = (hour: number) => {
    setSelectedHours(prev => 
      prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour].sort()
    );
  };

  // Handle Select All Hours
  const handleSelectAllHours = () => {
    if (selectedHours.length === 6) {
      setSelectedHours([]);
    } else {
      setSelectedHours([1, 2, 3, 4, 5, 6]);
    }
  };

  // Generate list rows for chosen hours
  const handleGenerate = () => {
    if (!guruIzin) {
      setErrorMessage("Silakan pilih Guru yang Izin terlebih dahulu.");
      return;
    }
    if (selectedHours.length === 0) {
      setErrorMessage("Pilih minimal satu Jam Pelajaran (Jam Ke-) untuk digantikan.");
      return;
    }

    setErrorMessage("");

    // Find what this guru teaches at these hours
    const teacherSchedules = schedules.filter(
      s => isSameDay(s.hari, selectedDayName) && [s.guru1, s.guru2, s.guru3, s.guru4, s.guru5, s.guru6].some(
        g => g && g.trim().toLowerCase() === guruIzin.trim().toLowerCase()
      )
    );

    const rows = selectedHours.map(hour => {
      // Find matching schedule
      const sched = teacherSchedules.find(s => s.jam_ke === hour);
      return {
        jam_ke: hour,
        kelas: sched ? sched.kelas : "X-MIPA-1", // default if none found, but prompt admin
        mapel: sched ? sched.mapel : "Mata Pelajaran",
        selectedPengganti: "",
      };
    });

    setGeneratedRows(rows);
  };

  // ALGORITMA REKOMENDASI PENGGANTI (Sangat Penting)
  const getRecommendedTeachers = (jam_ke: number, classLabel: string, subjectLabel: string) => {
    if (!guruIzin) return [];

    const targetTeacher = teachers.find(t => t.nama === guruIzin);
    if (!targetTeacher) return [];

    // 1. Get all candidate teachers (except the absent one and native teachers)
    const nativeTeachersToExclude = [
      "Syaikh Ali Ali Sinan",
      "Syeikhoh Muthmainnah",
      "Syaikh Abdul Manshur"
    ].map(name => name.trim().toLowerCase());

    const candidates = teachers.filter(t => {
      const isAbsent = t.nama === guruIzin;
      const isNative = nativeTeachersToExclude.some(
        nativeName => t.nama.trim().toLowerCase().includes(nativeName)
      );
      return !isAbsent && !isNative;
    });

    const scoredCandidates = candidates.map(candidate => {
      let score = 0;
      const reasons: string[] = [];

      // a. SYARAT MUTLAK: Guru harus sedang JAM KOSONG pada hari dan jam tersebut.
      // Catatan Khusus ITBA: Guru ITBA hanya sibuk jika mengajar tugas wajib mereka (Al-Qur'an, Tahsin, Tajwid).
      // Khusus Kholid dan Hariyadiq juga sibuk jika mengajar PE. Di luar itu (misal mendampingi Bahasa Inggris), mereka dianggap kosong/bisa digantikan.
      const isITBA = checkIsITBA(candidate);
      
      const isBusy = schedules.some(s => {
        if (!isSameDay(s.hari, selectedDayName) || s.jam_ke !== jam_ke) return false;
        
        const isGuru1 = s.guru1 && s.guru1.trim().toLowerCase() === candidate.nama.trim().toLowerCase();
        const isAssisting = [s.guru2, s.guru3, s.guru4, s.guru5, s.guru6].some(
          g => g && g.trim().toLowerCase() === candidate.nama.trim().toLowerCase()
        );
        if (!isGuru1 && !isAssisting) return false;

        if (isITBA) {
          return isITBACoreSubject(s.mapel, candidate.nama);
        }

        if (isAssisting) {
          const isSupervisingCol = s.selainguru1_mengawas && (s.selainguru1_mengawas.trim().toLowerCase() === "yes" || s.selainguru1_mengawas.trim().toLowerCase() === "ya");
          if (isSupervisingCol) return false;
        }

        return true;
      });

      if (isBusy) {
        return { teacher: candidate, eligible: false, isPendamping: false, score: -999, reasons: ["Sedang mengajar kelas reguler"] };
      }

      // b. SYARAT MUTLAK 2: Guru tidak sedang menjadi pengganti di kelas lain (Cek data Log_Izin di hari/jam yang sama).
      const isAlreadySubbing = logs.some(
        log => log.tanggal === tanggal && log.jam_ke === jam_ke && log.guru_pengganti === candidate.nama
      );
      if (isAlreadySubbing) {
        return { teacher: candidate, eligible: false, isPendamping: false, score: -999, reasons: ["Sudah ditunjuk sebagai inval di kelas lain"] };
      }

      // c. Prioritas 1: Semapel (Mapel sama).
      // Candidate's main subject matches the subject being replaced
      const isSameMapel = candidate.mapel_utama.toLowerCase() === subjectLabel.toLowerCase() || 
                          candidate.mapel_utama.toLowerCase().includes(subjectLabel.toLowerCase()) ||
                          subjectLabel.toLowerCase().includes(candidate.mapel_utama.toLowerCase());
      if (isSameMapel) {
        score += 100;
        reasons.push("Mata Pelajaran Sama (+100)");
      }

      // d. Prioritas 2: Serumpun (Rumpun sama, misal Math dengan Sains, dipisah dengan koma di DB).
      const targetRumpunList = targetTeacher.rumpun.split(",").map(r => r.trim().toLowerCase());
      const candidateRumpunList = candidate.rumpun.split(",").map(r => r.trim().toLowerCase());
      const hasSharedRumpun = candidateRumpunList.some(r => targetRumpunList.includes(r));
      if (hasSharedRumpun) {
        score += 50;
        reasons.push("Rumpun Bidang Sama (+50)");
      }

      // e. Prioritas 3: Sejenjang (Sama-sama SD/SMP/SMA).
      if (candidate.jenjang === targetTeacher.jenjang) {
        score += 20;
        reasons.push("Jenjang Sama (+20)");
      }

      // f. Prioritas 4: Wali Kelas (Turunkan prioritasnya, taruh di bawah).
      if (candidate.wali_kelas) {
        score -= 15;
        reasons.push("Wali Kelas (-15)");
      }

      // g. Prioritas 5: Manajemen (Turunkan ke prioritas paling bawah).
      if (candidate.is_manajemen) {
        score -= 100;
        reasons.push("Tim Manajemen (-100)");
      }

      // h. Catatan Tambahan untuk ITBA
      if (isITBA) {
        // Check if they are scheduled in this slot for a non-core subject
        const isAssistingNonCore = schedules.some(
          s => isSameDay(s.hari, selectedDayName) && s.jam_ke === jam_ke && [s.guru1, s.guru2, s.guru3, s.guru4, s.guru5, s.guru6].some(
            g => g && g.trim().toLowerCase() === candidate.nama.trim().toLowerCase()
          )
        );
        if (isAssistingNonCore) {
          score += 15;
          reasons.push("Mahasiswa ITBA (Mendampingi Kelas Non-Wajib) (+15)");
        } else {
          score += 5;
          reasons.push("Mahasiswa ITBA (Jam Kosong Murni) (+5)");
        }
      }

      // Check if they are currently assigned as a companion in this slot
      const isPendamping = schedules.some(s => {
        if (!isSameDay(s.hari, selectedDayName) || s.jam_ke !== jam_ke) return false;
        
        const isGuru1 = s.guru1 && s.guru1.trim().toLowerCase() === candidate.nama.trim().toLowerCase();
        const isAssisting = [s.guru2, s.guru3, s.guru4, s.guru5, s.guru6].some(
          g => g && g.trim().toLowerCase() === candidate.nama.trim().toLowerCase()
        );
        
        if (!isGuru1 && !isAssisting) return false;
        
        if (isITBA) {
          return !isITBACoreSubject(s.mapel, candidate.nama);
        } else {
          const isSupervisingCol = s.selainguru1_mengawas && (s.selainguru1_mengawas.trim().toLowerCase() === "yes" || s.selainguru1_mengawas.trim().toLowerCase() === "ya");
          return !isGuru1 && isSupervisingCol;
        }
      });

      return {
        teacher: candidate,
        eligible: true,
        isPendamping,
        score,
        reasons
      };
    });

    // Separate and sort candidates
    const eligibleList = scoredCandidates
      .filter(c => c.eligible)
      .sort((a, b) => b.score - a.score);
      
    const ineligibleList = scoredCandidates
      .filter(c => !c.eligible)
      .sort((a, b) => a.teacher.nama.localeCompare(b.teacher.nama));
      
    return [...eligibleList, ...ineligibleList];
  };

  // Handle individual replacement selection
  const handlePenggantiChange = (index: number, teacherName: string) => {
    const updated = [...generatedRows];
    updated[index].selectedPengganti = teacherName;
    setGeneratedRows(updated);
  };

  // Submit and save replacement logs
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tanggal || !guruIzin || !alasan) {
      setErrorMessage("Silakan lengkapi data Tanggal, Guru Izin, dan Alasan terlebih dahulu.");
      return;
    }

    if (generatedRows.length === 0) {
      setErrorMessage("Baris penggantian belum digenerate atau masih kosong.");
      return;
    }

    // Check if all rows have selected replacements
    const missingReplacement = generatedRows.some(row => !row.selectedPengganti);
    if (missingReplacement) {
      setErrorMessage("Harap pilih Guru Pengganti untuk seluruh jam pelajaran yang dicentang.");
      return;
    }

    // Create log items to save
    const newLogs: Omit<LogIzinItem, "id">[] = generatedRows.map(row => ({
      tanggal,
      guru_izin: guruIzin,
      alasan,
      jam_ke: row.jam_ke,
      kelas: row.kelas,
      mapel: row.mapel,
      guru_pengganti: row.selectedPengganti,
    }));

    onAddLogs(newLogs);

    // Reset Form
    setSuccessMessage(`Berhasil menambahkan ${newLogs.length} Log Guru Pengganti!`);
    setGuruIzin("");
    setSearchTeacherQuery("");
    setShowTeacherSuggestions(false);
    setAlasan("");
    setSelectedHours([]);
    setGeneratedRows([]);
    
    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          id="back-to-dashboard-btn"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 bg-white px-4 py-2 rounded-xl border border-gray-100 hover:border-indigo-100 shadow-sm transition-all self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </button>

        <span className="text-sm font-semibold text-gray-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          Penjadwalan Guru Pengganti Pintar
        </span>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-6 pb-6 border-b border-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-500" />
            Input Guru Pengganti (Inval)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gunakan asisten pintar ini untuk menjadwalkan guru pengganti yang paling relevan berdasarkan data jadwal harian dan prioritas bidang.
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">
            <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">
            <Sparkles className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Step 1: Input Permohonan Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Field A: Tanggal */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Tanggal Izin
              </label>
              <input
                id="input-tanggal-izin"
                type="date"
                value={tanggal}
                onChange={(e) => {
                  setTanggal(e.target.value);
                  setGeneratedRows([]); // reset generated rows to enforce regenerate
                }}
                className="w-full bg-gray-50 hover:bg-gray-100/50 focus:bg-white text-gray-800 border border-gray-200 focus:border-indigo-500 rounded-xl p-3 focus:outline-none transition-all text-sm font-semibold"
                required
              />
              <p className="text-xs text-gray-400">
                Jadwal yang ditinjau: Hari <strong className="text-indigo-600">{selectedDayName}</strong>
              </p>
            </div>

            {/* Field B: Guru yang Izin */}
            <div className="space-y-2 relative">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-gray-400" />
                Guru yang Izin
              </label>
              
              <div className="relative">
                <input
                  id="input-guru-izin-search"
                  type="text"
                  placeholder="Ketik nama guru atau mata pelajaran..."
                  value={searchTeacherQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchTeacherQuery(val);
                    setShowTeacherSuggestions(true);
                    
                    // If the user types, check if they matched exactly
                    const match = teachers.find(t => t.nama.toLowerCase() === val.trim().toLowerCase());
                    if (match) {
                      setGuruIzin(match.nama);
                    } else {
                      setGuruIzin(""); // Clear active selected teacher until explicit click
                    }
                    setGeneratedRows([]); // reset generated rows
                  }}
                  onFocus={() => {
                    setShowTeacherSuggestions(true);
                  }}
                  className="w-full bg-gray-50 hover:bg-gray-100/50 focus:bg-white text-gray-800 border border-gray-200 focus:border-indigo-500 rounded-xl p-3 pr-20 focus:outline-none transition-all text-sm font-semibold"
                  required
                  autoComplete="off"
                />

                {/* Status indicator badge inside the textbox */}
                {guruIzin && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                    Terpilih
                  </span>
                )}
              </div>

              {/* Backdrop to close the suggestion dropdown when clicked outside */}
              {showTeacherSuggestions && (
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowTeacherSuggestions(false)} 
                />
              )}

              {/* Suggestions List Container */}
              {showTeacherSuggestions && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto z-20 divide-y divide-gray-50">
                  {filteredTeacherSuggestions.length > 0 ? (
                    filteredTeacherSuggestions.map((t) => {
                      const isSelected = guruIzin === t.nama;
                      const isITBA = checkIsITBA(t);
                      return (
                        <div
                          key={t.nama}
                          onClick={() => {
                            setGuruIzin(t.nama);
                            setSearchTeacherQuery(t.nama);
                            setShowTeacherSuggestions(false);
                            setGeneratedRows([]);
                          }}
                          className={`p-3 text-sm cursor-pointer transition-all flex items-center justify-between ${
                            isSelected 
                              ? "bg-indigo-50/70 text-indigo-900 font-bold" 
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                              {t.nama}
                              {isITBA && (
                                <span className="text-[9px] bg-purple-100 text-purple-700 border border-purple-200 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider scale-95">
                                  ITBA
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-gray-400 mt-0.5 font-normal">
                              Mapel Utama: {t.mapel_utama || "-"}
                              {t.tugas_tambahan && ` • ${t.tugas_tambahan}`}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="text-indigo-600 font-bold text-xs">✓</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-400 font-medium">
                      Tidak ada guru yang cocok dengan pencarian Anda
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Field C: Alasan */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-bold text-gray-700">
                Alasan Izin / Halangan Hadir
              </label>
              <input
                id="input-alasan-izin"
                type="text"
                placeholder="Contoh: Sakit (Demam), Dinas Luar ke LPMP, Cuti Bersalin..."
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                className="w-full bg-gray-50 hover:bg-gray-100/50 focus:bg-white text-gray-800 border border-gray-200 focus:border-indigo-500 rounded-xl p-3 focus:outline-none transition-all text-sm font-medium"
                required
              />
            </div>

            {/* Field D: Checkbox Jam Ke- */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-gray-700">
                  Pilih Sesi Jam Pelajaran yang Kosong
                </label>
                <button
                  type="button"
                  id="toggle-select-all-hours"
                  onClick={handleSelectAllHours}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {selectedHours.length === 6 ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                {[1, 2, 3, 4, 5, 6].map((hour) => {
                  // Count sessions taught by selected teacher to guide user
                  const hasClassAtHour = schedules.some(
                    s => isSameDay(s.hari, selectedDayName) && s.jam_ke === hour && [s.guru1, s.guru2, s.guru3, s.guru4, s.guru5, s.guru6].some(
                      g => g && g.trim().toLowerCase() === guruIzin.trim().toLowerCase()
                    )
                  );

                  return (
                    <label 
                      key={hour}
                      className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
                        selectedHours.includes(hour)
                          ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm">Jam Ke-{hour}</span>
                        <input
                          id={`hour-check-${hour}`}
                          type="checkbox"
                          className="accent-indigo-600 w-4 h-4"
                          checked={selectedHours.includes(hour)}
                          onChange={() => {
                            handleHourToggle(hour);
                            setGeneratedRows([]);
                          }}
                        />
                      </div>
                      {guruIzin && (
                        <span className={`text-[9px] mt-1.5 font-bold ${hasClassAtHour ? "text-indigo-600" : "text-gray-300 italic"}`}>
                          {hasClassAtHour ? "✓ Mengajar" : "× Free"}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Generate Button */}
          <div className="pt-2">
            <button
              type="button"
              id="generate-replacement-rows"
              onClick={handleGenerate}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Generate Baris Pengganti
            </button>
          </div>

          {/* Generated Replacement Section */}
          {generatedRows.length > 0 && (
            <div className="mt-8 border-t border-gray-100 pt-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Penempatan Inval Rekomendasi Pintar
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Silakan tentukan guru pengganti untuk setiap jam pelajaran yang telah diajukan di bawah.
                  </p>
                </div>
                
                <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100">
                  {generatedRows.length} Sesi Terbentuk
                </span>
              </div>

              {/* Grid of Slots to fill */}
              <div className="space-y-4">
                {generatedRows.map((row, index) => {
                  // Get candidates recommendation ranking
                  const recommendations = getRecommendedTeachers(row.jam_ke, row.kelas, row.mapel);

                  return (
                    <div 
                      key={row.jam_ke}
                      className="p-5 bg-gray-50 border border-gray-200/60 hover:border-indigo-100 rounded-2xl transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      
                      {/* Left: Info about what's missing */}
                      <div className="space-y-1 lg:max-w-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded">
                            Jam Ke-{row.jam_ke}
                          </span>
                          <span className="text-xs font-medium text-gray-400">
                            {JAM_TIME_MAP[row.jam_ke]}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-800 text-base">{row.mapel}</h4>
                        <p className="text-xs text-gray-500">
                          Kelas Target: <strong className="text-gray-700">{row.kelas}</strong>
                        </p>
                      </div>

                      {/* Right: Recommendation Select Dropdown */}
                      <div className="flex-1 max-w-xl">
                        <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1.5 tracking-wider">
                          Pilih Guru Pengganti (Inval)
                        </label>
                        <select
                          id={`select-pengganti-jam-${row.jam_ke}`}
                          value={row.selectedPengganti}
                          onChange={(e) => handlePenggantiChange(index, e.target.value)}
                          className="w-full bg-white border border-gray-200 focus:border-indigo-500 text-gray-800 text-sm font-semibold p-3 rounded-xl focus:outline-none shadow-sm transition-colors"
                          required
                        >
                          <option value="">-- Pilih Guru Pengganti --</option>
                          
                          {/* Ranked Recommendations */}
                          <optgroup label="✨ REKOMENDASI TERBAIK (JAM KOSONG / PENDAMPING) ✨">
                            {recommendations.filter(c => c.eligible).map(candidate => {
                              const score = candidate.score;
                              const badge = score >= 100 
                                ? "★ Semapel" 
                                : score >= 50 
                                  ? "✦ Serumpun" 
                                  : "Sejenjang";

                              const labelPendamping = candidate.isPendamping ? " (PENDAMPING)" : "";

                              return (
                                <option 
                                  key={candidate.teacher.nama} 
                                  value={candidate.teacher.nama}
                                >
                                  {candidate.teacher.nama}{labelPendamping} [Mapel: {candidate.teacher.mapel_utama}] (Skor: {score} | {badge})
                                </option>
                              );
                            })}
                          </optgroup>

                          {/* Ineligible / Busy Teachers (Override) */}
                          <optgroup label="⚠️ GURU SEDANG MENGAJAR / BERTUGAS LAIN (OVERRIDE) ⚠️">
                            {recommendations.filter(c => !c.eligible).map(candidate => {
                              const reasons = candidate.reasons.join(", ");
                              return (
                                <option 
                                  key={candidate.teacher.nama} 
                                  value={candidate.teacher.nama}
                                >
                                  {candidate.teacher.nama} [{reasons}] [Mapel: {candidate.teacher.mapel_utama}]
                                </option>
                              );
                            })}
                          </optgroup>

                          {recommendations.length === 0 && (
                            <option disabled value="">⚠️ Tidak ada guru pengganti yang sedang kosong!</option>
                          )}
                        </select>

                        {/* Best recommendation helper display */}
                        {recommendations.length > 0 && (
                          <div className="mt-1.5 px-1 flex flex-wrap gap-1.5">
                            <span className="text-[10px] text-gray-400 font-semibold self-center">Faktor pendukung peringkat teratas:</span>
                            {recommendations[0] && recommendations[0].reasons.slice(0, 3).map((r, i) => (
                              <span key={i} className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2 py-0.5 rounded-md">
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-50 flex justify-end">
                <button
                  type="submit"
                  id="submit-replacement-logs"
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Simpan Log Pengganti
                </button>
              </div>

            </div>
          )}

        </form>
      </div>
    </div>
  );
};
