// Every release, in one list. Each store section, the Galaxy ring and the
// detail window all read from here, so a new release is one entry.
//   kind:   "oyun" or "uygulama"; each store section is split by it.
//   ios:    App Store numeric id, or null if not on the App Store.
//   android: Play package name, or null if not on Google Play.
//   soon:   on its way, not in a store yet. Shown with a "Yakında" tag.
//   play:   a version that runs right here in the browser.
//   isNew:  gets the "Yeni" tag.
// Store status checked against the App Store lookup API and Play on 2026-10-22.
window.FT_APPS = [
  {
    name: "Go Go La", slug: "go-go-la", kind: "oyun", genre: "Aksiyon",
    ios: null, android: "com.gogola.gogola", isNew: true,
    blurb: "Tek parmakla oynanan, birinci şahıs 3D zindan nişancısı.",
    desc: "Karanlık koridorlar, üstüne gelen yaratıklar ve elinde tek bir silah. Go Go La'da tek parmakla nişan alıp ateş ediyor, zindanın derinine indikçe zorlaşan dalgalara göğüs geriyorsun.",
    shots: ["go-go-la-1", "go-go-la-2", "go-go-la-3"]
  },
  {
    name: "Gamesomnia", slug: "gamesomnia", kind: "oyun", genre: "Bulmaca",
    ios: null, android: "com.beles.beles", isNew: true, pages: "beles", intro: false,
    blurb: "Tek uygulamada seksenden fazla internetsiz mini oyun.",
    desc: "Uykusuz gecelerin oyun dükkânı. Seksenden fazla mini oyun tek uygulamada, hepsi internetsiz ve tek parmakla oynanıyor. Kısa bir mola da olur, uzun bir gece de.",
    shots: ["gamesomnia-1", "gamesomnia-2"]
  },
  {
    name: "Jin: Kendi Dostunu Yarat", slug: "jin", kind: "oyun", genre: "Hayat simülasyonu",
    ios: null, android: null, soon: true, isNew: true,
    blurb: "Yarı insan yarı devre bir dostu bebeklikten büyüt.",
    desc: "Jin yeni doğdu. Onu besliyor, uyutuyor, oyun oynuyor ve büyütüyorsun. Her evrede başka bir yüzü, başka bir huyu var. On sekizine geldiğinde seni hatırlayan, cihazın içinde konuşan bir dosta dönüşüyor. Tamamen çevrimdışı.",
    shots: ["jin-1", "jin-2", "jin-3"]
  },
  {
    name: "Acemi Şef", slug: "acemi-sef", kind: "oyun", genre: "Simülasyon",
    ios: "6810176972", android: "com.acemisef.acemisef",
    blurb: "Küçük bir sokak tezgâhıyla başla, mutfağını büyüt.",
    desc: "Müşteri gelir, yemeğini ister. Malzemeleri kâseye at, pişiriciyi seç, tabağı servis et. Memnuniyet ne kadar yüksekse kazanç o kadar büyük. Gün sonunda giderleri öde, tezgâhını büyüt.",
    shots: ["acemi-sef-1", "acemi-sef-2", "acemi-sef-3"]
  },
  {
    name: "Oyuncu Dükkanı", slug: "oyuncu-dukkani", kind: "oyun", genre: "Simülasyon",
    ios: "6778437262", android: "com.oyuncudukkani.app",
    blurb: "Oyun dükkânını yönet: al, sat, pazarlık et.",
    desc: "Oyun CD'leri, konsollar ve oyuncu ekipmanları al-sat. Müşterilerle pazarlık et, kasayı doldur, kira gününü atlat. Dükkânını geliştir, zengin ol.",
    shots: ["oyuncu-dukkani-1", "oyuncu-dukkani-2", "oyuncu-dukkani-3"]
  },
  {
    name: "Snapiq", slug: "snapiq", kind: "oyun", genre: "Refleks",
    ios: "6780837725", android: "com.snapiq.app", pages: "snapiq",
    blurb: "Onlarca mini oyunla reflekslerini sına.",
    desc: "Ne kadar hızlı, ne kadar keskin olduğunu onlarca kısa oyunla ölç. Her gün yeniden dene, rekorunu kır.",
    shots: ["snapiq-1", "snapiq-2", "snapiq-3"]
  },
  {
    name: "Matematikçik", slug: "matematikcik", kind: "oyun", genre: "Eğitim",
    ios: "6779563082", android: "com.matematikcik.app", pages: "matematikcik",
    blurb: "Hesap yaparken eğlen, eğlenirken öğren.",
    desc: "Toplama, çıkarma, çarpma, bölme ve daha fazlası. Her yaştan oyuncu için hızlı turlar, artan zorluk ve hesap yapmayı oyuna çeviren küçük bir uygulama.",
    shots: ["matematikcik-1", "matematikcik-2", "matematikcik-3"]
  },
  {
    name: "Brakeless: Endless Race", slug: "brakeless", kind: "oyun", genre: "Yarış",
    ios: "6450942732", android: null, play: "play/brakeless/",
    blurb: "Frenin yok. Trafiğe çarpmadan ne kadar gidebilirsin?",
    desc: "Durmak yok. Akan trafiğin arasından çarpmadan sıyrıl, refleksinle skoru yukarı taşı. Bu oyun tarayıcıda da çalışıyor: aşağıdaki düğmeyle hemen dene.",
    shots: ["brakeless-1", "brakeless-2", "brakeless-3"]
  },
  {
    name: "Magnus: Astrology & Tarot", slug: "magnus", kind: "uygulama", genre: "Yaşam tarzı",
    ios: "1612979368", android: "com.futurastic.Magnus", pages: "magnus",
    blurb: "Astroloji, tarot ve fal tek uygulamada.",
    desc: "Burç yorumları, tarot açılımları ve günlük motivasyon. Kadim fal geleneğini kişisel gelişim yaklaşımıyla birleştiren, stüdyonun en eski ve en büyük uygulaması.",
    shots: ["magnus-1", "magnus-2", "magnus-3"]
  },
  {
    name: "Perfumella", slug: "perfumella", kind: "uygulama", genre: "Yaşam tarzı",
    ios: "6783397859", android: "com.perfumator.app", pages: "perfumator",
    blurb: "Sevdiğin notaları öğren, kendi kokunu bul.",
    desc: "Her kokunun bir karakteri var. Perfumella sevdiğin notaları, tarzını ve zevkini anlamana yardım ediyor, parfüm seçmeyi daha kişisel ve daha keyifli hale getiriyor.",
    shots: ["perfumella-1", "perfumella-2", "perfumella-3"]
  },
  {
    name: "Delil: Allah'ın Delilleri", slug: "delil", kind: "uygulama", genre: "Başvuru",
    ios: "6780416985", android: "com.delilapp.delil", pages: "delil",
    blurb: "Tefekküre davet eden deliller, kart kart.",
    desc: "Allah'ın varlığına dair deliller, Kur'an mucizeleri ve zor sorulara verilen cevaplar kartlar halinde. Bilimden felsefeye, ahlaktan evrenin düzenine uzanan bir tefekkür uygulaması.",
    shots: ["delil-1", "delil-2", "delil-3"]
  },
  {
    name: "Amin", slug: "amin", kind: "uygulama", genre: "Başvuru",
    ios: "6779628851", android: "com.amin.amin", pages: "amin",
    blurb: "Dualar, tesbihler ve zikirmatik.",
    desc: "Sıkıntına özel dualar, tesbihler ve zikirler; Türkçe meal ve Arapça okunuşlarıyla, faziletlerine göre gruplanmış. Okuduklarının sayısını zikirmatikle tut.",
    shots: ["amin-1", "amin-2", "amin-3"]
  },
  {
    name: "Yalancı Falcı", slug: "yalanci-falci", kind: "uygulama", genre: "Yaşam tarzı",
    ios: "6448210215", android: null,
    blurb: "Bazen tek bir söz hayatını değiştirir.",
    desc: "Her açılışta seni düşündürecek bir söz. Dış etkenleri değiştiremiyorsan kendini değiştir: yeni bir yol, yeni bir bakış.",
    shots: ["yalanci-falci-1", "yalanci-falci-2", "yalanci-falci-3"]
  }
];
window.FT_APPS.forEach(function (a) {
  a.icon = "icons/" + a.slug + ".jpg";
});

// Web ads. Google AdSense, not AdMob: AdMob only serves inside apps. Leave
// client null and every ad slot stays out of the page. Once AdSense approves
// this site, put the "ca-pub-..." id here and the ad unit ids in slots.
window.FT_ADS = {
  client: "ca-pub-6470338276121414",  // same publisher as AdMob (app-ads.txt)
  test: false,           // true shows Google test ads in the game breaks
  frequency: "120s",     // minimum time between two game ad breaks
  slots: { stores: null, player: null }  // display ad unit ids
};
