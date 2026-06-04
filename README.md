# Locus - Vivaryum Dijital İkiz Platformu

**Locus**, Antigravity ekosisteminin (Apex Hub) bir parçası olarak, laboratuvar hayvanı üretim ve barındırma tesislerinin (vivaryum) dijital ikizini oluşturmayı sağlayan modüler bir platformudur. 

Bu sistem, fiziksel tesisin Odalar > Raflar > Kafesler > Hayvanlar hiyerarşisinde dijital ortama aktarılmasını ve gerçek zamanlı izlenebilmesini hedefler.

## 🚀 Özellikler

- **Vivaryum Hiyerarşisi:**
    - Odaların (Rooms) ve Rafların (Racks) idari yetkililer (Admin) tarafından tanımlanması.
    - Kafeslerin (Cages) ve içerisinde barınan Hayvanların (Animals) yetkili kullanıcılar (User) tarafından yönetimi.
    - **Cascading Deletes (Kaskat Silme):** Bir oda veya raf silindiğinde, veritabanı bütünlüğünü korumak amacıyla o odaya/rafa bağlı tüm kafesler ve alt kayıtlar otomatik olarak temizlenir.
- **Kafes Yerleşimi ve Çakışma Önleme (Faz 2):**
    - Raf grid matrisi sınır kontrolleri: Kafeslerin tanımlanan raf boyutlarını (`rows` ve `cols` sınırlarını) aşması backend düzeyinde engellenir.
    - **Çakışma Koruması (Overlap Prevention):** Aynı raf hücresine (satır/sütun koordinatına) birden fazla kafes eklenmesi Zod ve MongoDB sorgusuyla engellenmiştir.
- **Güvenli Oturum ve Yönlendirme (Faz 1 & Faz 2):**
    - Apex ekosistemi `interapp_session` JWT çerezi ile tek noktadan oturum kontrolü.
    - `react-router-dom` ile URL tabanlı yönlendirme (`/rooms`, `/navigator`, `/navigator/:roomId/:rackId`).
    - Backend API isteklerinin Zod şemaları ile doğrulanması.

## 🛠️ Teknolojiler

Modern ve endüstri standartlarında inşa edilmiştir:

### Frontend
- **Framework:** [React](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend
- **Runtime:** [Vercel Serverless Functions](https://vercel.com/docs/functions)
- **Database:** [MongoDB](https://www.mongodb.com/)

## 📦 Kurulum

Yerel ortamınızda geliştirme yapmak için:

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Çevresel Değişkenleri Ayarlayın:**
   Kök dizinde `.env` dosyası oluşturun:
   ```env
   MONGODB_URI=mongodb+srv://...
   ```

3. **Geliştirme Sunucusu:**
   ```bash
   npm run dev
   ```

---
Daha detaylı teknik bilgi için [TECHNICAL.md](./TECHNICAL.md) ve genel sistem vizyonu için [BLUEPRINT.md](./BLUEPRINT.md) belgelerini inceleyin.
