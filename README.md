# Locus - Vivaryum Dijital İkiz Platformu

**Locus**, Antigravity ekosisteminin (Apex Hub) bir parçası olarak, laboratuvar hayvanı üretim ve barındırma tesislerinin (vivaryum) dijital ikizini oluşturmayı sağlayan modüler bir platformudur. 

Bu sistem, fiziksel tesisin Odalar > Raflar > Kafesler > Hayvanlar hiyerarşisinde dijital ortama aktarılmasını ve gerçek zamanlı izlenebilmesini hedefler.

## 🚀 Özellikler

- **Tesis Hiyerarşisi:**
    - Odaların (Rooms) ve Rafların (Racks) idari yetkililer (Admin) tarafından tanımlanması.
    - Kafeslerin (Cages) ve içerisinde barınan Hayvanların (Animals) yetkili kullanıcılar (User) tarafından yönetimi.
- **Detaylı Hayvan Kaydı:**
    - Apex ekosisteminin diğer bir parçası olan **Dispo** modülü ile tamamen uyumlu veri şeması (Tür, Irk, Cinsiyet, Proje, Doğum Tarihi).
    - İlerleyen dönemlerde Dispo ile kolay entegrasyon için standartlaştırılmış altyapı.
- **Kapsamlı Rol ve Yetki Yönetimi:**
    - Merkez (Apex) üzerinden `interapp_session` bazlı Single Sign-On (SSO) mimarisi.
    - Sistem odalarına sadece idari yetki ile müdahale edilebilmesini sağlayan yapı.

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
