const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const YTDLP = process.env.YTDLP_PATH || "yt-dlp";
const FFMPEG_LOCATION = process.env.FFMPEG_LOCATION;

app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));

const ALLOWED_HOSTS = [
  "youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com",
  "tiktok.com", "www.tiktok.com", "vm.tiktok.com", "vt.tiktok.com",
  "instagram.com", "www.instagram.com"
];

function validateUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error("Geçerli bir bağlantı girin."); }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Yalnızca HTTP/HTTPS bağlantıları desteklenir.");
  if (!ALLOWED_HOSTS.includes(u.hostname.toLowerCase())) throw new Error("Şimdilik yalnızca YouTube, TikTok ve Instagram bağlantıları destekleniyor.");
  return u.toString();
}

function runYtDlp(args, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const child = spawn(YTDLP, args, { windowsHide: true });
    let stdout = "", stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("İşlem zaman aşımına uğradı. Daha sonra tekrar deneyin."));
    }, timeoutMs);
    child.stdout.on("data", d => stdout += d.toString());
    child.stderr.on("data", d => stderr += d.toString());
    child.on("error", err => { clearTimeout(timer); reject(new Error(`yt-dlp başlatılamadı: ${err.message}`)); });
    child.on("close", code => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr.trim().split("\n").slice(-3).join(" ") || `yt-dlp hata kodu: ${code}`));
    });
  });
}

function cleanInfo(info) {
  const heights = [...new Set((info.formats || [])
    .filter(f => f.height && f.vcodec && f.vcodec !== "none")
    .map(f => Number(f.height))
    .filter(h => Number.isFinite(h) && h > 0))]
    .sort((a, b) => a - b);

  // Bazı siteler format listesini ayrı video/ses akışları olarak döndürür.
  if (!heights.length && info.height) heights.push(Number(info.height));

  return {
    title: info.title || "Başlıksız video",
    uploader: info.uploader || info.channel || info.creator || info.artist || "Yayıncı bilgisi bulunamadı",
    username: info.uploader_id || info.channel_id || info.creator || "",
    description: info.description || "",
    thumbnail: info.thumbnail || (info.thumbnails && info.thumbnails.at(-1)?.url) || "",
    duration: info.duration || null,
    platform: info.extractor_key || info.extractor || "Medya",
    webpage_url: info.webpage_url || "",
    heights
  };
}

app.post("/api/info", async (req, res) => {
  try {
    const url = validateUrl(req.body.url || "");
    const { stdout } = await runYtDlp([
      "--no-warnings", "--no-playlist", "--dump-single-json",
      "--skip-download", "--no-check-certificates", url
    ]);
    const info = JSON.parse(stdout);
    res.json(cleanInfo(info));
  } catch (e) {
    res.status(400).json({ error: e.message || "Video bilgileri alınamadı." });
  }
});

app.get("/api/download", async (req, res) => {
  let tempDir;
  try {
    const url = validateUrl(req.query.url || "");
    const type = req.query.type === "mp3" ? "mp3" : "video";
    const requestedHeight = Math.max(1, Math.min(4320, Number(req.query.height) || 1080));
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "downland-"));
    const output = path.join(tempDir, "download.%(ext)s");

    const args = ["--no-warnings", "--no-playlist", "--no-part", "-o", output];
    if (FFMPEG_LOCATION) args.push("--ffmpeg-location", FFMPEG_LOCATION);

    if (type === "mp3") {
      args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
    } else {
      args.push("-f", `bestvideo[height<=${requestedHeight}]+bestaudio/best[height<=${requestedHeight}]`, "--merge-output-format", "mp4");
    }
    args.push(url);

    await runYtDlp(args, 15 * 60 * 1000);
    const files = fs.readdirSync(tempDir).filter(f => !f.endsWith(".part"));
    if (!files.length) throw new Error("İndirilen dosya oluşturulamadı. Bu içerik veya format desteklenmiyor olabilir.");
    const filePath = path.join(tempDir, files[0]);
    const ext = path.extname(filePath) || (type === "mp3" ? ".mp3" : ".mp4");
    const filename = `downland_${Date.now()}${ext}`;

    res.download(filePath, filename, async err => {
      try { await fs.promises.rm(tempDir, { recursive: true, force: true }); } catch {}
      if (err && !res.headersSent) res.status(500).end("Dosya gönderilemedi.");
    });
  } catch (e) {
    if (tempDir) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }
    if (!res.headersSent) res.status(400).json({ error: e.message || "İndirme başarısız." });
  }
});

app.listen(PORT, () => console.log(`downland çalışıyor: http://localhost:${PORT}`));
