import React, { useState, useEffect, useRef } from "react";
import { 
  Teacher, ScheduleItem, LogIzinItem, ActivePage 
} from "./types";
import { 
  INITIAL_TEACHERS, INITIAL_SCHEDULES, INITIAL_LOGS, INITIAL_ACCOUNTS 
} from "./mockData";
import { Dashboard } from "./components/Dashboard";
import { JadwalLengkap } from "./components/JadwalLengkap";
import { JadwalKelas } from "./components/JadwalKelas";
import { ListMapel } from "./components/ListMapel";
import { JamKosongIndividu } from "./components/JamKosongIndividu";
import { JamKosongSemua } from "./components/JamKosongSemua";
import { InputGuruPengganti } from "./components/InputGuruPengganti";
import { LogGuruPengganti } from "./components/LogGuruPengganti";
import { StatistikGuruPengganti } from "./components/StatistikGuruPengganti";
import { RekapGuru } from "./components/RekapGuru";
import { TabelJamKosong } from "./components/TabelJamKosong";
import { 
  ShieldAlert, ShieldCheck, Database, LogIn, LogOut, 
  HelpCircle, Wifi, WifiOff, RefreshCw, Layers,
  Menu, X, Home, Calendar, BookOpen, Clock, Users, UserPlus, 
  History, BarChart2, Search, Upload, ClipboardList, Table
} from "lucide-react";
import { AdminAccount } from "./types";

const sanitizeTime = (timeStr: any): string => {
  if (!timeStr) return "";
  const s = String(timeStr).trim();
  if (s.includes("1899-12-30") || s.includes("1900-01-01")) {
    const match = s.match(/(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
  }
  if (s.length > 10 && (s.includes("T") || s.includes(" "))) {
    const match = s.match(/(?:T|\s)(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
  }
  return s;
};

export default function App() {
  // --- STATE ---
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [logs, setLogs] = useState<LogIzinItem[]>([]);
  const [selectedTeacher, setSelectedTeacherState] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const storedAdmin = localStorage.getItem("db_is_admin");
    return storedAdmin === "true";
  });

  // Keep admin status synced to localStorage
  useEffect(() => {
    localStorage.setItem("db_is_admin", isAdmin ? "true" : "false");
  }, [isAdmin]);
  const [activePage, setActivePage] = useState<ActivePage>("dashboard");

  // Admin Account & Login States
  const [accounts, setAccounts] = useState<AdminAccount[]>(() => {
    const stored = localStorage.getItem("db_accounts");
    return stored ? JSON.parse(stored) : INITIAL_ACCOUNTS;
  });
  const [adminUser, setAdminUser] = useState<AdminAccount | null>(() => {
    const stored = localStorage.getItem("db_admin_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Sidebar & Global Header Search States
  const [headerSearch, setHeaderSearch] = useState("");
  const [showHeaderSuggestions, setShowHeaderSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerSuggestionsRef = useRef<HTMLDivElement>(null);

  // Google Apps Script API configuration
  const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbxr3Q2tdS8izTiXX4DNjaKapcRBNCPzdH9ETro9PeK_kt1pdkiL773lzm65zpopqMkXNQ/exec";
  const [apiUrl, setApiUrl] = useState<string>(() => {
    const val = localStorage.getItem("db_api_url");
    const oldDefaults = [
      "https://script.google.com/macros/s/AKfycbykdgn4RIJ278Vi72882tBzscRStDgq3djQV1fMhuuoZlKyogbxjZaqwHY3sBW_bDaIgw/exec",
      "https://script.google.com/macros/s/AKfycbypksJLLcqS_unneCbLB06gcWYfW9QMrJHBnsn9LeE3KfyAzLsJ-k1sU3zTvUs1uMV2rQ/exec",
      "https://script.google.com/macros/s/AKfycbz7L-wryLIq0XAg9CPsFT3FvuRpegD8YjFut_Z6edLctqHfNP1xiRDM38P1PLSkecME/exec",
      "https://script.google.com/macros/s/AKfycbyqmK6N1Fzkm5irhbYKrA3knrOKllh8Acd4aYDkRD96pn6uGYCW7pFRjxNs-pvM13phSA/exec"
    ];
    if (val === null || oldDefaults.includes(val)) {
      localStorage.setItem("db_api_url", DEFAULT_API_URL);
      return DEFAULT_API_URL;
    }
    return val;
  });
  const [apiConnected, setApiConnected] = useState<boolean>(() => {
    const val = localStorage.getItem("db_api_url");
    const oldDefaults = [
      "https://script.google.com/macros/s/AKfycbykdgn4RIJ278Vi72882tBzscRStDgq3djQV1fMhuuoZlKyogbxjZaqwHY3sBW_bDaIgw/exec",
      "https://script.google.com/macros/s/AKfycbypksJLLcqS_unneCbLB06gcWYfW9QMrJHBnsn9LeE3KfyAzLsJ-k1sU3zTvUs1uMV2rQ/exec",
      "https://script.google.com/macros/s/AKfycbz7L-wryLIq0XAg9CPsFT3FvuRpegD8YjFut_Z6edLctqHfNP1xiRDM38P1PLSkecME/exec",
      "https://script.google.com/macros/s/AKfycbyqmK6N1Fzkm5irhbYKrA3knrOKllh8Acd4aYDkRD96pn6uGYCW7pFRjxNs-pvM13phSA/exec"
    ];
    if (val === null || oldDefaults.includes(val)) return true;
    return val !== "";
  });
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");

  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // --- INITIAL LOAD & PERSISTENCE ---
  useEffect(() => {
    // 1. Load lists from localStorage or fall back to mock data
    const storedTeachers = localStorage.getItem("db_teachers");
    const storedSchedules = localStorage.getItem("db_schedules");
    const storedLogs = localStorage.getItem("db_logs");
    
    let storedApiUrl = localStorage.getItem("db_api_url");
    const oldDefaults = [
      "https://script.google.com/macros/s/AKfycbykdgn4RIJ278Vi72882tBzscRStDgq3djQV1fMhuuoZlKyogbxjZaqwHY3sBW_bDaIgw/exec",
      "https://script.google.com/macros/s/AKfycbypksJLLcqS_unneCbLB06gcWYfW9QMrJHBnsn9LeE3KfyAzLsJ-k1sU3zTvUs1uMV2rQ/exec",
      "https://script.google.com/macros/s/AKfycbz7L-wryLIq0XAg9CPsFT3FvuRpegD8YjFut_Z6edLctqHfNP1xiRDM38P1PLSkecME/exec",
      "https://script.google.com/macros/s/AKfycbyqmK6N1Fzkm5irhbYKrA3knrOKllh8Acd4aYDkRD96pn6uGYCW7pFRjxNs-pvM13phSA/exec"
    ];
    if (storedApiUrl === null || oldDefaults.includes(storedApiUrl)) {
      storedApiUrl = DEFAULT_API_URL;
      localStorage.setItem("db_api_url", DEFAULT_API_URL);
    }

    if (storedTeachers) {
      setTeachers(JSON.parse(storedTeachers));
    } else {
      setTeachers(INITIAL_TEACHERS);
      localStorage.setItem("db_teachers", JSON.stringify(INITIAL_TEACHERS));
    }

    if (storedSchedules) {
      try {
        const parsed = JSON.parse(storedSchedules) as ScheduleItem[];
        const sanitized = parsed.map(item => ({
          ...item,
          mulai: sanitizeTime(item.mulai),
          selesai: sanitizeTime(item.selesai)
        }));
        setSchedules(sanitized);
      } catch (e) {
        setSchedules(INITIAL_SCHEDULES);
      }
    } else {
      const sanitized = INITIAL_SCHEDULES.map(item => ({
        ...item,
        mulai: sanitizeTime(item.mulai),
        selesai: sanitizeTime(item.selesai)
      }));
      setSchedules(sanitized);
      localStorage.setItem("db_schedules", JSON.stringify(sanitized));
    }

    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    } else {
      setLogs(INITIAL_LOGS);
      localStorage.setItem("db_logs", JSON.stringify(INITIAL_LOGS));
    }

    if (storedApiUrl) {
      setApiUrl(storedApiUrl);
      setApiConnected(true);
    }

    // 2. Load selected teacher from localStorage (Requirement 1)
    const storedSelected = localStorage.getItem("selectedTeacher") || "";
    setSelectedTeacherState(storedSelected);

    // 3. Hidden Admin Route Detection (Requirement 2)
    // Checks if path contains '/admin', hash is '#admin', or search query contains 'admin=true' or 'role=admin'
    const currentUrl = window.location.href;
    if (
      currentUrl.includes("/admin") || 
      window.location.hash.includes("admin") || 
      window.location.search.includes("admin=true") ||
      window.location.search.includes("role=admin")
    ) {
      setIsAdmin(true);
    }
  }, []);

  // --- SAVE WRAPPERS ---
  const saveTeachers = (data: Teacher[]) => {
    setTeachers(data);
    localStorage.setItem("db_teachers", JSON.stringify(data));
  };

  const saveSchedules = (data: ScheduleItem[]) => {
    const sanitized = data.map(item => ({
      ...item,
      mulai: sanitizeTime(item.mulai),
      selesai: sanitizeTime(item.selesai)
    }));
    setSchedules(sanitized);
    localStorage.setItem("db_schedules", JSON.stringify(sanitized));
  };

  const saveLogs = (data: LogIzinItem[]) => {
    setLogs(data);
    localStorage.setItem("db_logs", JSON.stringify(data));
  };

  // Requirement 1: Save selected teacher to localStorage so all page filters match
  const setSelectedTeacher = (name: string) => {
    setSelectedTeacherState(name);
    localStorage.setItem("selectedTeacher", name);
  };

  // Sync headerSearch when selectedTeacher changes
  useEffect(() => {
    setHeaderSearch(selectedTeacher);
  }, [selectedTeacher]);

  // Click outside listener for header autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerSuggestionsRef.current && !headerSuggestionsRef.current.contains(event.target as Node)) {
        setShowHeaderSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- API SYNC FUNCTION (Google Apps Script integration) ---
  const fetchFromAppsScript = async (customUrl?: string) => {
    const targetUrl = (customUrl !== undefined ? customUrl : apiUrl)?.trim();
    if (!targetUrl) return false;

    setIsLoadingApi(true);
    setApiError("");

    // 1. Validasi Tipe URL Google Apps Script agar user tidak bingung
    if (!targetUrl.startsWith("https://script.google.com/")) {
      setApiError("⚠️ Tautan tidak valid. URL harus dimulai dengan 'https://script.google.com/'.");
      setIsLoadingApi(false);
      setApiConnected(false);
      return false;
    }

    if (targetUrl.includes("/edit") || targetUrl.includes("/home")) {
      setApiError("⚠️ Salah Salin Tautan! Anda memasukkan URL Editor Skrip (berakhiran '/edit'). Di editor Apps Script, silakan klik 'Terapkan' (Deploy) -> 'Penerapan baru' (New deployment), lalu salin 'URL Aplikasi Web' yang berakhiran '/exec'.");
      setIsLoadingApi(false);
      setApiConnected(false);
      return false;
    }

    if (!targetUrl.endsWith("/exec") && !targetUrl.includes("/exec?")) {
      setApiError("⚠️ Tautan Kurang Tepat. URL Aplikasi Web Google Apps Script yang valid harus diakhiri dengan '/exec'.");
      setIsLoadingApi(false);
      setApiConnected(false);
      return false;
    }

    try {
      // Perform GET request
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      const data = await response.json();

      // Tangani error spesifik dari kode Google Apps Script backend
      if (data && data.status === "error") {
        throw new Error(data.message || "Kesalahan internal di Google Apps Script.");
      }
      
      // Structure verification
      // Needs: Jadwal, Master_Guru, Log_Izin
      if (data && (data.Master_Guru || data.Jadwal || data.Log_Izin)) {
        const masterGuru = data.Master_Guru || [];
        const jadwal = data.Jadwal || [];
        const logIzin = data.Log_Izin || [];

        // Derive properties from spreadsheet columns to keep backward compatibility
        const mappedTeachers = masterGuru.map((t: any) => {
          const rawNama = t.nama !== undefined ? t.nama : (t["Nama Guru"] !== undefined ? t["Nama Guru"] : (t.nama_guru !== undefined ? t.nama_guru : (t.namaGuru !== undefined ? t.namaGuru : "")));
          const rawPanggilan = t.panggilan !== undefined ? t.panggilan : (t["Panggilan"] !== undefined ? t["Panggilan"] : (t.Panggilan !== undefined ? t.Panggilan : ""));
          const rawMapel = t.mapel_utama !== undefined ? t.mapel_utama : (t["Mapel"] !== undefined ? t["Mapel"] : (t.mapel !== undefined ? t.mapel : ""));
          const rawRumpun = t.rumpun !== undefined ? t.rumpun : (t["Rumpun"] !== undefined ? t["Rumpun"] : "");
          const rawJenjang = t.jenjang !== undefined ? t.jenjang : (t["Jenjang"] !== undefined ? t["Jenjang"] : "");
          const rawTugas = t.tugas_tambahan !== undefined ? t.tugas_tambahan : (t["Tugas Tambahan"] !== undefined ? t["Tugas Tambahan"] : (t.tugas_tambahan_pns_nonpns !== undefined ? t.tugas_tambahan_pns_nonpns : ""));
          const rawKeterangan = t.keterangan !== undefined ? t.keterangan : (t["Keterangan"] !== undefined ? t["Keterangan"] : "");

          const nameStr = typeof rawNama === "string" ? rawNama.trim() : String(rawNama || "");
          const panggilanStr = typeof rawPanggilan === "string" ? rawPanggilan.trim() : (rawPanggilan ? String(rawPanggilan).trim() : null);
          const mapelStr = typeof rawMapel === "string" ? rawMapel.trim() : String(rawMapel || "");
          const rumpunStr = typeof rawRumpun === "string" ? rawRumpun.trim() : String(rawRumpun || "");
          const jenjangStr = typeof rawJenjang === "string" ? rawJenjang.trim() : String(rawJenjang || "");
          const tugasStr = typeof rawTugas === "string" ? rawTugas.trim() : String(rawTugas || "");
          const keteranganStr = typeof rawKeterangan === "string" ? rawKeterangan.trim() : String(rawKeterangan || "");

          return {
            nama: nameStr,
            panggilan: panggilanStr,
            mapel_utama: mapelStr,
            rumpun: rumpunStr,
            jenjang: jenjangStr,
            tugas_tambahan: tugasStr,
            keterangan: keteranganStr,
            wali_kelas: t.wali_kelas !== undefined ? t.wali_kelas : (t.waliKelas !== undefined ? t.waliKelas : (tugasStr.toLowerCase().includes("wali") ? keteranganStr : null)),
            pendamping_kelas: t.pendamping_kelas !== undefined ? t.pendamping_kelas : (t.pendampingKelas !== undefined ? t.pendampingKelas : (tugasStr.toLowerCase().includes("pendamping") ? keteranganStr : null)),
            is_manajemen: t.is_manajemen !== undefined ? t.is_manajemen : (t.isManajemen !== undefined ? t.isManajemen : (tugasStr.toLowerCase().includes("manajemen") || false))
          };
        });

        saveTeachers(mappedTeachers);
        saveSchedules(jadwal);
        saveLogs(logIzin);

        if (data.akun && Array.isArray(data.akun)) {
          setAccounts(data.akun);
          localStorage.setItem("db_accounts", JSON.stringify(data.akun));
        }

        setApiConnected(true);
        if (customUrl) {
          setApiUrl(customUrl);
          localStorage.setItem("db_api_url", customUrl);
        }
        return true;
      } else {
        throw new Error("Struktur data kosong atau format JSON tidak dikenal. Pastikan nama Sheet di Google Sheets Anda sesuai.");
      }
    } catch (err: any) {
      console.error("API Fetch Error:", err);
      
      let msg = err.message || "Gagal menghubungi Google Apps Script API.";
      if (msg.includes("Failed to fetch")) {
        msg = "Gagal memuat data (Failed to Fetch). Kemungkinan penyebab:\n" +
              "1. Anda belum memilih akses 'Siapa Saja' (Anyone) ketika menerapkan Apps Script.\n" +
              "2. Kebijakan CORS atau pembatasan pihak ketiga di browser Anda memblokir request.\n" +
              "3. Aplikasi Web belum berhasil dideploy ulang sebagai penerapan baru.";
      }
      setApiError(msg);
      setApiConnected(false);
      return false;
    } finally {
      setIsLoadingApi(false);
    }
  };

  // Auto-fetch from Google Sheets on mount if connected
  useEffect(() => {
    const storedApiUrl = localStorage.getItem("db_api_url");
    if (storedApiUrl) {
      fetchFromAppsScript(storedApiUrl);
    }
  }, []);

  // Reset local database back to default initial mock data
  const handleResetLocalDB = () => {
    if (window.confirm("Apakah Anda yakin ingin menyetel ulang seluruh database ke data bawaan sekolah?")) {
      saveTeachers(INITIAL_TEACHERS);
      saveSchedules(INITIAL_SCHEDULES);
      saveLogs(INITIAL_LOGS);
      setSelectedTeacher("");
      setApiUrl("");
      setApiConnected(false);
      localStorage.removeItem("db_api_url");
      alert("Database sekolah berhasil disetel ulang!");
    }
  };

  // Add substitution logs generated from the form
  const handleAddLogs = async (newLogsData: Omit<LogIzinItem, "id">[]) => {
    const createdLogs: LogIzinItem[] = newLogsData.map((item, idx) => ({
      ...item,
      id: `log-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString()
    }));

    const updatedLogs = [...createdLogs, ...logs];
    saveLogs(updatedLogs);

    // If API is configured, sync it back to Google Apps Script
    if (apiConnected && apiUrl) {
      try {
        console.log("Sending POST request to Apps Script DB:", createdLogs);
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8" // Plain text to avoid preflight issues in GAS
          },
          body: JSON.stringify(createdLogs)
        });
        if (response.ok) {
          console.log("Sync to Apps Script successful!");
          fetchFromAppsScript(apiUrl);
        } else {
          console.warn("Failed to sync with Apps Script:", response.statusText);
        }
      } catch (err) {
        console.error("Error syncing log to Apps Script:", err);
      }
    }
  };

  // Delete log item
  const handleDeleteLog = (id: string) => {
    if (window.confirm("Hapus catatan log guru pengganti ini?")) {
      const updated = logs.filter(l => l.id !== id);
      saveLogs(updated);
    }
  };

  const filteredHeaderTeachers = headerSearch.trim() === ""
    ? []
    : teachers.filter(t => 
        t.nama.toLowerCase().includes(headerSearch.toLowerCase()) ||
        t.mapel_utama.toLowerCase().includes(headerSearch.toLowerCase())
      );

  const currentTeacherObj = teachers.find(t => t.nama === selectedTeacher);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, adminOnly: false },
    { id: "jadwal-lengkap", label: "Jadwal Lengkap", icon: Calendar, adminOnly: false },
    { id: "jadwal-kelas", label: "Jadwal Kelas", icon: Layers, adminOnly: false },
    { id: "list-mapel", label: "List Mapel Diajar", icon: BookOpen, adminOnly: false },
    { id: "jam-kosong-individu", label: "Jam Kosong Indiv", icon: Clock, adminOnly: false },
    { id: "tabel-jam-kosong", label: "Tabel Jam Kosong", icon: Table, adminOnly: true },
    { id: "jam-kosong-semua", label: "Jam Kosong Semua", icon: Users, adminOnly: true },
    { id: "rekap-guru", label: "Rekap Guru (Admin)", icon: ClipboardList, adminOnly: true },
    { id: "input-pengganti", label: "Input Inval (Admin)", icon: UserPlus, adminOnly: true },
    { id: "log-pengganti", label: "Log Izin & WA", icon: History, adminOnly: true },
    { id: "statistik", label: "Statistik", icon: BarChart2, adminOnly: true },
  ];

  const handleSelectHeaderTeacher = (teacherName: string) => {
    setSelectedTeacher(teacherName);
    setHeaderSearch(teacherName);
    setShowHeaderSuggestions(false);
  };

  const handleClearHeaderTeacher = () => {
    setSelectedTeacher("");
    setHeaderSearch("");
    setShowHeaderSuggestions(false);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
        <div className="p-6 flex flex-col h-full justify-between">
          <div>
            <div 
              onClick={() => {
                setActivePage("dashboard");
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 mb-8 cursor-pointer group"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold transition-transform group-hover:scale-105">
                S
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">SISKA v2.0</h1>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                // Soft hide if adminOnly and not admin, but keep selectable if they click on it
                const showItem = !item.adminOnly || isAdmin;
                
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => {
                      setActivePage(item.id as ActivePage);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    } ${!showItem ? "opacity-50 border-dashed border border-slate-100" : ""}`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                    {item.adminOnly && !isAdmin && (
                      <span className="ml-auto text-[8px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded uppercase font-bold">Lock</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Admin Toggle Area */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Admin Mode</span>
              <button
                id="sidebar-admin-toggle"
                onClick={() => {
                  if (isAdmin) {
                    setIsAdmin(false);
                    setAdminUser(null);
                    localStorage.removeItem("db_admin_user");
                  } else {
                    setShowLoginModal(true);
                  }
                }}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none ${
                  isAdmin ? "bg-blue-600" : "bg-slate-200"
                }`}
                title={isAdmin ? "Matikan Mode Admin" : "Aktifkan Mode Admin"}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform duration-200 ${
                  isAdmin ? "translate-x-4" : "translate-x-0"
                }`} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {isAdmin ? `Admin: ${adminUser?.nama || "Aktif"}` : "Mode tamu hanya baca"}
            </p>
          </div>
        </div>
      </aside>

      {/* MOBILE SLIDE-OUT DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer content */}
          <div className="relative flex w-64 max-w-xs flex-col bg-white p-6 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  S
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">SISKA v2.0</h1>
              </div>
              <button
                id="close-mobile-menu-btn"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1.5 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                const showItem = !item.adminOnly || isAdmin;
                
                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-${item.id}`}
                    onClick={() => {
                      setActivePage(item.id as ActivePage);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md font-medium text-sm transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    } ${!showItem ? "opacity-50" : ""}`}
                  >
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Admin Mode</span>
                <button
                  id="mobile-admin-toggle"
                  onClick={() => {
                    if (isAdmin) {
                      setIsAdmin(false);
                      setAdminUser(null);
                      localStorage.removeItem("db_admin_user");
                    } else {
                      setShowLoginModal(true);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none ${
                    isAdmin ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform duration-200 ${
                    isAdmin ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                {isAdmin ? `Admin: ${adminUser?.nama || "Aktif"}` : "Mode tamu hanya baca"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* GLOBAL TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 md:px-8 flex items-center justify-between gap-4 shrink-0 z-30">
          
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              id="open-mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Global Search Autocomplete Bar */}
            <div className="relative w-64 sm:w-80 md:w-96" ref={headerSuggestionsRef}>
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                id="global-teacher-search-input"
                type="text" 
                placeholder="Cari Nama Guru... (Autocomplete)" 
                className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white text-slate-800 transition-all"
                value={headerSearch}
                onChange={(e) => {
                  setHeaderSearch(e.target.value);
                  setShowHeaderSuggestions(true);
                }}
                onFocus={() => setShowHeaderSuggestions(true)}
              />
              {headerSearch && (
                <button
                  id="clear-global-search-btn"
                  onClick={handleClearHeaderTeacher}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all"
                  title="Bersihkan pilihan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Suggestions dropdown */}
              {showHeaderSuggestions && filteredHeaderTeachers.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredHeaderTeachers.map((teacher) => (
                    <button
                      key={teacher.nama}
                      id={`global-suggest-${teacher.nama.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => handleSelectHeaderTeacher(teacher.nama)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50/50 flex flex-col transition-colors group"
                    >
                      <span className="font-semibold text-xs sm:text-sm text-slate-700 group-hover:text-blue-600 transition-colors">
                        {teacher.nama}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {teacher.mapel_utama} | {teacher.jenjang} {teacher.wali_kelas ? `| Wali ${teacher.wali_kelas}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showHeaderSuggestions && headerSearch.trim() !== "" && filteredHeaderTeachers.length === 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center text-slate-500 text-xs">
                  Tidak ada guru "{headerSearch}"
                </div>
              )}
            </div>
          </div>

          {/* Header Right Content */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            
            {/* Database Refresh Button */}
            {apiUrl && (
              <button
                id="header-refresh-db-btn"
                onClick={async () => {
                  const success = await fetchFromAppsScript(apiUrl);
                  if (success) {
                    alert("Database berhasil disinkronkan dan diperbarui dari Google Sheets!");
                  } else {
                    alert("Gagal menyegarkan database. Silakan periksa koneksi Anda.");
                  }
                }}
                disabled={isLoadingApi}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-blue-50 hover:bg-blue-100 disabled:bg-slate-50 text-blue-700 disabled:text-slate-400 border border-blue-200 disabled:border-slate-200 shadow-xs transition-all cursor-pointer"
                title="Segarkan Data dari Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLoadingApi ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh Data</span>
              </button>
            )}

            {/* Apps Script Sync Status indicator */}
            {isAdmin && (
              <button
                id="header-sync-api-btn"
                onClick={() => setShowConfigModal(true)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all border ${
                  apiConnected 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
                title="Integrasi REST API Google Sheets"
              >
                {apiConnected ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Linked</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Local DB</span>
                  </>
                )}
              </button>
            )}

            {/* Selected Teacher Pill Info */}
            {currentTeacherObj ? (
              <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[140px]">{currentTeacherObj.nama}</p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                    {currentTeacherObj.mapel_utama} • {currentTeacherObj.jenjang}
                  </p>
                </div>
                <div 
                  className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0"
                  title={`${currentTeacherObj.nama} - ${currentTeacherObj.mapel_utama}`}
                >
                  {currentTeacherObj.nama[0]}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200 text-slate-400 text-xs italic hidden md:flex">
                <span>Pilih guru untuk memfilter</span>
              </div>
            )}

          </div>

        </header>

        {/* PAGE CONTENT CONTAINER */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Dynamic Page Routing */}
            {activePage === "dashboard" && (
              <Dashboard 
                teachers={teachers}
                schedules={schedules}
                selectedTeacher={selectedTeacher}
                setSelectedTeacher={setSelectedTeacher}
                isAdmin={isAdmin}
                setPage={setActivePage}
              />
            )}

            {activePage === "jadwal-lengkap" && (
              <JadwalLengkap 
                teachers={teachers}
                schedules={schedules}
                selectedTeacher={selectedTeacher}
                setSelectedTeacher={setSelectedTeacher}
                onBack={() => setActivePage("dashboard")}
              />
            )}

            {activePage === "jadwal-kelas" && (
              <JadwalKelas 
                teachers={teachers}
                schedules={schedules}
                isAdmin={isAdmin}
                onUpdateSchedules={saveSchedules}
                onBack={() => setActivePage("dashboard")}
              />
            )}

            {activePage === "list-mapel" && (
              <ListMapel 
                teachers={teachers}
                schedules={schedules}
                selectedTeacher={selectedTeacher}
                setSelectedTeacher={setSelectedTeacher}
                onBack={() => setActivePage("dashboard")}
              />
            )}

            {activePage === "jam-kosong-individu" && (
              <JamKosongIndividu 
                teachers={teachers}
                schedules={schedules}
                selectedTeacher={selectedTeacher}
                setSelectedTeacher={setSelectedTeacher}
                onBack={() => setActivePage("dashboard")}
              />
            )}

            {activePage === "tabel-jam-kosong" && (
              isAdmin ? (
                <TabelJamKosong 
                  teachers={teachers}
                  schedules={schedules}
                  onBack={() => setActivePage("dashboard")}
                />
              ) : (
                <AdminOnlyFallback onBack={() => setActivePage("dashboard")} />
              )
            )}

            {activePage === "jam-kosong-semua" && (
              isAdmin ? (
                <JamKosongSemua 
                  teachers={teachers}
                  schedules={schedules}
                  onBack={() => setActivePage("dashboard")}
                />
              ) : (
                <AdminOnlyFallback onBack={() => setActivePage("dashboard")} />
              )
            )}

            {activePage === "rekap-guru" && (
              isAdmin ? (
                <RekapGuru 
                  teachers={teachers}
                  schedules={schedules}
                  onBack={() => setActivePage("dashboard")}
                  setSelectedTeacher={setSelectedTeacher}
                  setActivePage={setActivePage}
                />
              ) : (
                <AdminOnlyFallback onBack={() => setActivePage("dashboard")} />
              )
            )}

            {activePage === "input-pengganti" && (
              isAdmin ? (
                <InputGuruPengganti 
                  teachers={teachers}
                  schedules={schedules}
                  logs={logs}
                  onAddLogs={handleAddLogs}
                  onBack={() => setActivePage("dashboard")}
                />
              ) : (
                <AdminOnlyFallback onBack={() => setActivePage("dashboard")} />
              )
            )}

            {activePage === "log-pengganti" && (
              isAdmin ? (
                <LogGuruPengganti 
                  logs={logs}
                  onDeleteLog={handleDeleteLog}
                  onBack={() => setActivePage("dashboard")}
                />
              ) : (
                <AdminOnlyFallback onBack={() => setActivePage("dashboard")} />
              )
            )}

            {activePage === "statistik" && (
              isAdmin ? (
                <StatistikGuruPengganti 
                  logs={logs}
                  onBack={() => setActivePage("dashboard")}
                />
              ) : (
                <AdminOnlyFallback onBack={() => setActivePage("dashboard")} />
              )
            )}

          </div>

          {/* Minimalist Sub-Footer */}
          <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p className="font-semibold text-slate-500">SISKA © 2026 • Sistem Informasi Akademik & Inval Sekolah</p>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <>
                  <button 
                    id="footer-btn-reset" 
                    onClick={handleResetLocalDB} 
                    className="hover:text-red-600 text-red-500 transition-colors font-bold"
                  >
                    Setel Ulang DB
                  </button>
                  <span>•</span>
                </>
              )}
              <button 
                id="footer-btn-admin-route"
                onClick={() => {
                  setIsAdmin(true);
                  alert("Mode Admin Terbuka!");
                }} 
                className="hover:text-blue-600 font-bold transition-colors"
              >
                Rute Login (/admin)
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Configuration / Sync API modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                Integrasi REST API Google Apps Script
              </h3>
              <button 
                id="close-sync-modal-btn"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Integrasikan database aplikasi ini langsung ke Google Sheets sekolah via Google Apps Script Web App URL. JSON harus mengandung array: <strong>Master_Guru</strong>, <strong>Jadwal</strong>, dan <strong>Log_Izin</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600">Web App API URL</label>
              <input
                id="api-url-input"
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full bg-slate-50 text-xs border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 focus:outline-none transition-colors"
              />
            </div>

            {apiError && (
              <p className="text-[11px] text-red-600 font-semibold bg-red-50 border border-red-100 p-2 rounded-lg">
                ⚠️ Error: {apiError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 text-xs">
              <div className="flex gap-2 ml-auto">
                <button
                  id="disconnect-api-btn"
                  type="button"
                  onClick={() => {
                    setApiUrl("");
                    setApiConnected(false);
                    localStorage.setItem("db_api_url", "");
                    setShowConfigModal(false);
                  }}
                  className="px-3 py-1.5 hover:bg-slate-100 text-slate-500 font-semibold rounded-lg transition-colors"
                >
                  Putuskan Sambungan
                </button>

                <button
                  id="connect-api-btn"
                  type="button"
                  onClick={async () => {
                    if (apiUrl) {
                      const success = await fetchFromAppsScript(apiUrl);
                      if (success) {
                        setShowConfigModal(false);
                        alert("Database berhasil terhubung dan disinkronkan dengan Google Sheets!");
                      }
                    } else {
                      alert("Masukkan URL API terlebih dahulu.");
                    }
                  }}
                  disabled={isLoadingApi}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {isLoadingApi && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isLoadingApi ? "Menghubungkan..." : "Hubungkan & Ambil Data"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border border-slate-200 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                <LogIn className="w-4 h-4 text-blue-600" />
                Login Administrator
              </h3>
              <button 
                id="close-login-modal-btn"
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginError("");
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setLoginError("");
                const trimmedId = loginId.trim().toLowerCase();
                const trimmedPassword = loginPassword.trim();
                
                // Search in both currently set accounts (e.g. from Sheets API) AND INITIAL_ACCOUNTS fallback
                const matched = accounts.find(
                  (acc) => String(acc.id || "").trim().toLowerCase() === trimmedId && String(acc.password || "").trim() === trimmedPassword
                ) || INITIAL_ACCOUNTS.find(
                  (acc) => String(acc.id || "").trim().toLowerCase() === trimmedId && String(acc.password || "").trim() === trimmedPassword
                );

                if (matched) {
                  setIsAdmin(true);
                  setAdminUser(matched);
                  localStorage.setItem("db_admin_user", JSON.stringify(matched));
                  setShowLoginModal(false);
                  setLoginId("");
                  setLoginPassword("");
                  alert(`Selamat datang kembali, ${matched.nama}!`);
                } else {
                  setLoginError("ID atau Password salah. Silakan coba lagi.");
                }
              }} 
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="block font-bold text-slate-600">ID Pengguna (Username)</label>
                <input
                  id="login-id-input"
                  type="text"
                  required
                  placeholder="Masukkan ID..."
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Kata Sandi (Password)</label>
                <input
                  id="login-password-input"
                  type="password"
                  required
                  placeholder="Masukkan password..."
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 focus:outline-none transition-colors"
                />
              </div>

              {loginError && (
                <p className="text-[11px] text-red-600 font-semibold bg-red-50 border border-red-100 p-2 rounded-lg">
                  ⚠️ {loginError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  id="cancel-login-btn"
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginError("");
                  }}
                  className="px-3 py-1.5 hover:bg-slate-100 text-slate-500 font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>

                <button
                  id="submit-login-btn"
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                >
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function AdminOnlyFallback({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto shadow-sm my-8">
      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">Akses Terbatas: Admin Only</h3>
      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        Halaman ini memerlukan hak akses Administrator. Silakan masuk terlebih dahulu melalui tombol Admin di menu navigasi sebelum membuka halaman ini.
      </p>
      <button
        onClick={onBack}
        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all"
      >
        Kembali ke Dashboard
      </button>
    </div>
  );
}
