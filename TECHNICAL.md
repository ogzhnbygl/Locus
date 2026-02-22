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
│   ├── auth/              # Oturum doğrulama endpointleri
│   ├── rooms/             # Odalar CRUD
│   ├── racks/             # Raflar CRUD
│   ├── cages/             # Kafesler CRUD
│   ├── animals/           # Hayvanlar CRUD
│   ├── lib/               # Yardımcı (Utility) Fonksiyonlar (MongoDB vb.)
│   └── models/            # (İsteğe bağlı) Şema/Validasyon yardımcıları
├── src/                   # Frontend Kaynak Kodları
│   ├── components/        # Yeniden kullanılabilir UI bileşenleri
│   ├── lib/               # Utility fonksiyonlar, Constants vs.
│   ├── pages/             # Ana Ekranlar (Dashboard vb.)
│   ├── App.jsx            # Ana React Bileşeni ve Router/AuthGuard
│   └── main.jsx           # Uygulama Giriş Noktası
├── vercel.json            # Vercel Dağıtım ve Route Konfigürasyonları
└── vite.config.js         # Vite ve Yerel API Proxy Ayarları
```

## 3. AuthGuard ve Güvenlik
Kullanıcılar uygulamaya girdiklerinde ilk olarak `interapp_session` cookie'si kontrol edilir. Bu doğrulama `Apex` ile aynı standartları kullanır. Çerez geçersizse kullanıcı `wildtype.app` ana giriş sayfasına yönlendirilir. Uygulama içinde Admin yetkisi gerektiren Room ve Rack işlemlerinde ek yetki kontrolü yapılır.

## 4. Veritabanı Modelleri (Koleksiyonlar)

Locus, kendine has spesifik verilerini tutar. Ancak 'Animal' şeması Dispo modülü ile uyumlu çalışacak şekilde tasarlanmıştır.
- `locus_rooms`: Tesis odaları.
- `locus_racks`: Odalara bağlı raflar.
- `locus_cages`: Raflara bağlı kafesler.
- `locus_animals`: Kafeslere bağlı hayvanlar. Tür, ırk, doğum tarihi gibi özellikleri içerir.
