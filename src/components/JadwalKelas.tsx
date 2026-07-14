import React, { useState, useMemo } from "react";
import { Teacher, ScheduleItem, normalizeDay } from "../types";
import { ArrowLeft, AlertCircle, Search, Users, Download, Loader2 } from "lucide-react";
import { JAM_TIME_MAP } from "./Dashboard";

interface JadwalKelasProps {
  teachers: Teacher[];
  schedules: ScheduleItem[];
  onBack: () => void;
}

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const;
const JAM_LIST = [1, 2, 3, 4, 5, 6];

// Helper to check class type
export const getClassType = (className: string): "Ikhwan" | "Akhwat" | "Normal" => {
  if (!className) return "Normal";
  const name = className.trim().toLowerCase();
  if (name.endsWith("i") || name.endsWith("ikhwan") || name.includes("ikhwan") || name.includes(" ikhwan")) {
    return "Ikhwan";
  }
  if (name.endsWith("a") || name.endsWith("akhwat") || name.includes("akhwat") || name.includes(" akhwat")) {
    return "Akhwat";
  }
  return "Normal";
};

// Helper to check if Grade 1 or 2
export const isGrade1Or2 = (className: string): boolean => {
  if (!className) return false;
  const name = className.trim().toLowerCase();
  return /^(1|2)\b|^(1|2)[a-z]|class\s*(1|2)|grade\s*(1|2)|primary\s*(1|2)/i.test(name);
};

// Helper to check if Grade 12
export const isGrade12 = (className: string): boolean => {
  if (!className) return false;
  const name = className.trim().toLowerCase();
  return /^12\b|^12[a-z]|class\s*12|grade\s*12/i.test(name);
};

// Helper to get Friday-specific time ranges for teaching cells
export const getFridayTimeRange = (jpNumber: number, className: string, classType: "Ikhwan" | "Akhwat" | "Normal"): string => {
  const isAkhwat = classType === "Akhwat";
  const isG12 = isGrade1Or2(className);

  if (jpNumber === 1) {
    return "07:15 - 08:15";
  }
  if (jpNumber === 2) {
    return isAkhwat ? "08:30 - 09:30" : "08:15 - 09:15";
  }
  if (jpNumber === 3) {
    return isG12 ? "09:30 - 10:20" : "09:30 - 10:30";
  }
  if (jpNumber === 4) {
    return "13:00 - 14:00";
  }
  if (jpNumber === 5) {
    return "14:00 - 15:00";
  }
  return "";
};

// Helper to get Friday-specific labels and time ranges for breaks/ishoma
export const getFridayBreakInfo = (colType: "break" | "ishoma", className: string, classType: "Ikhwan" | "Akhwat" | "Normal") => {
  const isAkhwat = classType === "Akhwat";
  const isG12 = isGrade1Or2(className);

  if (colType === "break") {
    return {
      label: "Istirahat",
      timeRange: isAkhwat ? "08:15 - 08:30" : "09:15 - 09:30"
    };
  }

  // colType === "ishoma"
  if (isG12) {
    return {
      label: "Pulang Sekolah",
      timeRange: "10:20"
    };
  } else {
    return {
      label: "Al-Kahfi & Ishoma",
      timeRange: "10:30 - 13:00"
    };
  }
};

interface ColumnDef {
  type: "jp" | "break" | "ishoma";
  jpNumber?: number;
  label: string;
  timeRange: string;
}

// Columns definition based on classType and grade (isGrade1Or2)
const getColumns = (type: "Ikhwan" | "Akhwat" | "Normal", isG12: boolean): ColumnDef[] => {
  const isAkhwat = type === "Akhwat";
  const jp6Time = isG12 ? "14:00 - 14:20" : "14:00 - 15:00";

  if (isAkhwat) {
    return [
      { type: "jp", jpNumber: 1, label: "Jam ke-1", timeRange: "07:40 - 08:40" },
      { type: "break", label: "Istirahat", timeRange: "08:40 - 09:00" },
      { type: "jp", jpNumber: 2, label: "Jam ke-2", timeRange: "09:00 - 10:00" },
      { type: "jp", jpNumber: 3, label: "Jam ke-3", timeRange: "10:00 - 11:00" },
      { type: "jp", jpNumber: 4, label: "Jam ke-4", timeRange: "11:00 - 12:00" },
      { type: "ishoma", label: "Ishoma", timeRange: "12:00 - 13:00" },
      { type: "jp", jpNumber: 5, label: "Jam ke-5", timeRange: "13:00 - 14:00" },
      { type: "jp", jpNumber: 6, label: "Jam ke-6", timeRange: jp6Time },
    ];
  } else {
    // Ikhwan & Normal
    return [
      { type: "jp", jpNumber: 1, label: "Jam ke-1", timeRange: "07:40 - 08:40" },
      { type: "jp", jpNumber: 2, label: "Jam ke-2", timeRange: "08:40 - 09:40" },
      { type: "break", label: "Istirahat", timeRange: "09:40 - 10:00" },
      { type: "jp", jpNumber: 3, label: "Jam ke-3", timeRange: "10:00 - 11:00" },
      { type: "jp", jpNumber: 4, label: "Jam ke-4", timeRange: "11:00 - 12:00" },
      { type: "ishoma", label: "Ishoma", timeRange: "12:00 - 13:00" },
      { type: "jp", jpNumber: 5, label: "Jam ke-5", timeRange: "13:00 - 14:00" },
      { type: "jp", jpNumber: 6, label: "Jam ke-6", timeRange: jp6Time },
    ];
  }
};

// Helper to get Friday-specific columns
export const getFridayColumns = (type: "Ikhwan" | "Akhwat" | "Normal", isG12: boolean): ColumnDef[] => {
  const isAkhwat = type === "Akhwat";
  if (isAkhwat) {
    return [
      { type: "jp", jpNumber: 1, label: "JAM KE-1", timeRange: "07:15 - 08:15" },
      { type: "break", label: "ISTIRAHAT", timeRange: "08:15 - 08:30" },
      { type: "jp", jpNumber: 2, label: "JAM KE-2", timeRange: "08:30 - 09:30" },
      { type: "jp", jpNumber: 3, label: "JAM KE-3", timeRange: isG12 ? "09:30 - 10:20" : "09:30 - 10:30" },
      { type: "break", label: "Al-Kahfi", timeRange: "10:30 - 11:00" },
      { type: "ishoma", label: "Ishoma", timeRange: "11:00 - 13:00" },
      { type: "jp", jpNumber: 4, label: "JP 4", timeRange: "13:00 - 14:00" },
      { type: "jp", jpNumber: 5, label: "JP 5", timeRange: "14:00 - 15:00" },
    ];
  } else {
    // Ikhwan & Normal
    return [
      { type: "jp", jpNumber: 1, label: "JAM KE-1", timeRange: "07:15 - 08:15" },
      { type: "jp", jpNumber: 2, label: "JAM KE-2", timeRange: "08:15 - 09:15" },
      { type: "break", label: "ISTIRAHAT", timeRange: "09:15 - 09:30" },
      { type: "jp", jpNumber: 3, label: "JAM KE-3", timeRange: isG12 ? "09:30 - 10:20" : "09:30 - 10:30" },
      { type: "break", label: "Al-Kahfi", timeRange: "10:30 - 11:00" },
      { type: "ishoma", label: "Ishoma", timeRange: "11:00 - 13:00" },
      { type: "jp", jpNumber: 4, label: "JP 4", timeRange: "13:00 - 14:00" },
      { type: "jp", jpNumber: 5, label: "JP 5", timeRange: "14:00 - 15:00" },
    ];
  }
};

const getBreakColors = (type: "Ikhwan" | "Akhwat" | "Normal") => {
  if (type === "Akhwat") {
    return {
      bg: "bg-purple-100 border-purple-200 text-purple-800",
      bgMobile: "bg-purple-50 border-purple-100 text-purple-900 shadow-2xs",
      badge: "bg-purple-200 text-purple-800",
      pulse: "bg-purple-500",
    };
  } else {
    // Ikhwan & Normal: abu-abu muda
    return {
      bg: "bg-slate-100 border-slate-200 text-slate-800",
      bgMobile: "bg-slate-50 border-slate-100 text-slate-900 shadow-2xs",
      badge: "bg-slate-200 text-slate-800",
      pulse: "bg-slate-400",
    };
  }
};

export const JadwalKelas: React.FC<JadwalKelasProps> = ({
  teachers,
  schedules,
  onBack,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Get all unique classes from schedule
  const uniqueClasses = useMemo(() => {
    const classes = schedules.map(s => s.kelas.trim()).filter(Boolean);
    return [...new Set(classes)].sort();
  }, [schedules]);

  // Filter classes based on query
  const filteredClasses = useMemo(() => {
    if (searchQuery.trim() === "") return [];
    return uniqueClasses.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, uniqueClasses]);

  // Filter schedules for the selected class
  const classSchedules = useMemo(() => {
    if (!selectedClass) return [];
    return schedules.filter(s => s.kelas.trim().toLowerCase() === selectedClass.trim().toLowerCase());
  }, [selectedClass, schedules]);

  // Determine class type of selected class
  const classType = useMemo(() => {
    return getClassType(selectedClass);
  }, [selectedClass]);

  const isG12Class = useMemo(() => {
    return isGrade1Or2(selectedClass);
  }, [selectedClass]);

  const isGrade12Class = useMemo(() => {
    return isGrade12(selectedClass);
  }, [selectedClass]);

  // Columns specification for selected class
  const columns = useMemo(() => {
    return getColumns(classType, isG12Class);
  }, [classType, isG12Class]);

  const fridayColumns = useMemo(() => {
    return getFridayColumns(classType, isG12Class);
  }, [classType, isG12Class]);

  // Map schedules to 2D lookup [Hari][Jam_ke] -> ScheduleItem[]
  const scheduleMap = useMemo(() => {
    const map: Record<string, Record<number, ScheduleItem[]>> = {};
    HARI_LIST.forEach(hari => {
      map[hari] = {};
    });
    classSchedules.forEach(item => {
      const normH = normalizeDay(item.hari);
      // Requirement 2: Hari jum'at untuk kelas 1-11, setelah JP 3 tulis kosong (skip loading JP >= 4)
      if (normH === "Jumat" && !isGrade12Class && item.jam_ke >= 4) {
        return;
      }
      if (map[normH]) {
        if (!map[normH][item.jam_ke]) {
          map[normH][item.jam_ke] = [];
        }
        map[normH][item.jam_ke].push(item);
      }
    });
    return map;
  }, [classSchedules, isGrade12Class]);

  // Map full name to nickname ("Panggilan")
  const getTeacherDisplayName = (fullName: string): string => {
    if (!fullName) return "";
    const matchedTeacher = teachers.find(
      t => t.nama.trim().toLowerCase() === fullName.trim().toLowerCase()
    );
    if (matchedTeacher && matchedTeacher.panggilan) {
      return matchedTeacher.panggilan.trim();
    }
    return fullName.trim();
  };

  // Capture table to PNG Image using html2canvas
  const handleDownloadImage = async () => {
    const element = document.getElementById("timetable-capture-area");
    if (!element) return;

    setIsDownloading(true);
    const stylesToRestore: { el: HTMLStyleElement; originalText: string }[] = [];
    try {
      const convertOklchToHsla = (cssText: string): string => {
        // Regex matches standard numeric OKLCH patterns and translates to HSLA
        let converted = cssText.replace(
          /oklch\(\s*([0-9.%]+)[\s,]+([0-9.%]+)[\s,]+([0-9.%]+)(?:\s*[\s,/]+\s*([0-9.%]+))?\s*\)/g,
          (match, p1, p2, p3, p4) => {
            let L = p1.endsWith('%') ? parseFloat(p1) / 100 : parseFloat(p1);
            let C = p2.endsWith('%') ? parseFloat(p2) / 100 : parseFloat(p2);
            let H = p3.endsWith('%') ? parseFloat(p3) / 100 : parseFloat(p3);
            if (isNaN(L)) L = 0.5;
            if (isNaN(C)) C = 0;
            if (isNaN(H)) H = 0;

            let l = Math.round(L * 100);
            let s = Math.round(Math.min(100, C * 250));
            let h = Math.round(H);

            let a = 1;
            if (p4) {
              a = p4.endsWith('%') ? parseFloat(p4) / 100 : parseFloat(p4);
              if (isNaN(a)) a = 1;
            }

            return `hsla(${h}, ${s}%, ${l}%, ${a})`;
          }
        );
        // Replace any remaining oklch(...) occurrences with a fallback color to guarantee NO crashes
        return converted.replace(/oklch\([^)]+\)/g, "rgba(226, 232, 240, 1)");
      };

      // Temporarily sanitize style elements in the parent document to avoid html2canvas processing crashes
      document.querySelectorAll("style").forEach(styleEl => {
        if (styleEl.textContent && styleEl.textContent.includes("oklch")) {
          stylesToRestore.push({ el: styleEl, originalText: styleEl.textContent });
          styleEl.textContent = convertOklchToHsla(styleEl.textContent);
        }
      });

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(element, {
        scale: 2, // 2x scale for premium crisp resolution
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          // Process all <style> tags in the cloned document
          const styleTags = clonedDoc.querySelectorAll("style");
          styleTags.forEach(style => {
            if (style.textContent) {
              style.textContent = convertOklchToHsla(style.textContent);
            }
          });

          // Process all elements with inline style attribute
          const elementsWithStyle = clonedDoc.querySelectorAll("[style]");
          elementsWithStyle.forEach(el => {
            const inlineStyle = el.getAttribute("style");
            if (inlineStyle) {
              el.setAttribute("style", convertOklchToHsla(inlineStyle));
            }
          });
        }
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Jadwal_Kelas_${selectedClass.replace(/\s+/g, "_")}.png`;
      link.click();
    } catch (error) {
      console.error("Gagal mendownload gambar:", error);
      alert("Gagal mengunduh gambar jadwal karena ada kendala rendering format warna. Silakan coba lagi.");
    } finally {
      // Restore styles in the parent document immediately
      stylesToRestore.forEach(({ el, originalText }) => {
        el.textContent = originalText;
      });
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          id="back-to-dashboard-btn"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 bg-white px-4 py-2 rounded-xl border border-slate-200 hover:border-blue-100 shadow-sm transition-all self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </button>

        <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
          <span>Jadwal Pelajaran per Kelas</span>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {/* Selector & Search Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Jadwal Lengkap per Kelas
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Pilih kelas lewat menu drop-down atau cari dengan mengetik untuk melihat jadwal mingguan lengkap.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full md:w-auto">
            {/* Dropdown Selector (Requirement 3) */}
            <div className="w-full sm:w-48">
              <select
                id="kelas-select-dropdown"
                value={selectedClass}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClass(val);
                  setSearchQuery(val);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all cursor-pointer font-bold text-slate-700"
              >
                <option value="">-- Pilih Kelas --</option>
                {uniqueClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Existing Search bar with dynamic matching */}
            <div className="relative w-full sm:w-60">
              <div className="relative">
                <input
                  id="kelas-search-input"
                  type="text"
                  placeholder="Cari & Pilih Kelas..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>

              {showSuggestions && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map(c => (
                      <button
                        key={c}
                        id={`kelas-suggest-${c.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => {
                          setSelectedClass(c);
                          setSearchQuery(c);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-blue-50 text-slate-700 font-bold"
                      >
                        {c}
                      </button>
                    ))
                  ) : (
                    searchQuery.trim() === "" && uniqueClasses.map(c => (
                      <button
                        key={c}
                        id={`kelas-suggest-${c.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => {
                          setSelectedClass(c);
                          setSearchQuery(c);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-blue-50 text-slate-700 font-bold"
                      >
                        {c}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedClass ? (
          <div className="space-y-6">
            {/* Download Button Row */}
            <div className="flex justify-end">
              <button
                id="download-timetable-png-btn"
                onClick={handleDownloadImage}
                disabled={isDownloading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyiapkan Berkas...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Unduh Jadwal Kelas (PNG)
                  </>
                )}
              </button>
            </div>

            {/* CAPTURE PORTION (TIMETABLE WRAPPER) */}
            <div 
              id="timetable-capture-area" 
              className="p-8 border border-slate-100 rounded-2xl bg-white space-y-6 shadow-xs"
            >
              {/* Prestigious Professional School Header (Requirement 6) */}
              <div className="text-center pb-6 border-b-2 border-slate-200">
                <div className="text-xs font-black text-blue-600 tracking-widest uppercase mb-1">
                  AL-WILDAN ISLAMIC SCHOOL 10 JAKARTA
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  SCHOOL TIMETABLE CLASS ({selectedClass.toUpperCase()})
                </h1>
                <div className="text-xs font-bold text-slate-500 tracking-wider mt-1">
                  ACADEMIC YEAR 2026/2027
                </div>
              </div>

              {/* Class Info Cards */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-50 rounded-2xl gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800">{selectedClass}</h3>
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                      classType === "Ikhwan" 
                        ? "bg-slate-200 text-slate-800 border border-slate-300" 
                        : classType === "Akhwat" 
                          ? "bg-purple-100 text-purple-800 border border-purple-200" 
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}>
                      Kelas {classType}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-1.5">
                    Istirahat: {classType === "Ikhwan" ? "09:40 - 10:00" : classType === "Akhwat" ? "08:40 - 09:00" : "Ikhwan: 09:40 - 10:00, Akhwat: 08:40 - 09:00"}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Ishoma: 12:00 - 13:00 (Harian)
                  </p>
                </div>

                <div className="bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xs text-center min-w-[120px]">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Durasi</span>
                  <span className="text-2xl font-black">5 Hari</span>
                  <span className="block text-[10px] text-slate-400">Senin - Jumat</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 p-3.5 border border-slate-100 rounded-xl bg-slate-50/50">
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-200"></span>
                  Sesi Pelajaran
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200"></span>
                  Istirahat / Ishoma Ikhwan (Abu-abu Muda)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-purple-100 border border-purple-200"></span>
                  Istirahat / Ishoma Akhwat (Ungu Muda)
                </span>
              </div>

              {/* DESKTOP 2D GRID TABLE WITH DYNAMIC CHRONOLOGICAL COLUMNS */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="p-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-center w-28 border-r border-slate-200">
                        Hari \ Jam
                      </th>
                      {columns.map((col, idx) => (
                        <th 
                          key={`col-head-${idx}`} 
                          className={`p-4 text-xs font-extrabold uppercase tracking-wider text-center border-r border-slate-200 last:border-0 ${
                            col.type === "break" || col.type === "ishoma"
                              ? classType === "Akhwat"
                                ? "bg-purple-100/40 text-purple-900 border-r-purple-200"
                                : "bg-slate-100 text-slate-900 border-r-slate-200"
                              : "text-slate-600"
                          }`}
                        >
                          <div>{col.label}</div>
                          <div className="text-[10px] font-semibold mt-1 opacity-75">{col.timeRange}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* 1. Monday to Thursday Rows */}
                    {["Senin", "Selasa", "Rabu", "Kamis"].map(hari => (
                      <tr key={hari} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-black text-slate-700 bg-slate-100/50 text-center border-r border-slate-200">
                          {hari}
                        </td>

                        {/* Render Cells chronologically */}
                        {columns.map((col, idx) => {
                          if (col.type === "jp" && col.jpNumber !== undefined) {
                            const jam = col.jpNumber;
                            const items = scheduleMap[hari][jam] || [];

                            if (items.length > 0) {
                              const displayMapel = items.map(i => i.mapel).join(" & ");
                              const uniqueTeachers = [
                                ...new Set(
                                  items.flatMap(item => [
                                    item.guru1, item.guru2, item.guru3, item.guru4, item.guru5, item.guru6
                                  ])
                                )
                              ].filter(Boolean) as string[];
                              const displayGuru = uniqueTeachers.map(name => getTeacherDisplayName(name)).join(", ");

                              return (
                                <td 
                                  key={`cell-${idx}`} 
                                  className="p-3 border-r border-slate-200 text-center bg-blue-50/60 text-blue-900 border-l-2 border-l-blue-400 transition-all align-middle"
                                >
                                  <div className="font-extrabold text-xs sm:text-sm leading-tight text-slate-800">{displayMapel}</div>
                                  <div className="text-[10px] font-bold mt-1 text-blue-800 line-clamp-2" title={displayGuru}>
                                    {displayGuru || "Tanpa Guru"}
                                  </div>
                                  <div className="text-[9px] mt-0.5 text-slate-400 font-bold">
                                    {col.timeRange}
                                  </div>
                                </td>
                              );
                            } else {
                              return (
                                <td key={`cell-${idx}`} className="p-3 border-r border-slate-200 bg-slate-50/20 text-center text-xs text-slate-300 italic align-middle">
                                  <div className="font-medium">Kosong</div>
                                  <div className="text-[9px] mt-0.5 text-slate-400">{col.timeRange}</div>
                                </td>
                              );
                            }
                          } else if (col.type === "break" || col.type === "ishoma") {
                            const colors = getBreakColors(classType);

                            return (
                              <td 
                                key={`cell-${idx}`} 
                                className={`p-3 border-r border-slate-200 text-center transition-all align-middle ${colors.bg}`}
                              >
                                <div className="text-[10px] font-extrabold tracking-tight uppercase">{col.label}</div>
                                <div className="text-[9px] font-bold opacity-80 mt-0.5">{col.timeRange}</div>
                              </td>
                            );
                          }
                          return null;
                        })}
                      </tr>
                    ))}

                    {/* 2. Special Separator for Friday */}
                    <tr className="bg-slate-200 border-y border-slate-300">
                      <td colSpan={9} className="p-3 font-black text-xs uppercase tracking-wider text-slate-800 text-center bg-slate-200 select-none">
                        KHUSUS HARI JUM'AT
                      </td>
                    </tr>

                    {/* 3. Friday Column Headers Row */}
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="p-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-center w-28 border-r border-slate-200">
                        HARI/JAM
                      </th>
                      {fridayColumns.map((col, idx) => (
                        <th 
                          key={`fri-col-head-${idx}`} 
                          className={`p-3 text-xs font-extrabold uppercase tracking-wider text-center border-r border-slate-200 last:border-0 ${
                            col.type === "break" || col.type === "ishoma"
                              ? classType === "Akhwat"
                                ? "bg-purple-100/40 text-purple-900 border-r-purple-200"
                                : "bg-slate-100 text-slate-900 border-r-slate-200"
                              : "text-slate-600"
                          }`}
                        >
                          <div>{col.label}</div>
                          <div className="text-[10px] font-semibold mt-1 opacity-75">{col.timeRange}</div>
                        </th>
                      ))}
                    </tr>

                    {/* 4. Friday Row */}
                    <tr className="hover:bg-slate-50/50 transition-colors bg-blue-50/5">
                      <td className="p-4 font-black text-slate-700 bg-slate-100/50 text-center border-r border-slate-200">
                        Jumat
                      </td>
                      {fridayColumns.map((col, idx) => {
                        if (col.type === "jp" && col.jpNumber !== undefined) {
                          const jam = col.jpNumber;
                          
                          // Rule check: Hari jum'at untuk kelas 1-11, setelah JP 3 tulis kosong
                          const isAfterJP3 = jam >= 4;
                          const isClass1to11 = !isGrade12Class;
                          
                          const showAsKosong = isAfterJP3 && isClass1to11;
                          const items = showAsKosong ? [] : (scheduleMap["Jumat"][jam] || []);

                          if (items.length > 0) {
                            const displayMapel = items.map(i => i.mapel).join(" & ");
                            const uniqueTeachers = [
                              ...new Set(
                                items.flatMap(item => [
                                  item.guru1, item.guru2, item.guru3, item.guru4, item.guru5, item.guru6
                                ])
                              )
                            ].filter(Boolean) as string[];
                            const displayGuru = uniqueTeachers.map(name => getTeacherDisplayName(name)).join(", ");

                            return (
                              <td 
                                key={`cell-fri-${idx}`} 
                                className="p-3 border-r border-slate-200 text-center bg-blue-50/60 text-blue-900 border-l-2 border-l-blue-400 transition-all align-middle"
                              >
                                <div className="font-extrabold text-xs sm:text-sm leading-tight text-slate-800">{displayMapel}</div>
                                <div className="text-[10px] font-bold mt-1 text-blue-800 line-clamp-2" title={displayGuru}>
                                  {displayGuru || "Tanpa Guru"}
                                </div>
                                <div className="text-[9px] mt-0.5 text-slate-400 font-bold">
                                  {col.timeRange}
                                </div>
                              </td>
                            );
                          } else {
                            // Empty Friday cell
                            const displayLabel = (isG12Class && jam >= 3) ? "Pulang" : "Kosong";
                            return (
                              <td key={`cell-fri-${idx}`} className="p-3 border-r border-slate-200 bg-slate-50/20 text-center text-xs text-slate-300 italic align-middle">
                                <div className="font-medium">{displayLabel}</div>
                                <div className="text-[9px] mt-0.5 text-slate-400">{col.timeRange}</div>
                              </td>
                            );
                          }
                        } else if (col.type === "break" || col.type === "ishoma") {
                          const colors = getBreakColors(classType);
                          const isAlKahfiOrIshoma = col.label === "Al-Kahfi" || col.label === "Ishoma";
                          
                          if (isAlKahfiOrIshoma && isG12Class) {
                            return (
                              <td key={`cell-fri-${idx}`} className="p-3 border-r border-slate-200 bg-slate-50/20 text-center text-xs text-slate-300 italic align-middle">
                                <div className="font-medium">Pulang</div>
                                <div className="text-[9px] mt-0.5 text-slate-400">{col.timeRange}</div>
                              </td>
                            );
                          }

                          return (
                            <td 
                              key={`cell-fri-${idx}`} 
                              className={`p-3 border-r border-slate-200 text-center transition-all align-middle ${colors.bg}`}
                            >
                              <div className="text-[10px] font-extrabold tracking-tight uppercase">{col.label}</div>
                              <div className="text-[9px] font-bold opacity-80 mt-0.5">{col.timeRange}</div>
                            </td>
                          );
                        }
                        return null;
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* MOBILE LAYOUT WITH CHRONOLOGICAL CARDS */}
              <div className="block md:hidden space-y-4">
                {HARI_LIST.map(hari => {
                  return (
                    <div key={hari} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-slate-800">{hari}</span>
                        <span className="text-xs text-blue-600 bg-blue-50 font-black px-2.5 py-0.5 rounded-full">
                          Jadwal Kelas
                        </span>
                      </div>

                      <div className="p-4 space-y-3 bg-white">
                        {(() => {
                          const isFriday = hari === "Jumat";
                          const currentCols = isFriday ? fridayColumns : columns;
                          return currentCols.map((col, idx) => {
                            if (col.type === "jp" && col.jpNumber !== undefined) {
                              const jam = col.jpNumber;
                              
                              // Check Friday rules
                              const isAfterJP3 = jam >= 4;
                              const isClass1to11 = !isGrade12Class;
                              const showAsKosong = isFriday && isAfterJP3 && isClass1to11;

                              const items = showAsKosong ? [] : (scheduleMap[hari][jam] || []);

                              if (items.length > 0) {
                                const displayMapel = items.map(i => i.mapel).join(" & ");
                                const uniqueTeachers = [
                                  ...new Set(
                                    items.flatMap(item => [
                                      item.guru1, item.guru2, item.guru3, item.guru4, item.guru5, item.guru6
                                    ])
                                  )
                                ].filter(Boolean) as string[];
                                const displayGuru = uniqueTeachers.map(name => getTeacherDisplayName(name)).join(", ");

                                return (
                                  <div 
                                    key={`mob-cell-${idx}`}
                                    className="p-3 rounded-lg border border-blue-100 bg-blue-50/50 text-blue-900 flex items-center justify-between gap-3"
                                  >
                                    <div>
                                      <span className="text-[9px] font-extrabold uppercase bg-white px-1.5 py-0.5 rounded mr-2 border border-blue-100 shadow-3xs text-blue-700">
                                        Jam {jam}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-500">
                                        {col.timeRange}
                                      </span>
                                      <h4 className="font-bold text-slate-800 text-sm mt-1">{displayMapel}</h4>
                                      <p className="text-xs opacity-95 text-slate-600 mt-1 font-medium">
                                        Guru: <span className="font-bold text-blue-800">{displayGuru || "Tanpa Guru"}</span>
                                      </p>
                                    </div>
                                  </div>
                                );
                              } else {
                                const displayLabel = (isFriday && isG12Class && jam >= 3) ? "Pulang" : "Kosong";
                                return (
                                  <div 
                                    key={`mob-cell-${idx}`}
                                    className="p-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/30 text-slate-400 text-xs italic flex justify-between"
                                  >
                                    <span className="font-medium text-slate-400">Jam {jam} ({col.timeRange})</span>
                                    <span className="font-semibold">{displayLabel}</span>
                                  </div>
                                );
                              }
                            } else if (col.type === "break" || col.type === "ishoma") {
                              const colors = getBreakColors(classType);
                              const isAlKahfiOrIshoma = col.label === "Al-Kahfi" || col.label === "Ishoma";
                              
                              if (isFriday && isAlKahfiOrIshoma && isG12Class) {
                                return (
                                  <div 
                                    key={`mob-cell-${idx}`}
                                    className="p-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/30 text-slate-400 text-xs italic flex justify-between"
                                  >
                                    <span className="font-medium text-slate-400">{col.label} ({col.timeRange})</span>
                                    <span className="font-semibold text-slate-500">Pulang</span>
                                  </div>
                                );
                              }

                              return (
                                <div 
                                  key={`mob-cell-${idx}`}
                                  className={`p-3 rounded-lg border flex items-center justify-between ${colors.bgMobile}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`animate-pulse w-2 h-2 rounded-full ${colors.pulse}`}></span>
                                    <span className="text-xs font-black uppercase tracking-wide">{col.label}</span>
                                  </div>
                                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${colors.badge}`}>
                                    {col.timeRange}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          });
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">Belum memilih kelas</p>
            <p className="text-xs text-slate-400 mt-1">Silakan pilih kelas melalui menu drop-down atau cari kelas pada kolom pencarian di atas.</p>
          </div>
        )}
      </div>
    </div>
  );
};
