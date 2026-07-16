import React, { useState } from "react";
import { Teacher, ScheduleItem, normalizeDay } from "../types";
import { ArrowLeft, BookOpen, AlertCircle, HelpCircle, Search } from "lucide-react";
import { JAM_TIME_MAP } from "./Dashboard";

interface JadwalLengkapProps {
  teachers: Teacher[];
  schedules: ScheduleItem[];
  selectedTeacher: string;
  setSelectedTeacher: (name: string) => void;
  onBack: () => void;
}

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const;
const JAM_LIST = [1, 2, 3, 4, 5, 6];

// Helper to check if Grade 1 or 2
export const isGrade1Or2 = (className: string): boolean => {
  if (!className) return false;
  const name = className.trim().toLowerCase();
  return /^(0?1|0?2)\b|^(0?1|0?2)[a-z]/i.test(name) || /class\s*(0?1|0?2)\b/i.test(name) || /grade\s*(0?1|0?2)\b/i.test(name) || /primary\s*(0?1|0?2)\b/i.test(name);
};

export const JadwalLengkap: React.FC<JadwalLengkapProps> = ({
  teachers,
  schedules,
  selectedTeacher,
  setSelectedTeacher,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter teachers for search inside this view
  const filteredTeachers = searchQuery.trim() === ""
    ? []
    : teachers.filter(t => t.nama.toLowerCase().includes(searchQuery.toLowerCase()));

  // Active teacher
  const currentTeacher = teachers.find(t => t.nama === selectedTeacher);

  // Filter schedules
  const teacherSchedules = schedules.filter(s => 
    [s.guru1, s.guru2, s.guru3, s.guru4, s.guru5, s.guru6].some(
      g => g && g.trim().toLowerCase() === selectedTeacher.trim().toLowerCase()
    )
  );

  // Total JP (Jumlah Jam Pelajaran) in a week (counting unique slots as 1 JP)
  const uniqueSlots = new Set<string>();
  teacherSchedules.forEach(item => {
    uniqueSlots.add(`${normalizeDay(item.hari)}-${item.jam_ke}`);
  });
  const totalJP = uniqueSlots.size;

  // Map schedules to 2D lookup [Hari][Jam_ke] -> ScheduleItem[]
  const scheduleMap: Record<string, Record<number, ScheduleItem[]>> = {};
  HARI_LIST.forEach(hari => {
    scheduleMap[hari] = {};
  });
  teacherSchedules.forEach(item => {
    const normH = normalizeDay(item.hari);
    if (scheduleMap[normH]) {
      if (!scheduleMap[normH][item.jam_ke]) {
        scheduleMap[normH][item.jam_ke] = [];
      }
      scheduleMap[normH][item.jam_ke].push(item);
    }
  });

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
          <span>Jadwal Pelajaran Lengkap</span>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {/* Search Bar / Switcher */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Jadwal Pelajaran Mingguan
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Gunakan bilah di samping untuk mengganti guru yang sedang ditinjau.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <div className="relative">
              <input
                id="jadwal-search-input"
                type="text"
                placeholder="Ganti Guru..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 text-sm border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>

            {showSuggestions && filteredTeachers.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                {filteredTeachers.map(t => (
                  <button
                    key={t.nama}
                    id={`jadwal-suggest-${t.nama.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => {
                      setSelectedTeacher(t.nama);
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-blue-50 text-slate-700 font-medium"
                  >
                    {t.nama}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedTeacher ? (
          <div className="space-y-6">
            {/* Teacher Header and JP summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-50 rounded-2xl gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedTeacher}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mata Pelajaran Utama: {currentTeacher?.mapel_utama || "Tidak terdaftar"} | Rumpun: {currentTeacher?.rumpun || "-"}
                </p>
              </div>

              <div className="bg-blue-600 text-white px-5 py-3 rounded-xl shadow-sm text-center min-w-[120px]">
                <span className="block text-[10px] uppercase font-bold text-blue-200 tracking-wider">Total Beban</span>
                <span className="text-2xl font-black">{totalJP} JP</span>
                <span className="block text-[10px] text-blue-100">per minggu</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-sky-100 border border-sky-200"></span>
                Kelas Reguler (Biru Muda)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-pink-100 border border-pink-200"></span>
                Kelas Bentrok (Pink)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-200"></span>
                Kelas Gabung (Hijau)
              </span>
              <span className="flex items-center gap-1.5 ml-auto">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                Dua kelas bersamaan diampu satu ustadz dihitung sebagai 1 JP
              </span>
            </div>

            {/* DESKTOP 2D GRID TABLE */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-28 border-r border-slate-200">
                      Hari \ Jam
                    </th>
                    {JAM_LIST.map(jam => (
                      <th key={jam} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-r border-slate-200 last:border-0">
                        <div>Jam ke-{jam}</div>
                        <div className="text-[10px] font-medium text-slate-400 mt-1">{JAM_TIME_MAP[jam]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {HARI_LIST.map(hari => (
                    <tr key={hari} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-700 bg-slate-50/50 text-center border-r border-slate-200">
                        {hari}
                      </td>
                      {JAM_LIST.map(jam => {
                        const items = scheduleMap[hari][jam] || [];

                        if (items.length > 0) {
                          const isSlotGabung = items.some(item => 
                            item.kelasgabung && (
                              item.kelasgabung.trim().toLowerCase() === "ya" || 
                              item.kelasgabung.trim().toLowerCase() === "iya"
                            )
                          );
                          const isConflict = items.length >= 2 && !isSlotGabung;

                          const uniqueMapels = [...new Set(items.map(i => i.mapel))];
                          const uniqueKelas = [...new Set(items.map(i => i.kelas))];
                          const displayMapel = uniqueMapels.join(" & ");
                          const displayKelas = uniqueKelas.join(" & ");
                          const firstItem = items[0];

                          let cellClasses = "";
                          let badge = null;

                          if (isSlotGabung) {
                            cellClasses = "bg-emerald-50 text-emerald-900 border-l-2 border-l-emerald-400 border-emerald-100";
                            badge = (
                              <span className="mt-1.5 text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 py-0.5 rounded uppercase tracking-wider inline-block">
                                Gabung (1 JP)
                              </span>
                            );
                          } else if (isConflict) {
                            cellClasses = "bg-pink-50 text-pink-900 border-l-2 border-l-pink-400 border-pink-100";
                            badge = (
                              <span className="mt-1.5 text-[8px] bg-pink-100 text-pink-700 font-bold px-1 py-0.5 rounded uppercase tracking-wider inline-block">
                                Bentrok (1 JP)
                              </span>
                            );
                          } else {
                            cellClasses = "bg-sky-50 text-sky-900 border-l-2 border-l-sky-400 border-sky-100";
                            badge = (
                              <span className="mt-1.5 text-[8px] bg-sky-100 text-sky-800 font-bold px-1 py-0.5 rounded uppercase tracking-wider inline-block">
                                Reguler (1 JP)
                              </span>
                            );
                          }

                          return (
                            <td 
                              key={`jam-${jam}`} 
                              className={`p-3 border-r border-slate-200 last:border-0 text-center transition-all ${cellClasses}`}
                            >
                              <div className="font-extrabold text-xs sm:text-sm leading-tight">{displayMapel}</div>
                              <div className="text-xs font-bold mt-1 opacity-90">Kelas {displayKelas}</div>
                              <div className="text-[10px] mt-0.5 opacity-75">
                                {(() => {
                                  const isMonToThu = ["Senin", "Selasa", "Rabu", "Kamis"].includes(hari);
                                  const hasG12 = items.some(i => isGrade1Or2(i.kelas));
                                  if (isMonToThu && hasG12 && jam === 6) {
                                    return "14:00 - 14:20";
                                  }
                                  return firstItem.mulai && firstItem.selesai ? `${firstItem.mulai} - ${firstItem.selesai}` : "";
                                })()}
                              </div>
                              <div className="block">{badge}</div>
                              
                              {/* Other Teachers Badge List if other teachers are teaching */}
                              {(() => {
                                const otherTeachersList: string[] = [];
                                items.forEach(scItem => {
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
                                    <div className="mt-1.5 text-[8px] bg-white/70 border border-slate-200/50 p-1 rounded leading-normal font-medium text-slate-600 text-center">
                                      <div className="font-extrabold text-[7px] uppercase tracking-wider text-slate-400">Team Teaching:</div>
                                      <div className="truncate" title={otherTeachersList.join(", ")}>{otherTeachersList.join(", ")}</div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </td>
                          );
                        } else {
                          return (
                            <td key={`jam-${jam}`} className="p-3 border-r border-slate-200 last:border-0 bg-slate-50/20 text-center text-xs text-slate-300 italic">
                              Kosong
                            </td>
                          );
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE LAYOUT (LIST CARD PER HARI) */}
            <div className="block md:hidden space-y-4">
              {HARI_LIST.map(hari => {
                const daySlots = JAM_LIST.map(jam => ({
                  jam,
                  items: scheduleMap[hari][jam] || []
                }));

                const hasSchedulesOnDay = daySlots.some(slot => slot.items.length > 0);

                return (
                  <div key={hari} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-800">{hari}</span>
                      <span className="text-xs text-blue-600 bg-blue-50 font-semibold px-2 py-0.5 rounded-full">
                        {daySlots.filter(s => s.items.length > 0).length} Sesi
                      </span>
                    </div>

                    <div className="p-4 space-y-3 bg-white">
                      {daySlots.filter(s => s.items.length > 0).length > 0 ? (
                        daySlots
                          .filter(s => s.items.length > 0)
                          .map(({ jam, items }) => {
                            const isSlotGabung = items.some(item => 
                              item.kelasgabung && (
                                item.kelasgabung.trim().toLowerCase() === "ya" || 
                                item.kelasgabung.trim().toLowerCase() === "iya"
                              )
                            );
                            const isConflict = items.length >= 2 && !isSlotGabung;

                            const uniqueMapels = [...new Set(items.map(i => i.mapel))];
                            const uniqueKelas = [...new Set(items.map(i => i.kelas))];
                            const displayMapel = uniqueMapels.join(" & ");
                            const displayKelas = uniqueKelas.join(" & ");
                            const firstItem = items[0];

                            let bgClasses = "";
                            let badge = null;

                            if (isSlotGabung) {
                              bgClasses = "bg-emerald-50 border-emerald-100 text-emerald-900";
                              badge = (
                                <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 py-0.5 rounded uppercase tracking-wider">
                                  Gabung (1 JP)
                                </span>
                              );
                            } else if (isConflict) {
                              bgClasses = "bg-pink-50 border-pink-100 text-pink-900";
                              badge = (
                                <span className="text-[8px] bg-pink-100 text-pink-700 font-bold px-1 py-0.5 rounded uppercase tracking-wider">
                                  Bentrok (1 JP)
                                </span>
                              );
                            } else {
                              bgClasses = "bg-sky-50 border-sky-100 text-sky-900";
                              badge = (
                                <span className="text-[8px] bg-sky-100 text-sky-800 font-bold px-1 py-0.5 rounded uppercase tracking-wider">
                                  Reguler (1 JP)
                                </span>
                              );
                            }

                            return (
                              <div 
                                key={jam}
                                className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${bgClasses}`}
                              >
                                <div>
                                  <span className="text-[10px] font-extrabold uppercase bg-white/60 px-1.5 py-0.5 rounded mr-2">
                                    Jam {jam}
                                  </span>
                                  <span className="text-xs font-medium opacity-80">
                                    {(() => {
                                      const isMonToThu = ["Senin", "Selasa", "Rabu", "Kamis"].includes(hari);
                                      const hasG12 = items.some(i => isGrade1Or2(i.kelas));
                                      if (isMonToThu && hasG12 && jam === 6) {
                                        return "14:00 - 14:20";
                                      }
                                      return firstItem.mulai && firstItem.selesai ? `${firstItem.mulai} - ${firstItem.selesai}` : JAM_TIME_MAP[jam];
                                    })()}
                                  </span>
                                  <h4 className="font-bold text-sm mt-1">{displayMapel}</h4>
                                  <div className="mt-1">{badge}</div>
                                  
                                  {/* Other Teachers Badge List if other teachers are teaching */}
                                  {(() => {
                                    const otherTeachersList: string[] = [];
                                    items.forEach(scItem => {
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
                                        <div className="mt-1.5 flex flex-wrap items-center gap-1 bg-white/60 border border-slate-200/50 px-2 py-1 rounded text-[10px]">
                                          <span className="font-bold text-slate-500 uppercase text-[8px] tracking-wider block mr-0.5">Team Teaching:</span>
                                          {otherTeachersList.map((tName, idx) => (
                                            <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.25 rounded font-semibold">
                                              {tName}
                                            </span>
                                          ))}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                <div className="text-right text-xs">
                                  <span className="block font-bold">Kelas {displayKelas}</span>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="text-center py-4 text-xs text-slate-400 italic">
                          Tidak ada jadwal mengajar pada hari ini
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        ) : (
          <div className="text-center py-10">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">Belum memilih guru</p>
            <p className="text-xs text-slate-400 mt-1">Silakan cari atau pilih nama guru di dashboard terlebih dahulu.</p>
          </div>
        )}
      </div>
    </div>
  );
};
