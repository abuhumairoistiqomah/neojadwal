import React, { useMemo } from "react";
import { LogIzinItem } from "../types";
import { 
  ArrowLeft, BarChart3, Award, HelpCircle, Users, 
  Activity, Heart, AlertCircle, CalendarRange 
} from "lucide-react";

interface StatistikGuruPenggantiProps {
  logs: LogIzinItem[];
  onBack: () => void;
}

export const StatistikGuruPengganti: React.FC<StatistikGuruPenggantiProps> = ({
  logs,
  onBack,
}) => {
  // Total JP tergantikan
  const totalJPReplaced = logs.length;

  // Group stats
  const stats = useMemo(() => {
    const guruIzinCounts: Record<string, number> = {};
    const guruPenggantiCounts: Record<string, number> = {};
    const alasanCounts: Record<string, number> = {};

    logs.forEach(log => {
      // Guru Izin
      guruIzinCounts[log.guru_izin] = (guruIzinCounts[log.guru_izin] || 0) + 1;
      
      // Guru Pengganti
      guruPenggantiCounts[log.guru_pengganti] = (guruPenggantiCounts[log.guru_pengganti] || 0) + 1;
      
      // Alasan (Normalize a bit by grabbing main reason before parentheses if any)
      const cleanAlasan = log.alasan.split("(")[0].trim();
      alasanCounts[cleanAlasan] = (alasanCounts[cleanAlasan] || 0) + 1;
    });

    // Convert and sort
    const topIzin = Object.entries(guruIzinCounts)
      .map(([nama, count]) => ({ nama, count }))
      .sort((a, b) => b.count - a.count);

    const topPengganti = Object.entries(guruPenggantiCounts)
      .map(([nama, count]) => ({ nama, count }))
      .sort((a, b) => b.count - a.count);

    const topAlasan = Object.entries(alasanCounts)
      .map(([alasan, count]) => ({ alasan, count }))
      .sort((a, b) => b.count - a.count);

    return {
      topIzin,
      topPengganti,
      topAlasan,
      allGuruIzinNames: Object.keys(guruIzinCounts)
    };
  }, [logs]);

  // Max counts for relative bar widths in our custom bar charts
  const maxIzinCount = stats.topIzin[0]?.count || 1;
  const maxPenggantiCount = stats.topPengganti[0]?.count || 1;
  const maxAlasanCount = stats.topAlasan[0]?.count || 1;

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
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          Dashboard Analitik Guru Pengganti
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Total JP Replaced */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <CalendarRange className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total JP Tergantikan</span>
            <span className="text-3xl font-black text-indigo-600 mt-1 block">{totalJPReplaced} JP</span>
            <span className="text-[11px] text-gray-400 font-semibold block mt-0.5">Semester Berjalan</span>
          </div>
        </div>

        {/* Card 2: Teachers who have asked for leave */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Guru Pernah Izin</span>
            <span className="text-3xl font-black text-rose-600 mt-1 block">{stats.allGuruIzinNames.length} Guru</span>
            <span className="text-[11px] text-gray-400 font-semibold block mt-0.5">Pernah berhalangan hadir</span>
          </div>
        </div>

        {/* Card 3: Top Hero Substitution count */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-5 sm:col-span-2 lg:col-span-1">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Pahlawan Inval Teratas</span>
            <span className="text-lg font-black text-emerald-700 mt-1.5 block truncate max-w-[200px]">
              {stats.topPengganti[0]?.nama || "-"}
            </span>
            <span className="text-xs text-emerald-600 font-bold block mt-0.5">
              {stats.topPengganti[0] ? `Berkontribusi ${stats.topPengganti[0].count} JP` : "Belum ada penggantian"}
            </span>
          </div>
        </div>

      </div>

      {/* Analytical Detail Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Box 1: TOP 10 PAHLAWAN (Guru Pengganti Paling Sering) */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Top 10 Pahlawan Inval (Guru Pengganti Teraktif)
          </h3>
          <p className="text-xs text-gray-500 mb-5">
            Daftar guru yang paling sering bersedia menggantikan kelas kosong rekan lainnya demi menjaga kestabilan kegiatan belajar siswa.
          </p>

          {stats.topPengganti.length > 0 ? (
            <div className="space-y-4">
              {stats.topPengganti.slice(0, 10).map((hero, index) => {
                const percentage = (hero.count / maxPenggantiCount) * 100;
                return (
                  <div key={hero.nama} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-extrabold text-[10px] ${
                          index === 0 
                            ? "bg-amber-100 text-amber-800" 
                            : index === 1 
                              ? "bg-slate-100 text-slate-800" 
                              : "bg-gray-100 text-gray-600"
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-bold text-gray-700 truncate max-w-[200px] sm:max-w-xs">{hero.nama}</span>
                      </div>
                      <span className="font-black text-emerald-600 shrink-0">{hero.count} JP</span>
                    </div>
                    {/* Visual Meter bar */}
                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-400 italic">
              Belum ada data penggantian terekam.
            </div>
          )}
        </div>

        {/* Box 2: TOP 10 GURU PALING SERING IZIN */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500" />
            Top 10 Guru Paling Sering Izin (Berhalangan)
          </h3>
          <p className="text-xs text-gray-500 mb-5">
            Statistik frekuensi ketidakhadiran guru yang membutuhkan penunjukan guru inval selama semester ini.
          </p>

          {stats.topIzin.length > 0 ? (
            <div className="space-y-4">
              {stats.topIzin.slice(0, 10).map((item, index) => {
                const percentage = (item.count / maxIzinCount) * 100;
                return (
                  <div key={item.nama} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-rose-50 text-rose-700 rounded-md flex items-center justify-center font-extrabold text-[10px]">
                          {index + 1}
                        </span>
                        <span className="font-bold text-gray-700 truncate max-w-[200px] sm:max-w-xs">{item.nama}</span>
                      </div>
                      <span className="font-black text-rose-600 shrink-0">{item.count} JP</span>
                    </div>
                    {/* Visual Meter bar */}
                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-400 italic">
              Belum ada data izin terekam.
            </div>
          )}
        </div>

        {/* Box 3: TOP ALASAN IZIN */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-indigo-500" />
            Top Alasan Berhalangan Hadir
          </h3>
          <p className="text-xs text-gray-500 mb-5">
            Kategori penyebab utama guru berhalangan mengajar di kelas reguler.
          </p>

          {stats.topAlasan.length > 0 ? (
            <div className="space-y-4">
              {stats.topAlasan.map((item, index) => {
                const percentage = (item.count / maxAlasanCount) * 100;
                return (
                  <div key={item.alasan} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700 truncate max-w-[200px] sm:max-w-xs">{item.alasan}</span>
                      <span className="font-black text-indigo-600 shrink-0">{item.count} kali</span>
                    </div>
                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-400 italic">
              Belum ada data terekam.
            </div>
          )}
        </div>

        {/* Box 4: DAFTAR SEMUA GURU YANG PERNAH IZIN */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              Daftar Lengkap Guru Pernah Izin
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Semua nama guru yang tercatat pernah mengambil izin minimal 1 JP sepanjang semester berjalan.
            </p>

            <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto p-1">
              {stats.allGuruIzinNames.length > 0 ? (
                stats.allGuruIzinNames.map((nama) => (
                  <span 
                    key={nama}
                    className="text-[10px] bg-rose-50 text-rose-700 border border-rose-100 font-semibold px-2.5 py-1.5 rounded-lg shadow-sm"
                  >
                    {nama}
                  </span>
                ))
              ) : (
                <div className="text-xs text-gray-400 italic p-4 text-center w-full">
                  Belum ada nama guru terekam berhalangan.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2 text-[10px] text-gray-400 font-medium">
            <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Statistik ini diperbarui seketika setiap kali Anda menambahkan atau menghapus catatan di modul Input Guru Pengganti.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
