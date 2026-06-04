# Locus (Vivaryum Dijital İkiz) - Tasarım Vizyonu (Blueprint)

## Sistem Vizyonu:
Locus, laboratuvar hayvanı üretim ve test tesislerinin uçtan uca yönetimi için oluşturulan, gerçek dünya (fiziksel ortam) ile dijital ortam arasında bir **köprü ("dijital ikiz")** vazifesi gören bir platformdur. 

Amacı, fiziksel alanın soyutlanmış bir kopyasını yaratarak "Oda" seviyesinden başlayıp bireysel "Hayvan" seviyesine inen tüm katmanları şeffaf bir hiyerarşiyle sunmaktır.

## Temel Felsefe (Core Philosophy):
- **Oluşturulan Her Alan Fiziksel Gerçekliği Yansıtır:** Sistemde oluşturulan Odalar, Raflar ve Kafesler laboratuvardaki fiziksel karşılıklarını birebir modellemelidir.
- **Güvenli Temel, Modüler Mimari:** Veri girişine açık alanlar (Kafesler/Hayvanlar) tüm yetkili kullanıcılara açıkken; yapısal bütünlüğü sağlayan temeller (Odalar/Raflar) sadece üst idari kullanıcılar (Adminler) tarafından yönetilir.
- **Ekosistem Entegrasyonu:** Locus yalnız çalışmaz; Apex merkezi ile kimlikliğini doğrular ve barındırdığı Hayvan verisini analiz için doğrudan **Dispo** modülüne entegre edilebilecek evrensel bir dille konuşur.

## Locus Mimarisi Parçaları:
1. **Oda (Room):** En üst fiziksel sınır.
2. **Raf (Rack):** Oda içindeki depolama ünitesi (Örn: IVC rack).
3. **Kafes (Cage):** Raf üzerinde özel bir hücre.
4. **Hayvan (Animal):** En küçük birim (Dispo uyumlu schema).

## UX/UI Tasarım Hedefi:
- **Derinlik ve Akıcılık:** Locus arayüzü sadece tablo veya formlardan ibaret olmamalıdır; odadan hayvana uzanan yapı, modern ve akıcı bileşenler, breadcrumb (bilgi kırıntıları) veya interaktif ağaç görünümleri ile sunulmalıdır.
- **Açık, Ferah ve Endüstriyel Çizgiler:** Karmaşık veriyi yorucu olmadan, anlaşılır ikonografi (Lucide React) ile temsil etmelidir.

---

## 🗺️ Yol Haritası (Roadmap)

### Faz 1: Temel Mimari ve Güvenlik (Tamamlandı ✅)
- [x] Odalar ve Raflar için CRUD modülleri (Admin yetkili).
- [x] Apex auth ve paylaşılan oturum entegrasyonu.
- [x] **Kaskat Silme (Cascading Deletes):** Oda/Raf silindiğinde alt kafes ve hayvan verilerinin temizlenmesi.

### Faz 2: Standardizasyon, Doğrulama ve Yönlendirme (Tamamlandı ✅)
- [x] **Yönlendirme:** `react-router-dom` entegrasyonu ile URL tabanlı yönlendirme (`/rooms`, `/navigator`, `/navigator/:roomId/:rackId`).
- [x] **Zod API Doğrulamaları:** POST ve DELETE gövdelerinin doğrulanması.
- [x] **Grid Matrisi Kontrolü:** Kafeslerin rafın satır/sütun sınırlarını aşmasının sunucuda engellenmesi.
- [x] **Çakışma Koruması:** Aynı koordinata mükerrer kafes yerleştirilmesinin engellenmesi.
- [x] **Atıl Kod Temizliği:** `/api/lib/mongodb.js` ve boş model klasörlerinin silinmesi.

> [!NOTE]
> Faz 2 kapsamındaki Adım 5 geliştirmesi olan **Kafes Detay Drawer UI (Hayvan Yönetimi)** kullanıcı isteği doğrultusunda kapsam dışı tutulmuştur.

### Faz 3: Gelişmiş Özellikler (Planlanıyor)
- [ ] Kafes Detay Drawer UI (Kafes içi hayvanların CRUD yönetimi).
- [ ] Rafların görsel 2D/3D sürükle-bırak (Drag-and-Drop) yerleşim editörü.
- [ ] Dispo ve LabProject entegrasyonu ile hayvanların deney kotalarının kafes koordinatlarına göre otomatik raporlanması.

