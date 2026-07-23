/**
 * ====================================================================
 * GOOGLE APPS SCRIPT - API BACKEND UNTUK SISKA v2.0
 * ====================================================================
 * Hubungkan Google Sheets Anda ke aplikasi SISKA dengan script ini.
 * 
 * PETUNJUK INSTALASI:
 * 1. Di Google Sheets Anda, klik Menu "Ekstensi" -> "Apps Script".
 * 2. Hapus semua kode default di dalam editor.
 * 3. Copy-Paste seluruh kode di bawah ini ke dalam editor Apps Script.
 * 4. Ganti SHEET_ID_CONFRIMED jika diperlukan, atau biarkan kosong jika script ini
 *    ditempel langsung pada Spreadsheet aktif (rekomendasi).
 * 5. Klik ikon Save (Disket).
 * 6. Klik tombol "Terapkan" (Deploy) di kanan atas -> Pilih "Penerapan baru" (New Deployment).
 * 7. Pilih tipe penerapan: "Aplikasi Web" (Web App).
 * 8. Setelan Aplikasi Web:
 *    - Deskripsi: SISKA API v2
 *    - Jalankan sebagai: Saya (Email Anda)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone) -> SANGAT PENTING!
 * 9. Klik "Terapkan" (Deploy). Berikan izin akses Google Drive jika diminta.
 * 10. Copy "URL Aplikasi Web" yang dihasilkan, lalu masukkan ke kolom API URL 
 *     di pojok kanan atas aplikasi SISKA Anda.
 */

// Ganti dengan ID Spreadsheet Anda jika diletakkan di luar Spreadsheet bersangkutan.
// Jika ditempel langsung pada Apps Script Spreadsheet bersangkutan, biarkan kosong ""
const SPREADSHEET_ID = "";

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {
    // ignore
  }
  throw new Error("Spreadsheet tidak terdeteksi. Jika Anda menggunakan Skrip Mandiri (Standalone Script di script.google.com), Anda WAJIB menyalin ID Spreadsheet Anda dari browser URL dan memasukkannya ke dalam variabel SPREADSHEET_ID di baris ke-27 Code.gs.");
}

/**
 * Endpoint GET: Membaca data dari Google Sheets dan mengirimkan format JSON ke Client
 */
function doGet(e) {
  try {
    const ss = getSpreadsheet();
    
    // Inisialisasi Sheet jika belum ada (Auto-Create agar user tidak repot)
    initSheetsIfMissing(ss);

    // 1. Ambil data Master Guru dengan mapping alias robust
    const masterGuruData = getSheetDataAsObjects(ss, "Master Guru", {
      "Nama Guru": "nama", "Nama": "nama", "Guru": "nama", "Nama_Guru": "nama", "Teacher": "nama",
      "Mapel": "mapel_utama", "Mata Pelajaran": "mapel_utama", "Subject": "mapel_utama", "Mapel Utama": "mapel_utama", "Mapel_Utama": "mapel_utama",
      "Rumpun": "rumpun", "Rumpun Mapel": "rumpun", "Cluster": "rumpun", "Rumpun_Mapel": "rumpun",
      "Jenjang": "jenjang", "Level": "jenjang", "Grade": "jenjang",
      "Tugas Tambahan": "tugas_tambahan", "Tugas": "tugas_tambahan", "Additional Task": "tugas_tambahan", "Role": "tugas_tambahan", "Tugas_Tambahan": "tugas_tambahan",
      "Keterangan": "keterangan", "Keterangan Tambahan": "keterangan", "Note": "keterangan", "Description": "keterangan", "Ket": "keterangan"
    });

    // 2. Ambil data Jadwal dengan mapping alias robust
    const jadwalData = getSheetDataAsObjects(ss, "Jadwal", {
      "kelas": "kelas", "class": "kelas", "room": "kelas", "ruang": "kelas",
      "hari": "hari", "day": "hari",
      "jamke": "jam_ke", "jam ke": "jam_ke", "jam_ke": "jam_ke", "period": "jam_ke", "hour": "jam_ke",
      "mulai": "mulai", "start": "mulai", "waktu mulai": "mulai", "waktu_mulai": "mulai",
      "selesai": "selesai", "end": "selesai", "waktu selesai": "selesai", "waktu_selesai": "selesai",
      "mata pelajaran": "mapel", "mapel": "mapel", "subject": "mapel", "mata_pelajaran": "mapel",
      "guru1": "guru1", "guru 1": "guru1", "guru_1": "guru1", "teacher 1": "guru1",
      "guru2": "guru2", "guru 2": "guru2", "guru_2": "guru2", "teacher 2": "guru2",
      "guru3": "guru3", "guru 3": "guru3", "guru_3": "guru3", "teacher 3": "guru3",
      "guru4": "guru4", "guru 4": "guru4", "guru_4": "guru4", "teacher 4": "guru4",
      "guru5": "guru5", "guru 5": "guru5", "guru_5": "guru5", "teacher 5": "guru5",
      "guru6": "guru6", "guru 6": "guru6", "guru_6": "guru6", "teacher 6": "guru6",
      "kelasgabung": "kelasgabung", "kelas gabung": "kelasgabung", "kelas_gabung": "kelasgabung", "gabung": "kelasgabung", "merged": "kelasgabung",
      "selainguru1_mengawas": "selainguru1_mengawas", "selainguru1 mengawas": "selainguru1_mengawas", "selain guru 1 mengawas": "selainguru1_mengawas",
      "keterangan_khusus": "keterangan_khusus", "keterangan khusus": "keterangan_khusus"
    });

    // 3. Ambil data Log Izin dengan mapping alias robust
    const logIzinData = getSheetDataAsObjects(ss, "Log_Izin", {
      "tanggal": "tanggal", "date": "tanggal",
      "jamke": "jam_ke", "jam ke": "jam_ke", "jam_ke": "jam_ke", "period": "jam_ke",
      "guru_izin": "guru_izin", "guru izin": "guru_izin", "nama_guru_izin": "guru_izin", "teacher_out": "guru_izin",
      "kelas": "kelas", "class": "kelas",
      "mapel": "mapel", "subject": "mapel", "mata pelajaran": "mapel",
      "guru_ganti": "guru_pengganti", "guru ganti": "guru_pengganti", "guru_pengganti": "guru_pengganti", "guru pengganti": "guru_pengganti", "substitute": "guru_pengganti", "substitute_teacher": "guru_pengganti",
      "alasan": "alasan", "reason": "alasan", "keterangan": "alasan",
      "tugas": "tugas", "task": "tugas", "link": "tugas", "keterangan tugas": "tugas", "keterangan_tugas": "tugas"
    });

    // 4. Ambil data Jadwal_Insidental dengan mapping alias robust
    const jadwalInsidentalData = getSheetDataAsObjects(ss, "Jadwal_Insidental", {
      "tanggal": "tanggal", "date": "tanggal",
      "kelas": "kelas", "class": "kelas", "room": "kelas", "ruang": "kelas",
      "jamke": "jam_ke", "jam ke": "jam_ke", "jam_ke": "jam_ke", "period": "jam_ke", "hour": "jam_ke",
      "mata pelajaran": "mapel", "mapel": "mapel", "subject": "mapel", "mata_pelajaran": "mapel",
      "guru1": "guru1", "guru 1": "guru1", "guru_1": "guru1", "teacher 1": "guru1",
      "guru2": "guru2", "guru 2": "guru2", "guru_2": "guru2", "teacher 2": "guru2",
      "guru3": "guru3", "guru 3": "guru3", "guru_3": "guru3", "teacher 3": "guru3",
      "guru4": "guru4", "guru 4": "guru4", "guru_4": "guru4", "teacher 4": "guru4",
      "guru5": "guru5", "guru 5": "guru5", "guru_5": "guru5", "teacher 5": "guru5",
      "guru6": "guru6", "guru 6": "guru6", "guru_6": "guru6", "teacher 6": "guru6",
      "keterangan khusus": "keterangan_khusus", "keterangan_khusus": "keterangan_khusus", "keterangan": "keterangan_khusus", "note": "keterangan_khusus",
      "alasan": "alasan", "reason": "alasan",
      "tipe_insidental": "tipe_insidental", "tipe insidental": "tipe_insidental", "tipe": "tipe_insidental", "type": "tipe_insidental"
    });

    // 5. Ambil data Akun dengan mapping alias robust
    const akunData = getSheetDataAsObjects(ss, "akun", {
      "id": "id", "username": "id", "userid": "id",
      "password": "password", "kata sandi": "password", "sandi": "password", "pass": "password",
      "nama": "nama", "name": "nama"
    });

    // Bungkus semua data ke dalam JSON payload
    const payload = {
      status: "success",
      Master_Guru: masterGuruData,
      Jadwal: jadwalData,
      Jadwal_Insidental: jadwalInsidentalData,
      Log_Izin: logIzinData,
      akun: akunData
    };

    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint POST: Menambahkan atau menyinkronkan data dari Client ke Google Sheets
 */
function doPost(e) {
  try {
    const ss = getSpreadsheet();
    const postData = JSON.parse(e.postData.contents);
    
    // Check if this is an action request (such as delete)
    if (postData && typeof postData === "object" && !Array.isArray(postData) && postData.action) {
      if (postData.action === "delete") {
        const sheet = ss.getSheetByName("Log_Izin");
        if (!sheet) {
          throw new Error("Sheet Log_Izin tidak ditemukan!");
        }
        
        const logId = postData.id;
        const targetTanggal = postData.tanggal;
        const targetJamKe = Number(postData.jam_ke);
        const targetGuruIzin = postData.guru_izin;
        const targetKelas = postData.kelas;
        
        let deleted = false;
        let rowToDelete = -1;
        
        // Helper to parse dates robustly in GAS
        const parseDateToYYYYMMDD = function(val) {
          if (!val) return "";
          if (val instanceof Date) {
            const year = val.getFullYear();
            const month = String(val.getMonth() + 1).padStart(2, '0');
            const day = String(val.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          const str = val.toString().trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return str;
          }
          const parts = str.split(/[-\/]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else if (parts[2].length === 4) {
              return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
          try {
            const d = new Date(str);
            if (!isNaN(d.getTime())) {
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
          } catch (e) {}
          return str;
        };

        // Try to find by ID row index first as an optimization
        if (logId && logId.startsWith("Log_Izin_")) {
          const suffix = parseInt(logId.split("_").pop(), 10);
          if (!isNaN(suffix)) {
            const possibleRow = suffix + 1;
            if (possibleRow > 1 && possibleRow <= sheet.getLastRow()) {
              const rowValues = sheet.getRange(possibleRow, 1, 1, sheet.getLastColumn()).getValues()[0];
              const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
              
              // Verify it matches
              let matchCount = 0;
              let fieldsToCheck = 0;
              
              headers.forEach((header, index) => {
                const key = header.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
                const val = rowValues[index];
                
                if (key === "tanggal" && targetTanggal) {
                  fieldsToCheck++;
                  const valStr = parseDateToYYYYMMDD(val);
                  const targetStr = parseDateToYYYYMMDD(targetTanggal);
                  if (valStr && valStr === targetStr) {
                    matchCount++;
                  }
                } else if ((key === "jamke" || key === "jam_ke") && targetJamKe) {
                  fieldsToCheck++;
                  if (Number(val) === targetJamKe) {
                    matchCount++;
                  }
                } else if ((key === "guruizin" || key === "guru_izin") && targetGuruIzin) {
                  fieldsToCheck++;
                  if (val && val.toString().trim().toLowerCase() === targetGuruIzin.toString().trim().toLowerCase()) {
                    matchCount++;
                  }
                } else if (key === "kelas" && targetKelas) {
                  fieldsToCheck++;
                  if (val && val.toString().trim().toLowerCase() === targetKelas.toString().trim().toLowerCase()) {
                    matchCount++;
                  }
                }
              });
              
              if (matchCount >= Math.min(fieldsToCheck, 3) && fieldsToCheck > 0) {
                rowToDelete = possibleRow;
              }
            }
          }
        }
        
        // If not found by row index verify, search the entire sheet
        if (rowToDelete === -1) {
          const lastRow = sheet.getLastRow();
          if (lastRow >= 2) {
            const values = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
            const headers = values[0];
            
            for (let r = 1; r < values.length; r++) {
              const rowValues = values[r];
              let matchCount = 0;
              let fieldsToCheck = 0;
              
              headers.forEach((header, index) => {
                const key = header.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
                const val = rowValues[index];
                
                if (key === "tanggal" && targetTanggal) {
                  fieldsToCheck++;
                  const valStr = parseDateToYYYYMMDD(val);
                  const targetStr = parseDateToYYYYMMDD(targetTanggal);
                  if (valStr && valStr === targetStr) {
                    matchCount++;
                  }
                } else if ((key === "jamke" || key === "jam_ke") && targetJamKe) {
                  fieldsToCheck++;
                  if (Number(val) === targetJamKe) {
                    matchCount++;
                  }
                } else if ((key === "guruizin" || key === "guru_izin") && targetGuruIzin) {
                  fieldsToCheck++;
                  if (val && val.toString().trim().toLowerCase() === targetGuruIzin.toString().trim().toLowerCase()) {
                    matchCount++;
                  }
                } else if (key === "kelas" && targetKelas) {
                  fieldsToCheck++;
                  if (val && val.toString().trim().toLowerCase() === targetKelas.toString().trim().toLowerCase()) {
                    matchCount++;
                  }
                }
              });
              
              if (matchCount >= Math.min(fieldsToCheck, 3) && fieldsToCheck > 0) {
                rowToDelete = r + 1;
                break; // Found the first matching row
              }
            }
          }
        }
        
        if (rowToDelete !== -1) {
          sheet.deleteRow(rowToDelete);
          deleted = true;
        }
        
        if (deleted) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            message: "Log berhasil dihapus dari Google Sheets!"
          })).setMimeType(ContentService.MimeType.JSON);
        } else {
          throw new Error("Catatan log tidak ditemukan di Google Sheets untuk dihapus.");
        }
      }
    }

    // Default: Log_Izin appending (legacy behavior)
    const sheet = ss.getSheetByName("Log_Izin");
    if (!sheet) {
      throw new Error("Sheet Log_Izin tidak ditemukan!");
    }

    // Ambil baris header untuk mengidentifikasi susunan kolom
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Validasi input: bisa berupa single object atau array of objects
    const logsToAdd = Array.isArray(postData) ? postData : [postData];

    logsToAdd.forEach(logItem => {
      const row = new Array(headers.length).fill("");
      
      headers.forEach((header, index) => {
        const key = header.toLowerCase().trim();
        if (key === "tanggal") {
          row[index] = logItem.tanggal || "";
        } else if (key === "jamke" || key === "jam_ke") {
          row[index] = (logItem.jam_ke !== undefined && logItem.jam_ke !== null && logItem.jam_ke !== "") ? Number(logItem.jam_ke) : 1;
        } else if (key === "guru_izin") {
          row[index] = logItem.guru_izin || "";
        } else if (key === "kelas") {
          row[index] = logItem.kelas || "";
        } else if (key === "mapel" || key === "mata pelajaran") {
          row[index] = logItem.mapel || "";
        } else if (key === "guru_ganti" || key === "guru_pengganti") {
          row[index] = logItem.guru_pengganti || logItem.guru_ganti || "";
        } else if (key === "alasan") {
          row[index] = logItem.alasan || "";
        } else if (key === "tugas" || key === "task" || key === "keterangan tugas" || key === "keterangan_tugas") {
          row[index] = logItem.tugas || "";
        }
      });

      sheet.appendRow(row);
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: `${logsToAdd.length} log berhasil ditambahkan!`
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper: Mengonversi baris sheet menjadi Array of JSON Objects berdasarkan pemetaan header secara case-insensitive & robust
 */
function getSheetDataAsObjects(ss, sheetName, keyMapping) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const dataRange = sheet.getRange(1, 1, lastRow, lastCol);
  const values = dataRange.getValues();
  const headers = values[0];
  const rows = values.slice(1);

  // Fungsi normalisasi string agar perbandingan header tidak sensitif huruf besar/kecil & spasi
  const normalize = function(str) {
    if (!str) return "";
    return str.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  // Buat keyMapping yang ternormalisasi
  const normalizedMapping = {};
  for (let key in keyMapping) {
    normalizedMapping[normalize(key)] = keyMapping[key];
  }

  return rows.map((row, rIndex) => {
    const obj = { id: sheetName.replace(/\s+/g, '_') + "_" + (rIndex + 1) };
    
    headers.forEach((header, colIndex) => {
      const normHeader = normalize(header);
      const mappedKey = normalizedMapping[normHeader];
      
      if (mappedKey) {
        let val = row[colIndex];
        // Konversi format tanggal Google Sheets agar menjadi string YYYY-MM-DD atau HH:mm jika itu adalah waktu murni
        if (val instanceof Date) {
          const year = val.getFullYear();
          if (year === 1899 || year === 1900) {
            const hours = String(val.getHours()).padStart(2, '0');
            const minutes = String(val.getMinutes()).padStart(2, '0');
            val = `${hours}:${minutes}`;
          } else {
            const month = String(val.getMonth() + 1).padStart(2, '0');
            const day = String(val.getDate()).padStart(2, '0');
            val = `${year}-${month}-${day}`;
          }
        }
        
        // Bersihkan data jika string
        if (typeof val === "string") {
          val = val.trim();
        }
        
        // Konversi jam_ke ke tipe angka
        if (mappedKey === "jam_ke") {
          const pInt = parseInt(val, 10);
          val = !isNaN(pInt) ? pInt : val;
        }

        // Jangan over-write jika nilai baru kosong tetapi nilai lama sudah terisi (berguna jika ada alias ganda)
        if (obj[mappedKey] === undefined || obj[mappedKey] === "" || (val !== "" && val !== undefined)) {
          obj[mappedKey] = val;
        }
      }
    });

    return obj;
  });
}

/**
 * Helper: Memastikan semua sheet yang diperlukan ada, jika tidak, buat otomatis dengan template kosong
 */
function initSheetsIfMissing(ss) {
  // 1. Master Guru
  let sheet = ss.getSheetByName("Master Guru");
  if (!sheet) {
    sheet = ss.insertSheet("Master Guru");
    sheet.appendRow(["Nama Guru", "Mapel", "Rumpun", "Jenjang", "Tugas Tambahan", "Keterangan"]);
    sheet.appendRow(["ISTIQOMAH ASY SAYFULLOH, M.Pd", "Math", "Math", "SD", "Manajemen", ""]);
    sheet.appendRow(["MUHAMMAD RIJAL ABDURAHMAN, S.M.Gr.", "Math, Tematik Indo", "Math", "SD", "Wali kelas", "01 INTER 1"]);
  }

  // 2. Jadwal
  sheet = ss.getSheetByName("Jadwal");
  if (!sheet) {
    sheet = ss.insertSheet("Jadwal");
    sheet.appendRow(["kelas", "hari", "jamke", "mulai", "selesai", "mata pelajaran", "guru1", "guru2", "guru3", "guru4", "guru5", "guru6", "kelasgabung", "selainguru1_mengawas", "keterangan_khusus"]);
    sheet.appendRow(["01 INTER 1", "Senin", 1, "07:40", "08:40", "Al-Qur'an", "AHMAD ZAKI", "MR QUR'AN 1", "", "", "", "", "Tidak", "No", ""]);
    sheet.appendRow(["01 INTER 1", "Senin", 2, "08:40", "09:40", "Math", "MUHAMMAD RIJAL ABDURAHMAN, S.M.Gr.", "", "", "", "", "", "Tidak", "No", ""]);
  }

  // 3. Log_Izin
  sheet = ss.getSheetByName("Log_Izin");
  if (!sheet) {
    sheet = ss.insertSheet("Log_Izin");
    sheet.appendRow(["tanggal", "jamke", "guru_izin", "kelas", "mapel", "guru_ganti", "alasan", "tugas"]);
    sheet.appendRow(["2026-07-06", 2, "MUHAMMAD RIJAL ABDURAHMAN, S.M.Gr.", "01 INTER 1", "Math", "ISTIQOMAH ASY SAYFULLOH, M.Pd", "Sakit (Flu berat)", "https://classroom.google.com/c/sample"]);
  }

  // 4. akun
  sheet = ss.getSheetByName("akun");
  if (!sheet) {
    sheet = ss.insertSheet("akun");
    sheet.appendRow(["id", "password", "nama"]);
    sheet.appendRow(["admin", "admin", "Istiqomah As Sayfullooh"]);
  }

  // 5. Jadwal_Insidental
  sheet = ss.getSheetByName("Jadwal_Insidental");
  if (!sheet) {
    sheet = ss.insertSheet("Jadwal_Insidental");
    sheet.appendRow(["Tanggal", "kelas", "jamke", "mata pelajaran", "guru1", "guru2", "guru3", "guru4", "guru5", "guru6", "keterangan khusus", "Alasan", "Tipe_Insidental"]);
    sheet.appendRow(["2026-07-21", "01 INTER 1", 3, "Science Lab", "ISTIQOMAH ASY SAYFULLOH, M.Pd", "", "", "", "", "", "Lab IPA Lt. 2", "Pindah Ruang Sementara", "Pindah Ruang"]);
  }
}
