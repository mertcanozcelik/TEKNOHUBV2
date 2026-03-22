
# OTAĞ HUB | Savunma Sanayii Teknoloji Yönetim Platformu

**OTAĞ HUB**, Savunma Sanayii Başkanlığı (SSB) **Odak Teknoloji Ağları (OTAĞ)** süreçlerini dijitalleştirmek, teknoloji yol haritalarını yönetmek ve yapay zeka destekli teknik istihbarat analizleri gerçekleştirmek amacıyla geliştirilmiş yeni nesil bir web ve masaüstü uygulamasıdır.

![Status](https://img.shields.io/badge/Status-Active_Development-emerald)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Tech](https://img.shields.io/badge/Tech-React_19_|_Vite_|_Supabase_|_Gemini_AI-0f172a)

---

## 🚀 Proje Hakkında

Bu platform, savunma sanayiindeki kritik teknolojilerin (Kuantum, Yapay Zeka, Kompozit vb.) olgunluk seviyelerini takip etmek, uzmanların görüşlerini toplamak ve stratejik kararlar almak için tasarlanmıştır.

**Temel Yetenekler:**
*   **Teknoloji Yol Haritası Yönetimi:** Lansman, Öneri Toplama ve Nihai Liste süreçlerinin dijital yönetimi.
*   **Konu Önceliklendirme Matrisi:** İnsan kaynağı, altyapı, kritiklik ve çift kullanım gibi kriterlere göre otomatik puanlama.
*   **Yapay Zeka Destekli Araştırma:** Google Gemini modelleri kullanılarak akademik formatta teknoloji raporları oluşturma.
*   **Küresel Gündem:** Onaylanan raporların tüm ekosistemle paylaşılması.
*   **Rol Tabanlı Erişim (RBAC):** Yönetici ve Kullanıcı rolleri ile güvenli veri erişimi.

---

## 🛠️ Kullanılan Teknolojiler ve Mimari

Proje, **Modern Frontend (SPA)** mimarisi üzerine kurulmuş olup, veri yönetimi için hibrit (Bulut/Lokal) bir yapı kullanmaktadır.

### 1. Çekirdek Teknolojiler (Core Stack)
*   **Runtime & Build:** [Vite v7](https://vitejs.dev/) üzerinde çalışan [React v19](https://react.dev/).
*   **Dil:** [TypeScript](https://www.typescriptlang.org/) (Tip güvenliği ve intellisense için).
*   **UI Framework:** [Tailwind CSS v3.4](https://tailwindcss.com/) (Utility-first CSS yaklaşımı).
*   **İkon Seti:** [Lucide React](https://lucide.dev/).

### 2. Veri ve Backend Mimarisi (BaaS)
*   **Veritabanı:** [Supabase](https://supabase.com/) (PostgreSQL).
*   **Güvenlik:** Row Level Security (RLS) politikaları ile veri izolasyonu.
*   **Servis Katmanı (`apiService.ts`):** 
    *   Tüm veritabanı işlemleri tek bir servis sınıfında toplanmıştır.
    *   **Fallback Mekanizması:** İnternet bağlantısı yoksa veya Supabase erişilemezse otomatik olarak `localStorage` üzerindeki verilerle çalışır (Offline-First yaklaşımı).

### 3. Yapay Zeka Entegrasyonu (GenAI)
*   **SDK:** `@google/genai` v1.38.
*   **Metin Modeli:** `gemini-3-flash-preview` (Yüksek hızlı ve akademik dil yeteneği için).
*   **Görüntü Modeli:** `gemini-2.5-flash-image` (Kullanıcı profilleri için AI Avatar oluşturma).
*   **Prompt Engineering:** SSB standartlarına uygun, akademik dilde çıktı üreten özel sistem talimatları (`Research.tsx`).

### 4. Platform Destekleri
*   **PWA (Progressive Web App):** `sw.js` ve `manifest.json` ile tarayıcı üzerinden kurulabilir, çevrimdışı çalışabilir.
*   **Electron (Desktop):** `electron-main.js` ile Windows/Linux/MacOS üzerinde native masaüstü uygulaması olarak çalıştırılabilir.

---

## 📂 Proje Yapısı

```bash
/
├── components/       # Yeniden kullanılabilir UI bileşenleri (Layout, Kartlar vb.)
├── context/          # React Context API (AuthContext - Oturum yönetimi)
├── pages/            # Sayfa bileşenleri (Dashboard, Roadmaps, Research vb.)
├── services/         # API çağrıları ve iş mantığı (apiService.ts)
├── types.ts          # TypeScript tip tanımları ve arayüzler
├── sw.js             # Service Worker (PWA ve Cache yönetimi)
├── electron-main.js  # Masaüstü uygulama giriş noktası
└── index.html        # Giriş sayfası
```

---

## 🔐 Güvenlik Metodolojileri

Proje, savunma sanayii standartlarına uygun güvenlik önlemleri içermektedir:

1.  **Row Level Security (RLS):** Veritabanı seviyesinde, kullanıcıların sadece yetkili oldukları OTAĞ verilerini görmesi sağlanır.
2.  **Input Sanitization:** AI çıktılarının render edilmesi sırasında potansiyel XSS saldırılarına karşı HTML temizliği.
3.  **Role Based Access Control (RBAC):** Admin ve User yetkileri `AuthContext` ve veritabanı profilleri üzerinden yönetilir.
4.  **Rate Limiting:** AI servislerine yapılan isteklerde aşırı yüklenmeyi önleyen istemci tarafı kontrolleri.

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
*   Node.js (v18+)
*   NPM veya Yarn

### 1. Geliştirme Ortamı (Web)
```bash
# Bağımlılıkları yükle
npm install

# Projeyi başlat
npm run dev
```

### 2. Masaüstü Uygulaması (Electron)
```bash
# Electron sürümünü başlat
npm run electron:start

# Build (exe/dmg oluşturma)
npm run electron:build
```

### 3. Docker ile Dağıtım
```bash
docker-compose up --build
```

---

## ⚙️ Konfigürasyon (.env)

Projenin çalışması için aşağıdaki çevre değişkenlerinin tanımlanması gerekir:

```env
VITE_SUPABASE_URL=https://sizin-proje-id.supabase.co
VITE_SUPABASE_ANON_KEY=sizin-anon-key
API_KEY=google-gemini-api-key
```
*Not: API anahtarları `Settings` sayfasından dinamik olarak da girilebilir.*

---

## 📊 Veritabanı Şeması

*   **profiles:** Kullanıcı bilgileri, roller ve OTAĞ yetkileri.
*   **roadmaps:** OTAĞ projeleri, takvim ve durum (Lansman/Öneri/Nihai).
*   **issues:** Teknoloji konuları, TRL seviyeleri ve önceliklendirme matrisi.
*   **participant_forms:** Uzmanların yetkinlik bildirim formları.
*   **saved_reports:** AI tarafından üretilen ve kaydedilen raporlar.

---

**Geliştirici:** [SSB Teknoloji Yönetim Ekibi]
**Lisans:** Özel / Kurumsal
