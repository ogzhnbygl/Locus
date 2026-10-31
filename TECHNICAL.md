# Locus Modülü - Kapsamlı Teknik Dokümantasyon

Bu belge, **Locus** vivaryum ve dijital ikiz yönetim platformunun sistem mimarisini, veri modellerini, güvenlik protokollerini, Vercel Serverless API spesifikasyonlarını ve ön yüz çalışma dinamiklerini ayrıntılı olarak açıklamaktadır.

---

## 1. Sistem ve Ekosistem Mimarisi

Locus, Antigravity ekosistemi içerisinde **Hub & Spoke** mimarisi prensiplerine göre yapılandırılmış bağımsız bir mikro-ön yüz (micro-frontend / spoke) uygulamasıdır.

### 1.1 Apex Hub & Spoke Entegrasyon Modeli

```mermaid
flowchart TD
    subgraph ClientBrowser["İstemci Tarayıcısı (Browser)"]
        UI["Locus React UI (Vite / React 18)"]
        Cookie["interapp_session (HttpOnly JWT)"]
    end

    subgraph ApexHub["Apex Hub (Kimlik ve Portal)"]
        ApexAuth["Apex Auth Service"]
        ApexDB[(Apex_db: users)]
    end

    subgraph LocusSpoke["Locus Platformu (Spoke)"]
        AuthMiddleware["verifyAuthWithStatus (lib/auth.js)"]
        APIEndpoints["Vercel Serverless API (/api/*)"]
        LocusDB[(Locus_db: rooms, racks, cages, animals)]
    end

    subgraph LabProjectSpoke["LabProject Platformu (Spoke)"]
        LabProjectDB[(LabProject_db: projects)]
    end

    UI -->|"1. İstek & Çerez İletimi"| APIEndpoints
    APIEndpoints -->|"2. Token ve Rol Doğrulama"| AuthMiddleware
    AuthMiddleware -->|"3. Kullanıcı Kontrolü & App Yetkisi"| ApexDB
    APIEndpoints -->|"4. Vivaryum CRUD & Kaskat İşlemler"| LocusDB
    APIEndpoints -->|"5. Cross-DB Proje Arama (/api/projects-search)"| LabProjectDB
    UI -.->|"Yetkisiz İse Yönlendirme"| ApexAuth
```

### 1.2 SSO ve Oturum Doğrulama Akışı
1. Kullanıcı `wildtype.app` ana portalından (Apex Hub) kimlik doğrulaması yaptığında, istemciye paylaşılan alan adı özniteliğiyle (`Domain=.wildtype.app; Secure; HttpOnly; SameSite=Lax`) bir JWT çerezi (`interapp_session` veya test ortamında `interapp_session_test`) yazılır.
2. Locus ön yüzüne erişildiğinde `AuthContext.jsx`, `/api/auth/session` uç noktasına istek atar.
3. Sunucu tarafında `lib/auth.js`:
   - JWT algoritmasını denetler (`HS256`).
   - Zamanlama saldırılarını (timing attack) önlemek amacıyla `crypto.timingSafeEqual` kullanarak imza doğrulaması yapar.
   - `Apex_db.users` koleksiyonundan kullanıcının aktif durumunu ve `apps` dizisinde `locus` yetkisinin (veya `role: 'admin'`) bulunup bulunmadığını kontrol eder.
   - Yetkisiz isteklerde `401 Unauthorized`, uygulama izni olmayan durumlarda `403 Forbidden` döndürür.

---

## 2. Kapsamlı Dizin Yapısı

```bash
Locus/
├── .env                              # Üretim/yerel çevresel değişkenler
├── .env.local                        # Yerel geliştirme gizli değişkenleri
├── .gitignore                        # Git hariç tutma kuralları
├── vercel.json                       # Vercel Serverless rewrites ve build konfigürasyonu
├── vite.config.js                    # Vite konfigürasyonu (React eklentisi, port 5173)
├── package.json                      # Bağımlılıklar (React 18, React Router 7, Zod 4, MongoDB 7)
├── README.md                         # Genel tanıtım ve başlangıç kılavuzu
├── TECHNICAL.md                      # Bu teknik şartname ve mimari doküman
├── BLUEPRINT.md                      # Ürün vizyonu ve faz yol haritası
├── api/                              # Backend Vercel Serverless Fonksiyonları
│   ├── auth/
│   │   └── session.js                # Oturum doğrulama ve sonlandırma API'si
│   ├── animals.js                    # Hayvan CRUD işlemleri ve filtreleme
│   ├── cages.js                      # Kafes yerleşimi, slot çakışma ve sınır kontrolü
│   ├── projects-search.js            # LabProject_db cross-db ReDoS korumalı arama
│   ├── racks.js                      # Raf tanımlama, küçülme ve sınır denetimleri
│   └── rooms.js                      # Oda yönetimi ve derin kaskat silme
├── lib/                              # Backend Yardımcı Fonksiyonlar
│   ├── auth.js                       # JWT timing-safe doğrulama ve RBAC kontrolleri
│   └── mongodb.js                    # MongoDB Client bağlantı havuzu ve ortam çözümleyici
└── src/                              # React Ön Yüz Kaynak Kodları
    ├── main.jsx                      # DOM mount ve dev-mode Bearer fetch interceptor
    ├── App.jsx                       # Router tanımları ve AuthGuard
    ├── index.css                     # Tailwind CSS direktifleri
    ├── context/
    │   └── AuthContext.jsx           # Merkezi kullanıcı oturum sağlayıcısı
    ├── pages/
    │   └── Dashboard.jsx             # Ana layout, navigasyon barı ve sayfa router'ı
    ├── components/
    │   ├── Navigator.jsx             # Tesis/Oda/Raf/Kafes 2D interaktif matris haritası
    │   └── RoomRackManager.jsx       # Oda ve Raf listesi, formları ve düzenleme modalı
    └── lib/
        ├── constants.js              # Tür (SPECIES), suş (STRAINS) ve cinsiyet sabitleri
        └── db.js                     # İstemci tarafı API fetch istemcisi
```

---

## 3. Veritabanı ve Şema Spesifikasyonu

Locus verileri MongoDB kümesinde `Locus_db` (test ortamında `Locus_test_db`) altında tutulur. Ayrıca kimlik denetimi için `Apex_db`, proje ilişkileri için `LabProject_db` veritabanlarına bağlanılır.

```mermaid
erDiagram
    ROOM ||--o{ RACK : contains
    RACK ||--o{ CAGE : hosts
    CAGE ||--o{ ANIMAL : shelters

    ROOM {
        ObjectId _id PK
        string name
        string description
        string createdAt
        string updatedAt
    }

    RACK {
        ObjectId _id PK
        string roomId FK
        string name
        string description
        int rows
        int cols
        string createdAt
        string updatedAt
    }

    CAGE {
        ObjectId _id PK
        string rackId FK
        string name
        string barcode
        string status
        int row
        int column
        string createdAt
        string updatedAt
    }

    ANIMAL {
        ObjectId _id PK
        string cageId FK
        string species
        string strain
        string sex
        int count
        string dob
        string projectCode
        string status
        string createdAt
        string updatedAt
    }
```

### 3.1 `Locus_db.rooms` (Odalar Koleksiyonu)
| Alan Adı | Tip | Zorunlu mu? | Açıklama |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Evet | MongoDB birincil anahtarı |
| `name` | `string` | Evet | Odanın adı/kodu (Örn: "Oda 101 - Fare Karantina") |
| `description` | `string` | Hayır | Odanın kullanım amacı veya detay açıklaması |
| `createdAt` | `string (ISO)` | Evet | Oluşturulma zaman damgası |
| `updatedAt` | `string (ISO)` | Evet | Son güncellenme zaman damgası |

### 3.2 `Locus_db.racks` (Raflar Koleksiyonu)
| Alan Adı | Tip | Zorunlu mu? | Kısıtlar / Validasyon | Açıklama |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Evet | Benzersiz kimlik | Raf birincil anahtarı |
| `roomId` | `string` | Evet | Geçerli `ObjectId` dizesi | Bağlı olduğu odanın ID'si |
| `name` | `string` | Evet | Boş olamaz | Raf etiketi (Örn: "R1-A", "IVC-01") |
| `description` | `string` | Hayır | - | Raf teknik özellikleri veya açıklaması |
| `rows` | `number` | Evet | `1 <= rows <= 26` | Dikey raf kat sayısı (A'dan Z'ye harflendirilir) |
| `cols` | `number` | Evet | `1 <= cols <= 50` | Yatay hücre sayısı (1'den 50'ye numaralandırılır) |
| `createdAt` | `string (ISO)` | Evet | - | Oluşturulma tarihi |
| `updatedAt` | `string (ISO)` | Evet | - | Güncellenme tarihi |

### 3.3 `Locus_db.cages` (Kafesler Koleksiyonu)
| Alan Adı | Tip | Zorunlu mu? | Kısıtlar / Validasyon | Açıklama |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Evet | Benzersiz kimlik | Kafes birincil anahtarı |
| `rackId` | `string` | Evet | Geçerli `ObjectId` dizesi | Bulunduğu rafın kimliği |
| `name` | `string` | Evet | Boş olamaz | Kafes kimlik adı (Örn: "C-A1", "C-B4") |
| `barcode` | `string` | Hayır | - | Fiziksel kafes üzerindeki 1D/2D barkod veya RFID |
| `status` | `string` | Hayır | Varsayılan: `"Active"` | Kafes durumu (`Active`, `Maintenance`, `Empty`) |
| `row` | `number` | Evet | `1 <= row <= rack.rows` | Kafesin raftaki satır koordinatı (1-tabanlı) |
| `column` | `number` | Evet | `1 <= column <= rack.cols`| Kafesin raftaki sütun koordinatı (1-tabanlı) |
| `createdAt` | `string (ISO)` | Evet | - | Oluşturulma tarihi |
| `updatedAt` | `string (ISO)` | Evet | - | Güncellenme tarihi |

> [!IMPORTANT]
> **Hücre Benzersizliği:** Veritabanında mantıksal olarak `{ rackId: 1, row: 1, column: 1 }` kombinasyonu tekildir; aynı slota birden fazla kafes eklenemez.

### 3.4 `Locus_db.animals` (Hayvanlar Koleksiyonu)
| Alan Adı | Tip | Zorunlu mu? | Açıklama |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Evet | Hayvan grubu birincil anahtarı |
| `cageId` | `string` | Evet | Bulunduğu kafesin kimliği |
| `species` | `string` | Evet | Tür: `"Fare"`, `"Sıçan"`, `"Tavşan"` |
| `strain` | `string` | Evet | Suş: `"BALB/c"`, `"C57BL/6"`, `"CD-1 (ICR)"`, `"Wistar"`, vb. |
| `sex` | `string` | Evet | Cinsiyet: `"Erkek"`, `"Dişi"` |
| `count` | `number` | Evet | Kafesteki hayvan adedi (pozitif tam sayı) |
| `dob` | `string` | Evet | Doğum Tarihi (YYYY-MM-DD formatında) |
| `projectCode` | `string` | Hayır | İlişkili araştırma proje kodu (Örn: "PRJ-2026-001") |
| `status` | `string` | Evet | Varsayılan: `"Active"` |
| `createdAt` | `string (ISO)` | Evet | Oluşturulma tarihi |
| `updatedAt` | `string (ISO)` | Evet | Güncellenme tarihi |

---

## 4. Tam API Referansı

Tüm uç noktalar JSON formatında haberleşir. İsteklerde yetkilendirme `interapp_session` çerezi üzerinden yürütülür.

### 4.1 Kimlik ve Oturum API (`/api/auth/session`)

#### `GET /api/auth/session`
Mevcut kullanıcının oturumunu ve `locus` uygulamasına erişim hakkını doğrular.
- **Auth/Rol:** Oturum sahibi herhangi bir kullanıcı.
- **Başarılı Yanıt (200 OK):**
```json
{
  "isAuthenticated": true,
  "user": {
    "email": "oguzhan@wildtype.app",
    "name": "Oğuzhan",
    "role": "admin",
    "apps": ["locus", "dispo", "labproject"]
  }
}
```
- **Hata Yanıtları:**
  - `401 Unauthorized`: `{"isAuthenticated": false, "error": "Oturum bulunamadı."}`
  - `403 Forbidden`: `{"isAuthenticated": true, "error": "Bu uygulamaya erişim yetkiniz bulunmamaktadır."}`

#### `POST /api/auth/session` veya `DELETE /api/auth/session`
Aktif oturum çerezini sıfırlayarak çıkış yapar (`Max-Age=0`).
- **Başarılı Yanıt (200 OK):** `{"message": "Logged out"}`

---

### 4.2 Odalar API (`/api/rooms`)

#### `GET /api/rooms`
Tesis içindeki tüm odaları en yeniden en eskiye sıralı olarak listeler.
- **Auth/Rol:** Oturum açmış `locus` kullanıcısı.
- **Başarılı Yanıt (200 OK):**
```json
[
  {
    "_id": "67be10fa2e3a123456789abc",
    "id": "67be10fa2e3a123456789abc",
    "name": "Oda 101 - Temiz Üretim",
    "description": "SPF fare barındırma alanı",
    "createdAt": "2026-02-25T14:30:00.000Z",
    "updatedAt": "2026-02-25T14:30:00.000Z"
  }
]
```

#### `POST /api/rooms`
Yeni bir oda kaydı oluşturur.
- **Auth/Rol:** **Sadece `admin`**.
- **Zod Request Body Şeması:**
```typescript
z.object({
  name: z.string().trim().min(1, 'Oda adı gereklidir.'),
  description: z.string().optional().default('')
})
```
- **Örnek İstek:**
```json
{
  "name": "Karantina Odası 2",
  "description": "Yeni gelen kemirgen kabul ünitesi"
}
```
- **Başarılı Yanıt (201 Created):** Eklenen nesne ve üretilen `id`.
- **Hata Yanıtları:**
  - `400 Bad Request`: Zod validasyon hatası.
  - `403 Forbidden`: Kullanıcı `admin` değilse.

#### `PUT /api/rooms`
Mevcut bir odanın adını veya açıklamasını günceller.
- **Auth/Rol:** **Sadece `admin`**.
- **Zod Request Body Şeması:**
```typescript
z.object({
  id: z.string().refine(val => ObjectId.isValid(val), 'Geçersiz oda ID formatı.'),
  name: z.string().trim().min(1, 'Oda adı gereklidir.'),
  description: z.string().optional().default('')
})
```
- **Başarılı Yanıt (200 OK):** `{"success": true}`
- **Hata Yanıtları:**
  - `404 Not Found`: Belirtilen ID ile oda bulunamadıysa.

#### `DELETE /api/rooms?id={roomId}`
Bir odayı ve odaya bağlı tüm raf, kafes ve hayvanları **kaskat (cascading)** olarak siler.
- **Auth/Rol:** **Sadece `admin`**.
- **Query Parametresi:** `id` (geçerli MongoDB ObjectId).
- **Kaskat Silme Adımları:**
  1. Odaya ait tüm raflar bulunur (`racks.find({ roomId })`).
  2. Bu raflara bağlı kafesler bulunur (`cages.find({ rackId: { $in: rackIds } })`).
  3. Kafeslerdeki tüm hayvanlar silinir (`animals.deleteMany`).
  4. Raflardaki tüm kafesler silinir (`cages.deleteMany`).
  5. Odaya ait tüm raflar silinir (`racks.deleteMany`).
  6. Odanın kendisi silinir (`rooms.deleteOne`).
- **Başarılı Yanıt (200 OK):** `{"success": true}`

---

### 4.3 Raflar API (`/api/racks`)

#### `GET /api/racks?roomId={roomId}`
Belirli bir odaya ait (veya parametresiz tüm) rafları listeler.
- **Auth/Rol:** Oturum açmış `locus` kullanıcısı.
- **Başarılı Yanıt (200 OK):**
```json
[
  {
    "_id": "67be15da2e3a123456789def",
    "id": "67be15da2e3a123456789def",
    "roomId": "67be10fa2e3a123456789abc",
    "name": "R1-A",
    "description": "Ventile IVC Rafı",
    "rows": 7,
    "cols": 10,
    "createdAt": "2026-02-25T14:35:00.000Z",
    "updatedAt": "2026-02-25T14:35:00.000Z"
  }
]
```

#### `POST /api/racks`
Oda içerisine yeni bir raf matrisi tanımlar.
- **Auth/Rol:** **Sadece `admin`**.
- **Zod Request Body Şeması:**
```typescript
z.object({
  roomId: z.string().refine(val => ObjectId.isValid(val), 'Geçersiz oda ID formatı.'),
  name: z.string().trim().min(1, 'Raf adı gereklidir.'),
  description: z.string().optional().default(''),
  rows: z.coerce.number().int().min(1).max(26).optional().default(1),
  cols: z.coerce.number().int().min(1).max(50).optional().default(1)
})
```
- **Başarılı Yanıt (201 Created):** Oluşturulan raf nesnesi ve `id`.

#### `PUT /api/racks`
Raf adını, açıklamasını veya matris boyutlarını günceller.
- **Auth/Rol:** **Sadece `admin`**.
- **Boyut Küçültme Koruması (Boundary Validation):**
  Eğer `rows` veya `cols` küçültülüyorsa, sistem veritabanında yeni sınırların dışında kalan kafes olup olmadığını kontrol eder:
  ```javascript
  const outOfBoundsCage = await db.collection('cages').findOne({
    rackId: id,
    $or: [{ row: { $gt: nextRows } }, { column: { $gt: nextCols } }]
  });
  ```
  Dışarıda kafes kalıyorsa işlem iptal edilir:
  - `400 Bad Request`: `{"error": "Raf boyutu küçültülemez: (5. satır, 8. sütun) konumunda 'C-E8' kafesi bulunuyor."}`
- **Başarılı Yanıt (200 OK):** `{"success": true}`

#### `DELETE /api/racks?id={rackId}`
Rafı ve bağlı tüm kafes ile hayvan kayıtlarını kaskat siler.
- **Auth/Rol:** **Sadece `admin`**.
- **Başarılı Yanıt (200 OK):** `{"success": true}`

---

### 4.4 Kafesler API (`/api/cages`)

#### `GET /api/cages?rackId={rackId}`
Seçilen rafa ait kafesleri listeler.
- **Auth/Rol:** Oturum açmış `locus` kullanıcısı.
- **Başarılı Yanıt (200 OK):**
```json
[
  {
    "_id": "67be18aa2e3a123456789111",
    "id": "67be18aa2e3a123456789111",
    "rackId": "67be15da2e3a123456789def",
    "name": "C-A1",
    "barcode": "LOC-882910",
    "status": "Active",
    "row": 1,
    "column": 1,
    "createdAt": "2026-02-25T14:40:00.000Z",
    "updatedAt": "2026-02-25T14:40:00.000Z"
  }
]
```

#### `POST /api/cages`
Raftaki boş bir koordinata yeni kafes ekler.
- **Auth/Rol:** Oturum açmış `locus` kullanıcısı.
- **Zod Request Body Şeması:**
```typescript
z.object({
  rackId: z.string().refine(val => ObjectId.isValid(val), 'Geçersiz rackId formatı.'),
  name: z.string().min(1, 'Kafes adı gereklidir.'),
  barcode: z.string().optional().default(''),
  status: z.string().optional().default('Active'),
  row: z.coerce.number().int().positive('Satır koordinatı pozitif bir tam sayı olmalıdır.'),
  column: z.coerce.number().int().positive('Sütun koordinatı pozitif bir tam sayı olmalıdır.')
})
```
- **Doğrulama ve İş Mantığı Adımları:**
  1. **Raf Denetimi:** `rackId` ile rafın varlığı sorgulanır.
  2. **Grid Sınır Kontrolü:** `row > rack.rows` veya `column > rack.cols` ise `400 Bad Request` döndürülür:
     `{"error": "Koordinatlar raf sınırları dışındadır. Raf boyutları: 7 satır x 10 sütun."}`
  3. **Hücre Çakışma Kontrolü:** Veritabanında `{ rackId, row, column }` sorgulanır. Eğer slot doluysa `400 Bad Request` döndürülür:
     `{"error": "Belirtilen konumda (1. satır, 1. sütun) zaten 'C-A1' isimli bir kafes mevcut."}`
- **Başarılı Yanıt (201 Created):** Oluşturulan kafes verisi.

#### `DELETE /api/cages?id={cageId}`
Kafesi siler. Kafesteki tüm hayvanlar da temizlenir (`animals.deleteMany({ cageId: id })`).
- **Auth/Rol:** Oturum açmış `locus` kullanıcısı.
- **Başarılı Yanıt (200 OK):** `{"success": true}`

---

### 4.5 Hayvanlar API (`/api/animals`)

#### `GET /api/animals?cageId={cageId}`
Belirli bir kafeste barınan hayvan kayıtlarını getirir.
- **Auth/Rol:** Oturum açmış `locus` kullanıcısı.
- **Başarılı Yanıt (200 OK):**
```json
[
  {
    "_id": "67be200a2e3a123456789222",
    "id": "67be200a2e3a123456789222",
    "cageId": "67be18aa2e3a123456789111",
    "species": "Fare",
    "strain": "C57BL/6",
    "sex": "Erkek",
    "count": 4,
    "dob": "2026-01-10",
    "projectCode": "PRJ-2026-01",
    "status": "Active",
    "createdAt": "2026-02-25T15:00:00.000Z",
    "updatedAt": "2026-02-25T15:00:00.000Z"
  }
]
```

#### `POST /api/animals`
Kafese yeni hayvan grubu ekler.
- **Auth/Rol:** Oturum açmış `locus` kullanıcısı.
- **İstek Gövdesi:**
```json
{
  "cageId": "67be18aa2e3a123456789111",
  "species": "Fare",
  "strain": "BALB/c",
  "sex": "Dişi",
  "count": 5,
  "dob": "2026-02-01",
  "projectCode": "PRJ-ONK-04"
}
```
- **Başarılı Yanıt (201 Created):** Eklenen hayvan kaydı ve `id`.

#### `DELETE /api/animals?id={animalId}`
Belirli bir hayvan kaydını siler.
- **Auth/Rol:** Oturum açmış `locus` kullanıcısı.
- **Başarılı Yanıt (200 OK):** `{"success": true}`

---

### 4.6 Çapraz Veritabanı Proje Arama API (`/api/projects-search`)

#### `GET /api/projects-search?q={searchTerm}`
Araştırmacıların kafese hayvan tanımlarken ilgili etik veya araştırma projesini bağlayabilmesi için `LabProject_db` veritabanındaki projelerde anlık arama yapar.
- **Auth/Rol:** Oturum açmış `locus` kullanıcısı.
- **Güvenlik Mekanizması:** Regex Enjeksiyonu (ReDoS) koruması için kullanıcı girdisi temizlenir:
  ```javascript
  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  ```
- **Sorgu Limiti:** Minimum 2 karakter gereklidir (`rawQuery.length < 2` ise anında `[]` döner). En fazla 10 sonuç döner.
- **Başarılı Yanıt (200 OK):**
```json
[
  {
    "_id": "67bc9812fa4b1234567890aa",
    "code": "PRJ-ONK-04",
    "title": "Meme Kanseri İmmünoterapi Modeli"
  }
]
```

---

## 5. Ön Yüz Mimarisi ve Rotalar

Ön yüz React 18, React Router v7 (`react-router-dom`) ve Tailwind CSS kullanılarak SPA (Single Page Application) yapısında kurgulanmıştır.

### 5.1 Rota Tablosu

| Rota Yolu | Bileşen | Yetki Kapsamı | Açıklama |
| :--- | :--- | :--- | :--- |
| `/` | `RoomRackManager` | Giriş Yapmış Kullanıcı (Yazma: Admin) | Odaların ve rafların listelendiği, adminlerce yönetildiği ekran |
| `/navigator` | `Navigator` | Giriş Yapmış Kullanıcı | Tesis > Oda > Raf > 2D Kafes Matrisi interaktif drill-down haritası |

### 5.2 Navigator Durum Makinesi (Drill-Down State)
`Navigator.jsx` bileşeni tek bir sayfa üzerinde 3 hiyerarşik katmanı dinamik olarak yönetir:
1. **Katman 1 (Tüm Odalar):** `!selectedRoomId` durumunda tüm tesis odaları kartlar halinde gösterilir.
2. **Katman 2 (Oda Rafları):** `selectedRoomId && !selectedRackId` durumunda seçilen odadaki raflar listelenir; önceki/sonraki oda geçiş butonları mevcuttur.
3. **Katman 3 (Raf Grid Matrisi):** `selectedRackId && selectedRack` durumunda CSS Grid ile dinamik matris çizilir:
   - Dolu hücreler: Yeşil arka plan, kafes adı ve silme butonu.
   - Boş hücreler: Kesikli gri çizgili alan, slot etiketi (Örn: `A1`, `B4`). Tıklandığında o slota özel yeni kafes ekleme modalını açar.

### 5.3 Geliştirici Modu (Dev Fetch Interceptor)
Yerel geliştirme ortamında (`import.meta.env.DEV`), `src/main.jsx` dosyasında global `window.fetch` fonksiyonu sarılır:
```javascript
if (import.meta.env.DEV) {
  const originalFetch = window.fetch;
  window.fetch = async function (resource, options = {}) {
    options.headers = options.headers || {};
    // ... Authorization başlığı yoksa otomatik 'Bearer dev@wildtype.app' ekler
    return originalFetch(resource, options);
  };
}
```
Bu sayede geliştirici, yerel Vite sunucusunda test ederken herhangi bir manuel token veya çerez ayarlamak zorunda kalmadan tam yetkili olarak çalışabilir.

---

## 6. Ortam Değişkenleri (.env Referansı)

| Değişken Adı | Zorunlu mu? | Örnek Değer | Açıklama |
| :--- | :--- | :--- | :--- |
| `MONGODB_URI` | **Evet** | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true` | MongoDB kümesine bağlantı URI dizesi |
| `JWT_SECRET` | **Evet** | `gizli_apex_jwt_anahtari_32_karakter` | Apex Hub ile paylaşılan HMAC-SHA256 gizli anahtarı |
| `NODE_ENV` | Hayır | `development` / `production` | Node.js çalışma modu |
| `VERCEL_ENV` | Hayır | `production` / `preview` | Vercel dağıtım ortamı belirteci |
| `FORCE_PROD_DB`| Hayır | `true` / `false` | Geliştirme ortamında doğrudan prod DB'ye bağlanma bayrağı |

---

## 7. Hata Yönetimi ve Güvenlik Protokolleri

1. **Timing Attack Koruması:** `crypto.timingSafeEqual` kullanılarak imza doğrulaması yapılır. Sabit zamanlı karşılaştırma sayesinde brute-force ve yan kanal saldırıları engellenir.
2. **ReDoS (Regular Expression Denial of Service) Savunması:** Proje aramalarındaki regex sorgularında tüm özel karakterler `escapeRegExp` fonksiyonu ile etkisiz hale getirilir.
3. **Zod ile Şema ve Tip Güvenliği:** Backend'e gelen istekler katı Zod şemalarından geçirilir; gereksiz alanlar elenir, tip dönüşümleri (`z.coerce.number()`) güvenle yapılır.
4. **Veri Bütünlüğü ve Kaskat Silme:** NoSQL mimarisinde yabancı anahtar (foreign key) kısıtı bulunmadığından, ilişkisel bütünlük API katmanındaki kaskat silme bloklarıyla güvenceye alınır.
