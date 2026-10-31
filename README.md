# Locus - Vivaryum Dijital İkiz ve Tesis Yönetim Platformu

**Locus**, Antigravity ekosisteminin (Apex Hub & Spoke mimarisi) vivaryum, deney hayvanı barındırma ve üretim tesislerini dijitalleştiren kritik "Spoke" uygulamasıdır. 

Fiziksel tesisin gerçek dünya kısıtlarını ve mimarisini **Oda > Raf > Kafes > Hayvan** hiyerarşisiyle birebir modelleyerek laboratuvar hayvanlarının konumlandırılmasını, kafes doluluk oranlarını ve tesis altyapısını gerçek zamanlı olarak takip etmeyi sağlar.

---

## 🌟 Temel Yetenekler & Özellikler

### 1. Vivaryum Dijital İkiz Hiyerarşisi (Digital Twin)
- **Oda Yönetimi (Rooms):** Fiziksel barındırma ve karantina odalarının tanımlanması, açıklamaları ve listelenmesi.
- **Raf Grid Matrisi (Racks):** Her rafın fiziksel boyutlarının (satır sayısı `rows`: 1–26, sütun sayısı `cols`: 1–50) tanımlanması. Satırlar alfabetik (`A-Z`), sütunlar numerik (`1-N`) koordinat sistemiyle adreslenir.
- **Kafes Haritası ve Yuvalama (Cages & Navigator):** Raf üzerinde dinamik 2D ızgara (grid) görünümü. Boş slotlara tek tıklamayla yeni kafes atama (`C-A1`, `C-B3` gibi otomatik isimlendirme) ve RFID/Barkod eşleştirme.
- **Hayvan Takibi (Animals):** Kafes düzeyinde tür (Fare, Sıçan, Tavşan), suş (BALB/c, C57BL/6, Wistar vb.), cinsiyet, hayvan adedi, doğum tarihi ve ilgili proje kodu takibi.

### 2. Bütünlük ve Güvenlik Mekanizmaları
- **Kaskat Silme Güvenliği (Cascading Deletes):** 
  - Bir **Oda** silindiğinde, odaya bağlı tüm raflar, bu raflardaki tüm kafesler ve içlerindeki tüm hayvan kayıtları derinlemesine (`deep cascade`) temizlenir.
  - Bir **Raf** silindiğinde, rafa bağlı tüm kafesler ve hayvan kayıtları otomatik olarak temizlenir.
  - Bir **Kafes** silindiğinde, kafesteki hayvan kayıtları güvenle temizlenir. Yetim (orphaned) kayıt oluşumu backend düzeyinde engellenmiştir.
- **Grid Sınır Aşımı Koruması (Boundary Enforcement):** 
  - Kafes eklerken `row > rack.rows` veya `column > rack.cols` ise sunucu işlemi `400 Bad Request` ile reddeder.
  - Raf boyutları küçültülürken (`PUT /api/racks`), yeni sınırların dışında kalan dolu bir kafes varsa küçültme işlemi engellenir ve kullanıcı bilgilendirilir.
- **Hücre Çakışma Önleme (Slot Overlap Prevention):** Aynı raf hücresine (`rackId`, `row`, `column`) mükerrer kafes yerleştirilmesi Zod ve MongoDB atomik sorgusuyla engellenir.
- **Rol Tabanlı Erişim Denetimi (RBAC):** Fiziksel altyapıyı değiştiren işlemler (Oda ve Raf ekleme, güncelleme, silme) sadece `admin` rolüne sahip kullanıcılara açıktır.

### 3. Ekosistem Entegrasyonu (Hub & Spoke / Apex SSO)
- **Merkezi Oturum:** Apex Hub tarafından sağlanan `interapp_session` (üretim) ve `interapp_session_test` (önizleme/test) `HttpOnly` JWT çerezleri ile kusursuz SSO.
- **Uygulama Yetki Denetimi:** Kullanıcının `apps` dizisinde `locus` izni olup olmadığı veya `admin` rolü kontrol edilir.
- **Cross-Database Proje Arama:** Deney hayvanlarına proje kodu atanırken, ekosistemin diğer spoke uygulaması olan `LabProject_db` veritabanındaki projeler ReDoS korumalı anlık arama (`/api/projects-search`) ile otomatik tamamlanır.

---

## 🛠️ Teknoloji Yığını

### Frontend
- **Kütüphane:** [React](https://react.dev/) `18.2.0` (React DOM `18.2.0`)
- **Yönlendirme:** [react-router-dom](https://reactrouter.com/) `^7.16.0` (v7)
- **Derleyici & Sunucu:** [Vite](https://vitejs.dev/) `5.1.6`
- **Stil & Tasarım:** [Tailwind CSS](https://tailwindcss.com/) `3.4.1`, [Autoprefixer](https://github.com/postcss/autoprefixer) `10.4.18`, PostCSS `8.4.35`
- **İkon Seti:** [Lucide React](https://lucide.dev/) `0.344.0`
- **Grafik & Raporlama:** [Recharts](https://recharts.org/) `3.4.1`

### Backend & Veritabanı
- **Çalışma Zamanı:** [Vercel Serverless Functions](https://vercel.com/docs/functions) (Node.js ES Modules)
- **Veritabanı Motoru:** [MongoDB](https://www.mongodb.com/) Driver `7.0.0` (Bağlantı havuzu ve global client caching)
- **Validasyon & Şema:** [Zod](https://zod.dev/) `^4.4.3` (v4)
- **Kriptografi & Güvenlik:** Node.js native `crypto` (Timing-safe HMAC-SHA256 doğrulaması)
- **Ortam Yapılandırması:** [dotenv](https://github.com/motdotla/dotenv) `17.2.3`

---

## 📁 Proje Dizin Yapısı

```bash
Locus/
├── api/                           # Vercel Serverless API Fonksiyonları
│   ├── auth/
│   │   └── session.js             # Oturum kontrolü ve çıkış (GET/POST/DELETE)
│   ├── animals.js                 # Hayvan kayıtları API (CRUD & cageId filtresi)
│   ├── cages.js                   # Kafes API (CRUD, sınır & çakışma kontrolleri)
│   ├── projects-search.js         # LabProject cross-db güvenli proje arama
│   ├── racks.js                   # Raf API (CRUD, küçülme & grid kontrolleri)
│   └── rooms.js                   # Oda API (CRUD & kaskat silme)
├── lib/                           # Backend Paylaşımlı Kütüphaneler
│   ├── auth.js                    # JWT doğrulama, RBAC ve timing-safe kontrol
│   └── mongodb.js                 # MongoClient havuzu ve db isim çözümleyici
├── src/                           # React Frontend Kodları
│   ├── components/
│   │   ├── Navigator.jsx          # Tesis > Oda > Raf > Kafes 2D interaktif haritası
│   │   └── RoomRackManager.jsx    # Oda ve Raf yönetim arayüzü (Admin)
│   ├── context/
│   │   └── AuthContext.jsx        # Apex SSO entegrasyonu ve oturum durumu
│   ├── lib/
│   │   ├── constants.js           # Tür, suş (strain) ve cinsiyet sabitleri
│   │   └── db.js                  # Frontend API istemcisi
│   ├── pages/
│   │   └── Dashboard.jsx          # Ana layout, üst menü ve rota yönlendirici
│   ├── App.jsx                    # Kök bileşen ve AuthGuard
│   ├── index.css                  # Tailwind CSS direktifleri
│   └── main.jsx                   # React DOM render ve Dev Bearer interceptor
├── vercel.json                    # Vercel yönlendirmeleri ve build ayarları
├── vite.config.js                 # Vite geliştirme ve proxy ayarları
├── package.json                   # Paket bağımlılıkları ve script'ler
├── TECHNICAL.md                   # Derinlemesine mimari ve API spesifikasyonu
└── BLUEPRINT.md                   # Ürün vizyonu, fazlar ve yol haritası
```

---

## ⚙️ Kurulum ve Çalıştırma

### Gereksinimler
- **Node.js:** v18.0.0 veya üzeri
- **npm:** v9.0.0 veya üzeri
- **MongoDB:** MongoDB Atlas kümesi veya yerel MongoDB sunucusu

### 1. Depoyu Klonlayın ve Bağımlılıkları Yükleyin
```bash
git clone <repo-url>
cd Locus
npm install
```

### 2. Çevresel Değişkenleri (.env) Yapılandırın
Kök dizinde bir `.env` (veya `.env.local`) dosyası oluşturun:
```env
# MongoDB Bağlantı URL'i (Apex_db, Locus_db ve LabProject_db'ye erişebilen kullanıcı)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# Apex SSO Paylaşımlı JWT Anahtarı
JWT_SECRET=your_jwt_secret_key_shared_with_apex

# Ortam Bilgisi (production / development)
NODE_ENV=development
```

### 3. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Uygulama varsayılan olarak `http://localhost:5173` adresinde başlatılır.

> [!TIP]
> **Yerel Geliştirici Deneyimi (Dev Mode):**
> Geliştirme modunda (`import.meta.env.DEV`), `src/main.jsx` içerisindeki yerel fetch interceptor otomatik olarak `Authorization: Bearer dev@wildtype.app` başlığı ekler. `lib/auth.js` yerel geliştirme modunda bu başlığı tanıyarak Apex veritabanındaki geliştirici kullanıcısını simüle eder.

### 4. Üretim Derlemesi ve Önizleme
```bash
npm run build
npm run preview
```

---

## 🔒 Güvenlik & Yetkilendirme Özeti

| Katman | Mekanizma | Açıklama |
| :--- | :--- | :--- |
| **Kimlik Doğrulama** | Apex SSO / JWT | `interapp_session` HttpOnly çerezi, HS256 ve timing-safe imza doğrulaması |
| **Yetki Doğrulama** | RBAC / App Scope | Kullanıcının `apps` listesinde `locus` tanımlı olmalıdır veya `admin` olmalıdır |
| **Yapısal Güvenlik** | Admin Only | Oda ve Raf oluşturma/silme/güncelleme işlemleri sadece `admin` rolüne açıktır |
| **Girdi Güvenliği** | Zod Validasyonu | Tüm API istekleri Zod şemalarından geçer; geçersiz tipler `400 Bad Request` alır |
| **Enjeksiyon Koruması** | Regex Sanitization | Proje aramasında (`projects-search.js`) regex karakterleri `escapeRegExp` ile kaçırılır |
| **Referans Bütünlüğü** | Kaskat Silme | Üst nesne silindiğinde yetim alt kayıt kalmaması için kaskat temizleme uygulanır |

---

## 📚 Dokümantasyon Bağlantıları
- **Mimari, Veritabanı ve Tam API Referansı:** [TECHNICAL.md](./TECHNICAL.md)
- **Ürün Vizyonu, Fazlar ve Yol Haritası:** [BLUEPRINT.md](./BLUEPRINT.md)
