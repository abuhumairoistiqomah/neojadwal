import React, { useState, useMemo } from "react";
import { Teacher, ScheduleItem, normalizeDay, checkIsITBA } from "../types";
import { ArrowLeft, BookOpen, ChevronUp, ChevronDown, UserCheck, Search, HelpCircle } from "lucide-react";

interface ListMapelProps {
  teachers: Teacher[];
  schedules: ScheduleItem[];
  selectedTeacher: string;
  setSelectedTeacher: (name: string) => void;
  onBack: () => void;
}

interface GroupedMapelItem {
  id: string;
  mapel: string;
  hari: string;
  kelas: string;
  jp: number;
  waktu: string;
  isWaliAtauPendamping: boolean;
  roleType: "Wali Kelas" | "Pendamping" | "Pendamping Guru Mapel" | null;
}

type SortKey = "mapel" | "hari" | "kelas" | "jp";
type SortOrder = "asc" | "desc";

const HARI_ORDER: Record<string, number> = {
  "Senin": 1,
  "Selasa": 2,
  "Rabu": 3,
  "Kamis": 4,
  "Jumat": 5
};

export const ListMapel: React.FC<ListMapelProps> = ({
  teachers,
  schedules,
  selectedTeacher,
  setSelectedTeacher,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("mapel");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Get active teacher details
  const currentTeacher = teachers.find(t => t.nama === selectedTeacher);

  // Suggestions for changing teacher
  const filteredTeachers = searchQuery.trim() === ""
    ? []
    : teachers.filter(t => t.nama.toLowerCase().includes(searchQuery.toLowerCase()));

  // Group schedules for the selected teacher
  const groupedData = useMemo(() => {
    if (!selectedTeacher || !currentTeacher) return [];

    const teacherSchedules = schedules.filter(s => 
      [s.guru1, s.guru2, s.guru3, s.guru4, s.guru5, s.guru6].some(
        g => g && g.trim().toLowerCase() === selectedTeacher.trim().toLowerCase()
      )
    );
    const groups: Record<string, { items: ScheduleItem[]; key: string }> = {};

    teacherSchedules.forEach(item => {
      const groupKey = `${item.mapel}_${item.kelas}`;
      if (!groups[groupKey]) {
        groups[groupKey] = { items: [], key: groupKey };
      }
      groups[groupKey].items.push(item);
    });

    return Object.values(groups).map((group, index) => {
      const sample = group.items[0];
      const kelas = sample.kelas;
      
      // Sort items inside group to display days in logical order (Senin -> Jumat)
      const sortedGroupItems = [...group.items].sort((a, b) => {
        const orderA = HARI_ORDER[normalizeDay(a.hari)] || 99;
        const orderB = HARI_ORDER[normalizeDay(b.hari)] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.jam_ke - b.jam_ke;
      });

      // Get unique days (maintaining ordered days)
      const uniqueDays = [...new Set(sortedGroupItems.map(i => normalizeDay(i.hari)))];
      const displayDays = uniqueDays.join(", ");

      // Get unique times/periods
      const uniqueTimes = [...new Set(sortedGroupItems.map(i => i.mulai && i.selesai ? `${i.mulai}-${i.selesai}` : ""))].filter(Boolean);
      const displayTimes = uniqueTimes.join(", ");

      let isWaliAtauPendamping = false;
      let roleType: "Wali Kelas" | "Pendamping" | "Pendamping Guru Mapel" | null = null;

      if (currentTeacher.wali_kelas === kelas) {
        isWaliAtauPendamping = true;
        roleType = "Wali Kelas";
      } else if (currentTeacher.pendamping_kelas === kelas) {
        isWaliAtauPendamping = true;
        roleType = "Pendamping";
      } else {
        const isITBA = checkIsITBA(currentTeacher);
        if (isITBA) {
          const sName = (sample.mapel || "").toLowerCase();
          const isCoreQurany = 
            sName.includes("qur'an") || 
            sName.includes("quran") || 
            sName.includes("tahsin") || 
            sName.includes("tajwid") ||
            sName.includes("tahfidz") ||
            sName.includes("tahfizh") ||
            sName.includes("tahfid") ||
            sName.includes("tilawah") ||
            sName.includes("murottal");

          const isKholidOrHariyadiq = 
            currentTeacher.nama.toUpperCase().includes("KHOLID") || 
            currentTeacher.nama.toUpperCase().includes("HARIYADIQ") ||
            currentTeacher.nama.toUpperCase().includes("HARIYADI");

          const isPE = 
            sName.includes("pe") || 
            sName.includes("pjok") || 
            sName.includes("penjas") || 
            sName.includes("olahraga") ||
            sName.includes("physical");

          const isCorePE = isKholidOrHariyadiq && isPE;

          if (!(isCoreQurany || isCorePE)) {
            roleType = "Pendamping Guru Mapel";
          }
        }
      }

      return {
        id: `g-${index}`,
        mapel: sample.mapel,
        hari: displayDays,
        kelas: kelas,
        jp: group.items.length,
        waktu: displayTimes,
        isWaliAtauPendamping,
        roleType,
      };
    });
  }, [selectedTeacher, currentTeacher, schedules]);

  // Sort logic
  const sortedData = useMemo(() => {
    const data = [...groupedData];
    
    data.sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];

      if (sortKey === "hari") {
        const daysA = a.hari.split(", ").map(d => d.trim());
        const daysB = b.hari.split(", ").map(d => d.trim());
        const firstDayA = daysA[0] || "";
        const firstDayB = daysB[0] || "";
        valA = HARI_ORDER[firstDayA] || 99;
        valB = HARI_ORDER[firstDayB] || 99;
      }

      if (typeof valA === "string") {
        return sortOrder === "asc" 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        // numbers
        return sortOrder === "asc"
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      }
    });

    return data;
  }, [groupedData, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey) return null;
    return sortOrder === "asc" 
      ? <ChevronUp className="w-4 h-4 ml-1 inline text-indigo-600" />
      : <ChevronDown className="w-4 h-4 ml-1 inline text-indigo-600" />;
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

        <span className="text-sm font-medium text-gray-400">List Mata Pelajaran yang Diajar</span>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        
        {/* Switcher & Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Mata Pelajaran Diampu
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Daftar kelas, jadwal hari, dan total beban JP per kelas.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <div className="relative">
              <input
                id="mapel-search-input"
                type="text"
                placeholder="Ganti Guru..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 text-sm border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>

            {showSuggestions && filteredTeachers.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-gray-50">
                {filteredTeachers.map(t => (
                  <button
                    key={t.nama}
                    id={`mapel-suggest-${t.nama.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => {
                      setSelectedTeacher(t.nama);
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-indigo-50 text-gray-700 font-medium"
                  >
                    {t.nama}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedTeacher && currentTeacher ? (
          <div className="space-y-4">
            
            {/* Legend Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <div>
                <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Guru yang ditinjau</span>
                <span className="text-base font-bold text-gray-800">{selectedTeacher}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {currentTeacher.wali_kelas && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    Wali Kelas {currentTeacher.wali_kelas}
                  </span>
                )}
                {currentTeacher.pendamping_kelas && (
                  <span className="bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    Pendamping {currentTeacher.pendamping_kelas}
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-emerald-200/50">
              <div className="flex items-center gap-2 pb-2 sm:pb-0">
                <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Baris berlatar <strong className="text-emerald-950">hijau muda</strong> menandakan guru bertugas sebagai Wali Kelas / Pendamping Kelas.</span>
              </div>
              <div className="flex items-center gap-2 pt-2 sm:pt-0 sm:pl-4">
                <span className="w-2.5 h-2.5 rounded bg-purple-500 shrink-0" />
                <span>Baris berlatar <strong className="text-purple-950">ungu muda</strong> menandakan guru mahasiswa ITBA bertugas sebagai Pendamping Guru Mapel.</span>
              </div>
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                    <th 
                      id="th-mapel"
                      className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("mapel")}
                    >
                      Mata Pelajaran <SortIcon colKey="mapel" />
                    </th>
                    <th 
                      id="th-hari"
                      className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("hari")}
                    >
                      Hari Mengajar <SortIcon colKey="hari" />
                    </th>
                    <th 
                      id="th-kelas"
                      className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("kelas")}
                    >
                      Kelas <SortIcon colKey="kelas" />
                    </th>
                    <th 
                      id="th-jp"
                      className="p-4 cursor-pointer hover:bg-gray-100 transition-colors text-center w-32"
                      onClick={() => handleSort("jp")}
                    >
                      Jumlah JP <SortIcon colKey="jp" />
                    </th>
                    <th className="p-4">Waktu</th>
                    <th className="p-4">Peran Khusus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {sortedData.length > 0 ? (
                    sortedData.map((item) => (
                      <tr 
                        key={item.id}
                        className={`transition-colors ${
                          item.roleType === "Pendamping Guru Mapel"
                            ? "bg-purple-50/70 hover:bg-purple-100/60"
                            : item.isWaliAtauPendamping 
                              ? "bg-emerald-50/70 hover:bg-emerald-100/60" 
                              : "hover:bg-gray-50/50"
                        }`}
                      >
                        <td className="p-4 font-bold text-gray-800">{item.mapel}</td>
                        <td className="p-4 text-gray-600 font-medium">{item.hari}</td>
                        <td className="p-4 font-semibold text-gray-700">{item.kelas}</td>
                        <td className="p-4 text-center font-extrabold text-indigo-600">{item.jp} JP</td>
                        <td className="p-4 text-gray-500 font-medium">{item.waktu}</td>
                        <td className="p-4">
                          {item.roleType ? (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                              item.roleType === "Pendamping Guru Mapel"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {item.roleType}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400 italic">
                        Tidak ada mata pelajaran yang diajar
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE VERTICAL CARD LAYOUT */}
            <div className="block md:hidden space-y-3">
              {sortedData.length > 0 ? (
                sortedData.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      item.roleType === "Pendamping Guru Mapel"
                        ? "bg-purple-50/80 border-purple-100"
                        : item.isWaliAtauPendamping 
                          ? "bg-emerald-50/80 border-emerald-100" 
                          : "bg-white border-gray-100"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{item.mapel}</h4>
                        <span className="text-xs text-gray-500 font-medium">Hari {item.hari} {item.waktu ? `• Waktu: ${item.waktu}` : ""}</span>
                      </div>
                      <span className="bg-indigo-50 text-indigo-700 font-extrabold text-xs px-2.5 py-1 rounded-lg">
                        {item.jp} JP
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-gray-100/50 pt-2.5">
                      <span className="text-xs text-gray-500">
                        Kelas: <strong className="text-gray-800">{item.kelas}</strong>
                      </span>

                      {item.roleType && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          item.roleType === "Pendamping Guru Mapel"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {item.roleType}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-gray-400 italic bg-gray-50 rounded-xl">
                  Tidak ada mata pelajaran yang diajar
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            Silakan pilih nama guru di Dashboard terlebih dahulu.
          </div>
        )}
      </div>
    </div>
  );
};
