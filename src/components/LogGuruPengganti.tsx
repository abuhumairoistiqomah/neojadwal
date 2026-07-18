import React, { useState, useMemo } from "react";
import { LogIzinItem } from "../types";
import { 
  ArrowLeft, ClipboardList, Copy, Check, Search, Calendar, 
  Trash2, ShieldAlert, CheckCircle, HelpCircle 
} from "lucide-react";
import { JAM_TIME_MAP } from "./Dashboard";

interface LogGuruPenggantiProps {
  logs: LogIzinItem[];
  onDeleteLog?: (id: string) => void;
  onBack: () => void;
}

export const LogGuruPengganti: React.FC<LogGuruPenggantiProps> = ({
  logs,
  onDeleteLog,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedDate, setCopiedDate] = useState<string | null>(null);

  // Group logs by Date
  const groupedLogs = useMemo(() => {
    // 1. Filter logs based on search query (guru_izin, guru_pengganti, mapel, kelas)
    const filtered = logs.filter(log => {
      const q = searchQuery.toLowerCase();
      return (
        log.guru_izin.toLowerCase().includes(q) ||
        log.guru_pengganti.toLowerCase().includes(q) ||
        log.mapel.toLowerCase().includes(q) ||
        log.kelas.toLowerCase().includes(q) ||
        log.alasan.toLowerCase().includes(q)
      );
    });

    // 2. Group by date
    const groups: Record<string, LogIzinItem[]> = {};
    filtered.forEach(log => {
      if (!groups[log.tanggal]) {
        groups[log.tanggal] = [];
      }
      groups[log.tanggal].push(log);
    });

    // 3. Convert to array and sort by date descending
    return Object.entries(groups)
      .map(([tanggal, items]) => ({
        tanggal,
        // Sort items in a date by jam_ke ascending
        items: items.sort((a, b) => a.jam_ke - b.jam_ke)
      }))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [logs, searchQuery]);

  // Generate WhatsApp text format for a specific date and copy to clipboard
  const handleCopyWA = (tanggal: string, items: LogIzinItem[]) => {
    // Format date beautifully Indonesian style
    const dateFormatted = new Date(tanggal).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    let waText = `*Hal: Guru Pengganti*\n\nBismillah. Berikut nama - nama guru pengganti hari *${dateFormatted}*.\n\n`;
    
    // Group items by Teacher Izin first so they appear neatly
    const teacherMap: Record<string, LogIzinItem[]> = {};
    items.forEach(item => {
      if (!teacherMap[item.guru_izin]) {
        teacherMap[item.guru_izin] = [];
      }
      teacherMap[item.guru_izin].push(item);
    });

    const teacherSections: string[] = [];

    Object.entries(teacherMap).forEach(([guruIzin, logsList]) => {
      const alasan = logsList[0].alasan;
      let section = `*${guruIzin}* - ${alasan}\n`;
      
      logsList.forEach((log, index) => {
        section += `${index + 1}. *JP ${log.jam_ke}* (*${log.kelas}* *${log.mapel}*) digantikan oleh *${log.guru_pengganti}*\n`;
      });
      
      teacherSections.push(section.trimEnd());
    });

    waText += teacherSections.join("\n\n");

    // Copy to clipboard
    navigator.clipboard.writeText(waText).then(() => {
      setCopiedDate(tanggal);
      setTimeout(() => {
        setCopiedDate(null);
      }, 2500);
    });
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
          <ShieldAlert className="w-4 h-4 text-indigo-500" />
          Menu Khusus Admin (Log Guru Pengganti)
        </span>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        
        {/* Header & Search */}
        <div className="mb-6 pb-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              Histori Log Guru Pengganti
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Daftar guru pengganti yang pernah dijadwalkan, diurutkan dari tanggal terbaru.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <div className="relative">
              <input
                id="search-log-input"
                type="text"
                placeholder="Cari guru izin, pengganti, kelas, mapel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 text-sm border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="text-xs font-semibold text-indigo-800 bg-indigo-50/75 border border-indigo-100/50 p-4 rounded-xl flex items-start gap-2.5 mb-6">
          <HelpCircle className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Fitur Broadcast Siaran WhatsApp:</p>
            <p className="text-indigo-700/90 font-medium mt-0.5">
              Klik tombol <strong>"Salin Format WA"</strong> di setiap kelompok tanggal. Sistem akan menyusun draf laporan yang rapi dan menyalinnya ke clipboard Anda secara otomatis, siap dikirim ke grup sekolah.
            </p>
          </div>
        </div>

        {/* Logs grouped by date */}
        {groupedLogs.length > 0 ? (
          <div className="space-y-8">
            {groupedLogs.map((group) => (
              <div key={group.tanggal} className="space-y-3">
                
                {/* Date Header Group */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-indigo-500" />
                    <span className="font-bold text-gray-800 text-sm sm:text-base">
                      {new Date(group.tanggal).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </span>
                    <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md">
                      {group.items.length} Inval
                    </span>
                  </div>

                  {/* Copy Button */}
                  <button
                    id={`copy-wa-${group.tanggal}`}
                    onClick={() => handleCopyWA(group.tanggal, group.items)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-sm ${
                      copiedDate === group.tanggal
                        ? "bg-emerald-600 text-white"
                        : "bg-white hover:bg-gray-100 text-indigo-600 border border-gray-200 hover:border-indigo-200"
                    }`}
                  >
                    {copiedDate === group.tanggal ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Disalin ke WA Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Salin Format WA
                      </>
                    )}
                  </button>
                </div>

                {/* Desktop view table for each group */}
                <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase border-b border-gray-100">
                        <th className="p-3 w-16 text-center">Jam</th>
                        <th className="p-3">Guru Berhalangan</th>
                        <th className="p-3">Alasan</th>
                        <th className="p-3">Mata Pelajaran</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3">Guru Pengganti (Inval)</th>
                        {onDeleteLog && <th className="p-3 w-16 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                      {group.items.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="p-3 text-center">
                            <span className="bg-indigo-50 text-indigo-800 font-extrabold px-2 py-0.5 rounded">
                              {log.jam_ke}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-gray-800">{log.guru_izin}</td>
                          <td className="p-3 text-gray-500 italic font-medium">{log.alasan}</td>
                          <td className="p-3 font-medium">{log.mapel}</td>
                          <td className="p-3 font-bold text-gray-800">{log.kelas}</td>
                          <td className="p-3">
                            <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
                              {log.guru_pengganti}
                            </span>
                          </td>
                          {onDeleteLog && (
                            <td className="p-3 text-center">
                              <button
                                id={`delete-log-${log.id}`}
                                onClick={() => onDeleteLog(log.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile view cards for each group */}
                <div className="block md:hidden space-y-2.5">
                  {group.items.map((log) => (
                    <div key={log.id} className="bg-white border border-gray-100 p-4 rounded-xl space-y-3 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="bg-indigo-50 text-indigo-800 font-extrabold text-[10px] px-2 py-0.5 rounded block w-max mb-1">
                            Jam Ke-{log.jam_ke} ({JAM_TIME_MAP[log.jam_ke]})
                          </span>
                          <h4 className="font-bold text-gray-800 text-xs">Izin: {log.guru_izin}</h4>
                          <span className="text-[10px] text-gray-400 italic">Alasan: {log.alasan}</span>
                        </div>

                        {onDeleteLog && (
                          <button
                            id={`delete-log-mob-${log.id}`}
                            onClick={() => onDeleteLog(log.id)}
                            className="p-1 text-gray-300 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50/50 text-[10px] text-gray-500">
                        <div>
                          <span className="block text-gray-400">Mapel / Kelas</span>
                          <span className="font-bold text-gray-700">{log.mapel} (Kelas {log.kelas})</span>
                        </div>
                        <div>
                          <span className="block text-emerald-600 font-bold">PENGGANTI (INVAL)</span>
                          <span className="font-bold text-emerald-800">{log.guru_pengganti}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
            <CheckCircle className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-700 text-sm">Belum Ada Log Terdaftar</p>
            <p className="text-xs text-gray-400 mt-1">Data log guru pengganti kosong atau tidak cocok dengan filter pencarian.</p>
          </div>
        )}

      </div>
    </div>
  );
};
