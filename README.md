# downland — düzeltilmiş sürüm

Bu sürüm, eski HTML'deki sahte indirme animasyonunu kaldırır. Gerçek metadata ve indirme için Node.js sunucusu + yt-dlp + FFmpeg kullanır.

## Gerekenler
- Node.js 18 veya üzeri
- yt-dlp güncel sürümü
- FFmpeg (yt-dlp'nin ayrı video ve ses akışlarını MP4'e birleştirmesi ve MP3 dönüştürmesi için)

## Windows kurulumu
1. Node.js kurun.
2. yt-dlp ve FFmpeg kurun ve PATH'e ekleyin.
   - Python varsa: `py -m pip install -U yt-dlp`
   - FFmpeg'i kurup `ffmpeg.exe` ve `ffprobe.exe` dosyalarının PATH içinde olduğundan emin olun.
3. Bu klasörde terminal açın:
   `npm install`
4. Başlatın:
   `npm start`
5. Tarayıcıdan `http://localhost:3000` adresini açın.

yt-dlp PATH'te değilse:
`set YTDLP_PATH=C:\tam\yol\yt-dlp.exe`
FFmpeg PATH'te değilse:
`set FFMPEG_LOCATION=C:\tam\yol\ffmpeg\bin`

## Neler düzeldi?
- YouTube, TikTok ve Instagram için metadata sunucudan istenir.
- Başlık, yayıncı, kullanıcı/kanal kimliği, açıklama, kapak ve süre gerçek extractor verisinden doldurulur.
- Çözünürlükler sabit liste değildir; kaynağın sunduğu video formatlarından çıkarılır.
- İndirme, sahte Blob yerine yt-dlp ile sunucu tarafında yapılır.
- MP3 için gerçek ses çıkarma/dönüştürme kullanılır.

## Önemli sınırlar
- Bu bir statik HTML dosyası olarak tek başına çalışmaz. `file://` ile açmayın; Node sunucusunu çalıştırın.
- Instagram/TikTok'ta özel hesaplar, giriş isteyen içerikler, yaş/bölge kısıtlamaları veya platform değişiklikleri nedeniyle metadata/indirme başarısız olabilir. Bu kod giriş bilgisi toplamaz ve erişim kontrollerini aşmaya çalışmaz.
- Bazı YouTube videolarında 1080p video ve ses ayrı akışlardır; FFmpeg gereklidir.
- Yalnızca indirme hakkına sahip olduğunuz veya platformun indirmeye izin verdiği içerikleri indirin.
- İnternete açacaksanız HTTPS, hız sınırı, eşzamanlı indirme sınırı, dosya boyutu limiti ve kötüye kullanım koruması ekleyin. Bu örnek yerel kullanım içindir.


## Ücretsiz Render'a yükleme (PC sunucu olarak çalışmaz)
1. ZIP'i çıkarın ve içindeki dosyaları GitHub'da yeni bir repository'ye yükleyin.
2. Render hesabı açın: https://render.com/
3. Dashboard > New > Web Service > GitHub repository'nizi bağlayın.
4. Runtime olarak Docker algılanmalı; `Dockerfile` proje kökünde olmalı.
5. Plan olarak Free seçin ve deploy edin. `render.yaml` bu ayarları otomatik tanımlamak için eklendi.
6. Deploy tamamlanınca Render'ın verdiği `https://...onrender.com` adresini açın.

Ücretsiz Render servisi 15 dakika trafik almazsa uykuya geçer; ilk sonraki açılış yaklaşık bir dakika sürebilir. 512 MB RAM ve 0.1 CPU gibi sınırlamalar nedeniyle büyük/uzun videolar indirme sırasında başarısız olabilir. Ücretsiz plan kalıcı ve yüksek hacimli bir indirme hizmeti için uygun değildir. Servis dosya sistemi geçicidir; indirme dosyalarını kalıcı depolama için kullanmayın.
