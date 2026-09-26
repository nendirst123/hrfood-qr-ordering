import { MenuItem } from '@/types/order';

export const RESTAURANT_INFO = {
  name: 'HR Food',
  tagline: 'Makan Enak, Mood Naik!',
  subtagline: 'Masakan Rumahan Rasa Juara!',
  phone: '0838-3843-2860',
  address: 'Pusat Kuliner HR Food, Layanan Dine-in & Delivery',
  description: 'Fresh • Lezat • Bersih • Terjangkau',
  notesTitle: 'Tentukan Sendiri Level Pedasmu!',
};

export const CATEGORIES = [
  'Semua',
  'Paket Hemat',
  'Ayam & Bebek',
  'Ikan & Seafood',
  'Sate & Jeroan',
  'Sayur & Pelengkap',
  'Nasi & Minuman',
  'Aneka Sambal'
] as const;

// Default Sambal & Level options for main dishes
const DEFAULT_SAMBAL_OPTIONS = [
  {
    "name": "Pilihan Varian Sambal",
    "choices": [
      {
        "label": "Sambal Terasi (Klasik & Nagih)",
        "extraPrice": 0
      },
      {
        "label": "Sambal Bawang (Segar & Pedas)",
        "extraPrice": 0
      },
      {
        "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
        "extraPrice": 0
      },
      {
        "label": "Tanpa Sambal / Sambal Dipisah",
        "extraPrice": 0
      }
    ]
  },
  {
    "name": "Level Pedas",
    "choices": [
      {
        "label": "Level 1 - Sedang Gurih",
        "extraPrice": 0
      },
      {
        "label": "Level 2 - Pedas Mantap",
        "extraPrice": 0
      },
      {
        "label": "Level 3 - Pedas Nampol (Extra Cabe)",
        "extraPrice": 1000
      },
      {
        "label": "Level 0 - Tidak Pedas",
        "extraPrice": 0
      }
    ]
  }
];

export const MENU_ITEMS: MenuItem[] = [
  {
    "id": "hr-paket-01",
    "name": "Paket Puas Ayam Kampung",
    "category": "Paket Hemat",
    "price": 26000,
    "description": "Nasi pulen + Ayam Kampung Goreng rempah + Tahu & Tempe + Lalapan segar + Pilihan Sambal & Level + Es Teh Manis Jumbo.",
    "image": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
    "isPopular": true,
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-paket-02",
    "name": "Paket Mantap Ayam Kremes",
    "category": "Paket Hemat",
    "price": 22000,
    "description": "Nasi pulen + Ayam Goreng Besar kremes gurih + Tahu & Tempe + Lalapan segar + Pilihan Sambal + Es Teh Manis Jumbo.",
    "image": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80",
    "isPopular": true,
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-paket-03",
    "name": "Paket Ekonomis Lele Crispy",
    "category": "Paket Hemat",
    "price": 17000,
    "description": "Nasi pulen + Lele Goreng Crispy gurih + Tahu goreng + Lalapan + Pilihan Sambal + Es Teh Manis Jumbo.",
    "image": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
    "isPopular": true,
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-paket-04",
    "name": "Paket Hemat Paha Pentung",
    "category": "Paket Hemat",
    "price": 15000,
    "description": "Nasi pulen + Paha Pentung gurih + Lalapan + Pilihan Sambal + Teh Tawar dingin/hangat.",
    "image": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80",
    "isPopular": true,
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-ayam-01",
    "name": "Ayam Kampung Goreng Super",
    "category": "Ayam & Bebek",
    "price": 19000,
    "description": "Ayam kampung asli gurih meresap dengan bumbu rempah kuning khas rumahan, daging lembut dan wangi.",
    "image": "/menu/ayam-kampung.jpg",
    "isPopular": true,
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-ayam-02",
    "name": "Ayam Goreng Besar",
    "category": "Ayam & Bebek",
    "price": 15000,
    "description": "Potongan ayam ukuran besar dengan taburan kremes renyah, gurih hingga ke tulang.",
    "image": "/menu/ayam-goreng-besar.jpg",
    "isPopular": true,
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-ayam-03",
    "name": "Ayam Paha Pentung",
    "category": "Ayam & Bebek",
    "price": 10000,
    "description": "Paha ayam pentung juicy digoreng bumbu rempah mantap, pas untuk porsi hemat.",
    "image": "/menu/ayam-paha-pentung.jpg",
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-ayam-06",
    "name": "Ayam Bakar Madu Gurih",
    "category": "Ayam & Bebek",
    "price": 16000,
    "description": "Potongan ayam bumbu rempah dioles kecap madu gurih manis, dibakar wangi meresap hingga ke serat daging.",
    "image": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    "isPopular": true,
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-bebek-01",
    "name": "Bebek Goreng Rempah Gurih",
    "category": "Ayam & Bebek",
    "price": 24000,
    "description": "Bebek muda empuk bebas bau amis diungkep rempah kuning gurih, digoreng garing dengan taburan serundeng lengkuas.",
    "image": "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=600&q=80",
    "isPopular": true,
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-ayam-04",
    "name": "Pepes Ayam Kemangi",
    "category": "Ayam & Bebek",
    "price": 10000,
    "description": "Pepes ayam bungkus daun pisang kukus matang dengan bumbu rica kemangi harum pedas menggoda.",
    "image": "/menu/pepes-ayam.jpg",
    "isPopular": true
  },
  {
    "id": "hr-ayam-05",
    "name": "Kepala Ayam Goreng",
    "category": "Ayam & Bebek",
    "price": 5000,
    "description": "Kepala ayam ungkep bumbu kuning digoreng garing renyah.",
    "image": "/menu/kepala-ayam.jpg",
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-ikan-01",
    "name": "Ikan Goreng Spesial",
    "category": "Ikan & Seafood",
    "price": 15000,
    "description": "Ikan segar pilihan digoreng kering renyah dengan bumbu bawang ketumbar gurih nikmat.",
    "image": "/menu/ikan-goreng.jpg",
    "isPopular": true,
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-ikan-02",
    "name": "Lele Goreng Crispy",
    "category": "Ikan & Seafood",
    "price": 10000,
    "description": "Ikan lele fresh berbalut kremesan renyah, daging empuk dan bebas bau tanah.",
    "image": "/menu/lele-goreng.jpg",
    "isPopular": true,
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-ikan-04",
    "name": "Nila Bakar Kecap Pedas Manis",
    "category": "Ikan & Seafood",
    "price": 16000,
    "description": "Ikan nila segar dibakar bumbu oles kecap rempah gurih manis wangi khas bakaran tradisional.",
    "image": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80",
    "isPopular": true,
    "options": [
      {
        "name": "Pilihan Varian Sambal",
        "choices": [
          {
            "label": "Sambal Terasi (Klasik & Nagih)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Bawang (Segar & Pedas)",
            "extraPrice": 0
          },
          {
            "label": "Sambal Cabe Ijo (Pedasnya Mantap)",
            "extraPrice": 0
          },
          {
            "label": "Tanpa Sambal / Sambal Dipisah",
            "extraPrice": 0
          }
        ]
      },
      {
        "name": "Level Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang Gurih",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Pedas Nampol (Extra Cabe)",
            "extraPrice": 1000
          },
          {
            "label": "Level 0 - Tidak Pedas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-ikan-03",
    "name": "Ikan Asin Goreng",
    "category": "Ikan & Seafood",
    "price": 3000,
    "description": "Ikan asin garing kriuk, teman setia sambal terasi dan lalapan segar.",
    "image": "/menu/ikan-asin.jpg"
  },
  {
    "id": "hr-sate-01",
    "name": "Sate Ati Ampela",
    "category": "Sate & Jeroan",
    "price": 5000,
    "description": "Tusukan ati ampela pilihan dimasak bumbu gurih meresap sebelum digoreng.",
    "image": "/menu/sate-ati-ampela.jpg",
    "isPopular": true
  },
  {
    "id": "hr-sate-02",
    "name": "Ati Ampela Goreng Porsi",
    "category": "Sate & Jeroan",
    "price": 6000,
    "description": "Ati ampela porsian digoreng bumbu gurih empuk nikmat.",
    "image": "/menu/ati-ampela.jpg"
  },
  {
    "id": "hr-sate-03",
    "name": "Sate Kulit Ayam Crispy",
    "category": "Sate & Jeroan",
    "price": 3000,
    "description": "Sate kulit ayam goreng renyah bumbu manis gurih nagih.",
    "image": "/menu/sate-kulit.jpg",
    "isPopular": true
  },
  {
    "id": "hr-sate-04",
    "name": "Sate Usus Ayam",
    "category": "Sate & Jeroan",
    "price": 3000,
    "description": "Usus ayam bersih dimasak bumbu kuning lalu digoreng gurih.",
    "image": "/menu/sate-usus.jpg"
  },
  {
    "id": "hr-sayur-07",
    "name": "Sayur Asem Segar Rumahan",
    "category": "Sayur & Pelengkap",
    "price": 6000,
    "description": "Sayur asem kuah bening segar asam manis berpadu jagung manis, labu siam, kacang panjang, dan melinjo.",
    "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80",
    "isPopular": true
  },
  {
    "id": "hr-sayur-08",
    "name": "Sayur Sop Ayam Bening",
    "category": "Sayur & Pelengkap",
    "price": 7000,
    "description": "Sop kaldu ayam bening gurih hangat dengan wortel, kentang, buncis, seledri, dan bawang goreng. Favorit anak-anak.",
    "image": "https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=600&q=80",
    "isPopular": false
  },
  {
    "id": "hr-sayur-09",
    "name": "Bakwan Jagung Renyah (Isi 2)",
    "category": "Sayur & Pelengkap",
    "price": 5000,
    "description": "Bakwan jagung manis pipil renyah gurih keemasan, pelengkap wajib makan berselera.",
    "image": "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80",
    "isPopular": true
  },
  {
    "id": "hr-sayur-10",
    "name": "Telur Dadar Crispy Gurih",
    "category": "Sayur & Pelengkap",
    "price": 4000,
    "description": "Telur ayam kocok bumbu daun bawang digoreng garing keriting renyah.",
    "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
    "isPopular": false
  },
  {
    "id": "hr-sayur-01",
    "name": "Pete Goreng",
    "category": "Sayur & Pelengkap",
    "price": 5000,
    "description": "Biji pete segar pilihan digoreng setengah matang, manis gurih berpadu sambal.",
    "image": "/menu/pete-goreng.jpg",
    "isPopular": true
  },
  {
    "id": "hr-sayur-02",
    "name": "Jukut Goreng Crispy",
    "category": "Sayur & Pelengkap",
    "price": 5000,
    "description": "Sayur kangkung/jukut hijau segar digoreng krispi dengan rempah renyah gurih.",
    "image": "/menu/jukut-goreng.jpg",
    "isPopular": true
  },
  {
    "id": "hr-sayur-03",
    "name": "Kol Goreng Gurih",
    "category": "Sayur & Pelengkap",
    "price": 5000,
    "description": "Sayur kol segar digoreng wangi kecokelatan bercita rasa manis gurih khas.",
    "image": "/menu/kol-goreng.jpg",
    "isPopular": true
  },
  {
    "id": "hr-sayur-04",
    "name": "Terong Goreng",
    "category": "Sayur & Pelengkap",
    "price": 5000,
    "description": "Terong ungu segar dipotong memanjang dan digoreng lembut gurih.",
    "image": "/menu/terong-goreng.jpg"
  },
  {
    "id": "hr-sayur-05",
    "name": "Tahu Goreng",
    "category": "Sayur & Pelengkap",
    "price": 2000,
    "description": "Tahu putih lembut berbumbu garam ketumbar digoreng hangat.",
    "image": "/menu/tahu-goreng.jpg"
  },
  {
    "id": "hr-sayur-06",
    "name": "Tempe Goreng",
    "category": "Sayur & Pelengkap",
    "price": 2000,
    "description": "Tempe kedelai gurih dipotong tebal digoreng garing renyah.",
    "image": "/menu/tempe-goreng.jpg"
  },
  {
    "id": "hr-sambal-01",
    "name": "Sambal Terasi (Klasik & Nagih)",
    "category": "Aneka Sambal",
    "price": 3000,
    "description": "Sambal terasi ulek segar dengan tomat matang, terasi bakar harum, dan cabe rawit pilihan.",
    "image": "/menu/sambal-terasi.jpg",
    "isPopular": true,
    "options": [
      {
        "name": "Tingkat Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Extra Pedas Nampol",
            "extraPrice": 1000
          }
        ]
      }
    ]
  },
  {
    "id": "hr-sambal-02",
    "name": "Sambal Bawang (Segar & Pedas)",
    "category": "Aneka Sambal",
    "price": 3000,
    "description": "Cabe rawit merah dan bawang putih pilihan diulek kasar lalu disiram minyak panas gurih.",
    "image": "/menu/sambal-bawang.jpg",
    "isPopular": true,
    "options": [
      {
        "name": "Tingkat Pedas",
        "choices": [
          {
            "label": "Level 1 - Sedang",
            "extraPrice": 0
          },
          {
            "label": "Level 2 - Pedas Mantap",
            "extraPrice": 0
          },
          {
            "label": "Level 3 - Extra Pedas Nampol",
            "extraPrice": 1000
          }
        ]
      }
    ]
  },
  {
    "id": "hr-sambal-03",
    "name": "Sambal Cabe Ijo (Pedasnya Mantap)",
    "category": "Aneka Sambal",
    "price": 3000,
    "description": "Cabe hijau segar dan tomat hijau ditumis rempah wangi gurih menggugah selera.",
    "image": "/menu/sambal-cabe-ijo.jpg",
    "isPopular": true
  },
  {
    "id": "hr-nasi-01",
    "name": "Nasi Putih Pulen",
    "category": "Nasi & Minuman",
    "price": 5000,
    "description": "Nasi putih beras pilihan hangat pulen porsi mengenyangkan.",
    "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
    "isPopular": true
  },
  {
    "id": "hr-nasi-02",
    "name": "Nasi Uduk Gurih Wangi",
    "category": "Nasi & Minuman",
    "price": 6000,
    "description": "Nasi gurih beras pilihan dimasak santan, daun salam, serai wangi, dan taburan bawang goreng.",
    "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
    "isPopular": true
  },
  {
    "id": "hr-minum-01",
    "name": "Es Teh Manis Jumbo",
    "category": "Nasi & Minuman",
    "price": 4000,
    "description": "Teh melati seduh wangi manis segar dengan es batu melimpah.",
    "image": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80",
    "isPopular": true,
    "options": [
      {
        "name": "Kadar Manis",
        "choices": [
          {
            "label": "Normal Manis",
            "extraPrice": 0
          },
          {
            "label": "Less Sugar (Sedikit Gula)",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-minum-02",
    "name": "Teh Tawar (Es / Hangat)",
    "category": "Nasi & Minuman",
    "price": 2000,
    "description": "Teh tawar seduh wangi menyegarkan.",
    "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    "options": [
      {
        "name": "Suhu",
        "choices": [
          {
            "label": "Dingin (Pakai Es)",
            "extraPrice": 0
          },
          {
            "label": "Hangat",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-minum-03",
    "name": "Es Jeruk Peras Asli",
    "category": "Nasi & Minuman",
    "price": 5000,
    "description": "Perasan jeruk asli manis segar kaya vitamin C penawar pedas.",
    "image": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
    "isPopular": true
  },
  {
    "id": "hr-minum-05",
    "name": "Es Timun Serut Selasih",
    "category": "Nasi & Minuman",
    "price": 5000,
    "description": "Serutan timun hijau segar berpadu biji selasih, sirup melon manis, dan es batu dingin. Penawar pedas alami nomor 1.",
    "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    "isPopular": true
  },
  {
    "id": "hr-minum-06",
    "name": "Es Cincau Gula Merah",
    "category": "Nasi & Minuman",
    "price": 5000,
    "description": "Potongan cincau hitam kenyal lembut disiram kuah gula aren manis legit dan es batu dingin.",
    "image": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
    "isPopular": true
  },
  {
    "id": "hr-minum-07",
    "name": "Kopi Hitam Tubruk Tradisional",
    "category": "Nasi & Minuman",
    "price": 4000,
    "description": "Kopi hitam robusta seduh air mendidih beraroma mantap khas warung kampung.",
    "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    "options": [
      {
        "name": "Kadar Manis",
        "choices": [
          {
            "label": "Manis Sedang",
            "extraPrice": 0
          },
          {
            "label": "Pahit (Tanpa Gula)",
            "extraPrice": 0
          },
          {
            "label": "Extra Manis",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-minum-08",
    "name": "Kopi Susu Kampung Mantap",
    "category": "Nasi & Minuman",
    "price": 6000,
    "description": "Perpaduan kopi hitam harum dengan kental manis gurih legit, nikmat disajikan panas atau es dingin.",
    "image": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80",
    "isPopular": true,
    "options": [
      {
        "name": "Suhu Penyajian",
        "choices": [
          {
            "label": "Es Dingin Segar",
            "extraPrice": 0
          },
          {
            "label": "Hangat / Panas",
            "extraPrice": 0
          }
        ]
      }
    ]
  },
  {
    "id": "hr-minum-04",
    "name": "Air Mineral Botol",
    "category": "Nasi & Minuman",
    "price": 4000,
    "description": "Air mineral murni higienis dingin / suhu ruangan.",
    "image": "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80",
    "options": [
      {
        "name": "Suhu",
        "choices": [
          {
            "label": "Dingin",
            "extraPrice": 0
          },
          {
            "label": "Suhu Ruangan (Biasa)",
            "extraPrice": 0
          }
        ]
      }
    ]
  }
];
