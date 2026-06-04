# Technical Documentation - Locus Modülü

Bu belge, **Locus** modülünün teknik mimarisini, dizin yapısını ve çalışma prensiplerini açıklamaktadır.

## 1. Mimari Genel Bakış

Locus, Antigravity ekosisteminin (Apex) bir parçası olarak geliştirilmiştir. **Hub & Spoke** modelinde bir "Spoke" uygulamasıdır.
- **Frontend:** React 19 (veya 18), Vite, TailwindCSS.
- **Backend:** Vercel Serverless Functions (`api/` dizini).
- **Database:** MongoDB (Ortak cluster).
- **Authentication:** Apex üzerinden paylaşılan `interapp_session` çerezi (SSO).

## 2. Dizin Yapısı

```
Locus/
├── api/                   # Vercel Serverless Fonksiyonları (Backend API)
│   ├── auth/              # Oturum doğrulama endpointi (session.js)
│   ├── rooms.js           # Odalar CRUD API
│   ├── racks.js           # Raflar CRUD API
│   └── cages.js           # Kafesler CRUD API
├── src/                   # Frontend Kaynak Kodları
│   ├── components/        # Yeniden kullanılabilir UI bileşenleri
│   ├── lib/               # Utility fonksiyonlar, Constants vs.
│   ├── pages/             # Ana Ekranlar (Dashboard vb.)
│   ├── App.jsx            # Ana React Bileşeni ve Router/AuthGuard
│   └── main.jsx           # Uygulama Giriş Noktası
├── vercel.json            # Vercel Dağıtım ve Route Konfigürasyonları
└── vite.config.js         # Vite ve Yerel API Proxy Ayarları
```

## 3. Oturum Yönetimi ve Kaskat Silme (Cascading Deletes)

*   **Oturum Kontrolü:** Kullanıcılar uygulamaya girdiklerinde `react-router-dom` rotaları üzerindeki koruyucular Apex sunucusunun `/api/auth/me` API ucuna istek atarak `interapp_session` JWT oturumunun geçerliliğini gerçek zamanlı sorgular.
*   **Kaskat Silme Güvenliği (Cascading Deletes):** Sunucu tarafındaki silme işlemlerinde veri bütünlüğü korunur:
    - Bir Oda (`room`) silindiğinde ona bağlı tüm Raflar (`racks`) ve Kafesler (`cages`) veritabanından otomatik olarak silinir.
    - Bir Raf (`rack`) silindiğinde ona bağlı tüm Kafesler (`cages`) temizlenir.

---

## 4. Veritabanı Koleksiyonları

Veriler MongoDB üzerinde `Locus_db` veritabanında tutulur:
- `rooms`: Tesis içindeki odaları tutar.
- `racks`: Odalara bağlı, `rows` (satır) ve `cols` (sütun) matris sınırları olan rafları tanımlar.
- `cages`: Raflara yerleştirilmiş kafesler. `row` ve `col` koordinat bilgilerini barındırır.

---

## 5. API Referansı & Rotalar (Zod Validasyonlu)

### Ön Yüz Rotaları (`react-router-dom`)
- `/rooms` - Oda ve Raf yönetim paneli (Admin yetkisi gerektirir)
- `/navigator` - Tesis genel navigatörü / görsel matris seçici
- `/navigator/:roomId/:rackId` - Seçili rafa ait kafes yerleşim şeması ve kafes görsel matris arayüzü

### Sunucu API Endpoint'leri

Gelen veriler sunucu tarafında Zod şemaları ile doğrulanır:

#### 1. Odalar API (`/api/rooms`)
- **GET `/api/rooms`**: Tüm odaları listeler.
- **POST `/api/rooms`**: Yeni oda ekler.
- **DELETE `/api/rooms?id={id}`**: Odayı siler ve bağlı rafları/kafesleri temizler.

#### 2. Raflar API (`/api/racks`)
- **GET `/api/racks`**: Odadaki rafları listeler.
- **POST `/api/racks`**: Yeni raf ekler. Zod ile `rows` ve `cols` limitleri (1-20 arası) doğrulanır.
- **DELETE `/api/racks?id={id}`**: Rafı ve bağlı kafesleri siler.

#### 3. Kafesler API (`/api/cages`)
- **GET `/api/cages?rackId={rackId}`**: Rafa bağlı kafesleri koordinatlarıyla getirir.
- **POST `/api/cages`**: Yeni kafes ekler. Zod şeması aşağıdaki güvenlik kontrollerini gerçekleştirir:
    1.  **Grid Matrisi Aşım Kontrolü:** Kafesin eklendiği `row` ve `col` koordinatlarının rafın `rows` ve `cols` limitleri içinde olduğu doğrulanır.
    2.  **Çakışma Koruması (Overlap Check):** Eklenmek istenen koordinatta (`row`, `col`) halihazırda aktif/var olan başka bir kafes bulunmadığı veritabanı sorgusu ile kontrol edilir. Çakışma varsa istek `400 Bad Request` ile reddedilir.
- **DELETE `/api/cages?id={id}`**: Kafesi siler.

> [!IMPORTANT]
> **Kafes Detay Drawer UI (Hayvan CRUD):** Faz 2 kapsamında yapılması planlanan, kafese tıklandığında sağdan açılan Hayvan CRUD ve Proje Kod Arama Drawer ekranı (Adım 5), kullanıcı kararı doğrultusunda geliştirilmemiş olup kapsam dışıdır.

