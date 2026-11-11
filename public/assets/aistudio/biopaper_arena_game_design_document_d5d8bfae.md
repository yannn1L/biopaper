
# GAME DESIGN DOCUMENT (GDD) & TECHNICAL SPECIFICATION

## BIOPAPER ARENA: GENETIC AUTO-BATTLER

**Genre:** Genetic Evolution + Auto-Battler / Battle Royale Simulation

**Visual Aesthetic:** Cut-Out Papercraft + Juicy Cartoon (Organic Mutations)

**Target Platform:** Web (Mobile-Optimized), YouTube Shorts (9:16 Portrait Lock - 1080 × 1920)

**Tech Stack:** Pixi.js (v8) + Modern Vanilla JavaScript (ESM)

**Architecture:** Hybrid Strategy Pattern + Central Registry + Object Pooling

**Spectator Mode:** 100% UI-Free in Simulation Scene (Pure Cinematic/Spectator Feed)

## 1. EXECUTIVE SUMMARY & GAME OVERVIEW

### 1.1 High Concept

*BioPaper Arena* adalah simulasi *auto-battler* bertema biologi mutasi di mana 4 hingga 16 organisme berbentuk geometri kartun kertas (*Circle, Triangle, Soft Rectangle*) terjun payung ke dalam arena melingkar. Setiap unit terlahir dengan satu organ genetik awal. Saat seekor organisme berhasil mengeliminasi mangsanya, organ genetik korban dicabut dan dicangkokkan ke tubuh sang pemenang. Setiap 5 detik, kapsul pasokan udara (*Supply Drop*) menjatuhkan mutagen virus atau parasit hidup yang menempel di punggung unit, mengubah arena menjadi ekosistem evolusi brutal yang cepat dan adiktif bagi penonton YouTube Shorts.

### 1.2 Pilar Utama Desain

1. **Juicy Cut-Out Aesthetic:** Diorama kertas bertingkat (*layered cardstock diorama*) dengan bayangan tebal, goyangan elastis (*squash-and-stretch*), tepi kertas berserat halus, dan eliminasi bertabur serpihan kertas (*paper confetti*).

2. **Modular Organic Mutation Socketing:** Mutasi divisualisasikan sebagai organ biologis kartun (capit, mata berkedip, belalai asam, kantung spora) yang terpasang secara fisik pada titik pasang (*anchor sockets*) poligon tubuh.

3. **Pure Spectator Canvas (Zero UI):** Scene simulasi murni 100% bebas dari elemen overlay antarmuka pengguna standar (tanpa tombol, panel, bilah navigasi, atau kursor mouse).

4. **Fast-Paced Retention Arc:** Format durasi pertempuran 35–45 detik yang padat peristiwa, didorong oleh pasokan mutasi berkala setiap 5 detik untuk menjaga dinamika visual tetap segar.

## 2. ART DIRECTION & JUICY CARTOON AESTHETIC

### 2.1 Konsep Visual (Cut-Out Papercraft)

* **Karakter Dasar (Chassis):** Kertas karton tebal berpola halus dengan garis tepi luar kartun tebal (*stroke* 4px `#1A1D20`) dan *drop shadow* lembut ke arah lantai arena (sudut $45^\circ$, blur 8px, *alpha* 0.35).

* **Organ Mutasi Genetik:** Memiliki kontras visual tajam terhadap tubuh inang—menggunakan bentuk melengkung, berdaging, bertentakel, dan basah bergaya kartun (*juicy organic morphology*).

* **Lantai Arena:** Kertas perkamen/blueprint kayu melingkar dengan ukiran batas cincin konsentris berpori.

* **Elemen "Juicy" Feedback:**

  * **Hit Flash:** Unit berkedip putih pekat selama 1 frame ($16\text{ ms}$) saat menerima luka benturan atau proyektil.

  * **Squash & Stretch Kinematics:** Tubuh memanjang saat melesat (*dash*) dan memipih saat membentur musuh atau dinding arena.

  * **Grafting Snap Effect:** Ketika gen mutasi musuh diserap, organ tersebut terbang mengikuti kurva busur (*bezier trajectory*), lalu menempel pada soket kosong inang dengan efek hantaman stempel kertas (*thumbtack pop*) dan partikel debu kertas melingkar.

  * **Eliminasi Berhamburan:** Unit yang kalah tidak menghilang begitu saja, melainkan robek dan meledak menjadi puluhan serpihan potongan kertas segitiga warna-warni (*paper confetti physics*).

### 2.2 Palet Warna & Skema Identitas

| Komponen | Kode Warna Hex | Catatan Visual | 
| ----- | ----- | ----- | 
| **Arena Backdrop** | `#2B2D42` (Dark Slate Paper) | Latar belakang kontras tinggi | 
| **Circle Chassis** | `#FF6B6B` (Coral Red) | Kertas bertekstur titik lembut | 
| **Triangle Chassis** | `#4D96FF` (Cyan Blue) | Kertas bergaris sudut geometris | 
| **Rectangle Chassis** | `#6BCB77` (Pastel Emerald) | Kertas karton serat tebal | 
| **Venom & Acid** | `#00F5D4` (Neon Toxic Green) | Gelembung cairan asam berpendar | 
| **Supply Parasites** | `#9B5DE5` (Deep Bioluminescent Purple) | Daging tentakel bersinar halus | 
| **Paper Drop Shadow** | `rgba(15, 18, 25, 0.4)` | Efek kedalaman 2.5D layer | 

## 3. CHASSIS ANATOMY & KOMPONEN DASAR UNIT

Setiap unit dirakit dari tiga lapis komponen: **Physical Chassis**, **Socket Attachment System**, dan **Behavioral Brain (Hybrid Strategy)**.

```
       [ Socket 0: Utilitas/Mata ]
                  │
        ┌─────────┴─────────┐
[Skt 3] ┤    CHASSIS BODY   ├ [Skt 1: Senjata Utama]
(Armor) │  (Circle/Tri/Rect)│
        └─────────┬─────────┘
                  │
       [ Socket 2: Mobilitas ]

```

### 3.1 Varian Bentuk Dasar (Chassis)

| Bentuk | Massa Fisika | HP Dasar | Kecepatan | Slot Socket | Karakteristik Tempur | 
| ----- | ----- | ----- | ----- | ----- | ----- | 
| **Circle** | Ringan ($1.0$) | $120$ | $260\text{ px/s}$ | 4 Socket | Sangat lincah, memantul tanpa kehilangan momentum putar. | 
| **Triangle** | Sangat Ringan ($0.7$) | $85$ | $310\text{ px/s}$ | 3 Socket | Akselerasi instan, damage tusukan ujung moncong $+25\%$. | 
| **Soft Rectangle** | Berat ($2.4$) | $220$ | $160\text{ px/s}$ | 6 Socket | Sulit terdorong (*high knockback resist*), slot mutasi paling banyak. | 

## 4. SISTEM GENETIKA & MUTASI ORGANIK

### 4.1 Katalog Mutasi Awal (Innate Mutations)

Setiap unit di-*spawn* dengan 1 gen acak yang langsung menempati soket fungsionalnya:

```
┌─────────────────┬──────────────────┬─────────────────┬─────────────────┐
│   Bio-Pincer    │   Acid Spitter   │   Venom Gland   │  Cilia Flagella │
│   [Melee/Stun]  │  [Ranged Bullet] │  [AoE Cloud]    │  [Burst Dash]   │
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘

```

1. **Bio-Pincer (Organ Capit Kartun):**

   * *Morfologi:* Sepasang gunting capit kepiting karton yang membuka dan mencapit secara ritmis.

   * *Mekanik:* Serangan jarak dekat ($60\text{ px}$). Menghasilkan $25\text{ DMG}$, efek *stun* selama $0.25\text{ detik}$, dan melempar target mundur (*knockback*).

2. **Acid Spitter (Belalai Pelontar Asam):**

   * *Morfologi:* Belalai ulat kenyal dengan satu mata bundar di pangkal soketnya.

   * *Mekanik:* Menembakkan bola cairan asam setiap $1.4\text{ detik}$ ke arah musuh. Proyektil melengkung dan meletup (*squelch*) saat kontak, menghasilkan $18\text{ DMG}$.

3. **Venom Gland (Kantung Spora Berdenyut):**

   * *Morfologi:* Kantung membran transparan dengan gelembung racun hijau yang mengembang kempis.

   * *Mekanik:* Menyemprotkan cincin kabut beracun setiap $3.0\text{ detik}$ dalam radius $120\text{ px}$. Memberikan efek *Damage-over-Time (DoT)* $5\text{ DMG/detik}$ selama $4\text{ detik}$.

4. **Cilia Flagella (Ekor Dayung Mobilitas):**

   * *Morfologi:* Ekor serabut kertas lentur yang bergetar di soket belakang.

   * *Mekanik:* Memberikan dorongan kecepatan eksplosif ($+200\%$ selama $0.4\text{ detik}$) setiap kali unit mengubah arah atau mendekati target.

### 4.2 Gene Stealing & Fusion Mechanic

Saat Unit $A$ membunuh Unit $B$:

* Seluruh organ mutasi yang menempel pada Unit $B$ terlepas dan mengapung di udara sebagai *Lootable Genes*.

* Organ mutasi tersebut tertarik secara magnetis menuju Unit $A$.

* **Pencangkokan (Socket Allocation):**

  * Jika Unit $A$ memiliki soket kosong, organ baru langsung menancap pada soket yang paling ergonomis.

  * Jika seluruh soket Unit $A$ telah terisi dan organ yang dicuri bertipe sama, terjadi **Mutational Fusion (Level 2)**:

    * *Bio-Pincer Lvl 2:* Ukuran capit membesar $1.4\times$, damage berlipat ganda, dan capit mendapatkan duri tambahan.

    * *Acid Spitter Lvl 2:* Menembakkan 2 bola proyektil sekaligus dalam pola menyebar (*spread shot*).

## 5. DYNAMIC SUPPLY DROPS: VIRUS & PARASIT

Setiap 5.0 detik, sebuah kotak pasokan udara berkontur kertas karton dijatuhkan dari langit arena menggunakan parasut bergaris merah-putih.

```
       [ Kapsul Parasut Kertas ]
                  │
                  ▼ (Jatuh Pelan di Arena, Y: -100 -> Target X,Y)
        ┌───────────────────┐
        │   MUTATION CRATE  │
        └─────────┬─────────┘
                  │
     ┌────────────┴────────────┐
     ▼                         ▼
[VIRUS DROP]             [PARASITE DROP]
(Stat & Behavioral)      (Living Symbiont Weapon)
- Gigantism Virus        - Leech Maw (Lifesteal)
- Hyper-Speed Mutagen    - Bombardier Beetle Sac
- Spiky Carapace         - Shadow Chameleon Eye

```

### 5.1 Kategori Mutagen Kotak Pasokan

1. **Mutasi Virus (Stat & Trait Overhaul):**

   * *Gigantism Virus:* Ukuran tubuh membengkak $+40\%$, max HP $+100\%$, namun kecepatan turun $-20\%$. Memberikan kemampuan menginjak musuh kecil (*Trample Damage*).

   * *Spiky Carapace Mutagen:* Menumbuhkan lapisan duri kertas di seluruh sisi tubuh; memantulkan $35\%$ damage serangan jarak dekat kembali ke penyerang.

2. **Mutasi Parasit (Senjata Hidup Simbiosis):**

   * *Leech Maw Tendril:* Menempel di atas kepala inang. Menembakkan sulur tentakel yang mengunci musuh dan menyedot $12\text{ HP/detik}$ untuk mengisi darah inang (*Lifesteal*).

   * *Bombardier Shell:* Melemparkan kantung peledak kertas setiap $4\text{ detik}$ yang menimbulkan ledakan area masif saat mendarat.

## 6. SISTEM KECERDASAN BUATAN: HYBRID STRATEGY PATTERN

Logika setiap unit dipisahkan menjadi komponen modular yang dieksekusi secara independen tanpa pengkondisian bercabang yang kaku:

```
┌──────────────────────────────────────────────────────────────┐
│                        UNIT CONTEXT                          │
│  - Stats Buffer  - Chassis Physics  - Active Mutation Sockets│
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
       ┌───────▼────────┐             ┌────────▼────────┐
       │ TARGET STRATEGY│             │ MOTION STRATEGY │
       └───────┬────────┘             └────────┬────────┘
               │                               │
    ┌──────────┼──────────┐           ┌────────┼────────┐
    │          │          │           │        │        │
┌───▼────┐ ┌───▼───┐ ┌────▼─────┐ ┌───▼────┐ ┌─▼─────┐ ┌▼──────┐
│Nearest │ │Lowest │ │Highest   │ │Direct  │ │Orbit  │ │Coward │
│Enemy   │ │HP Hunt│ │Threat Skt│ │Charge  │ │Strafe │ │Flee   │
└────────┘ └───────┘ └──────────┘ └────────┘ └───────┘ └───────┘

```

### 6.1 Targeting Strategies

* `NearestTargetStrategy`: Mengunci unit hidup dengan jarak Euclidean terdekat.

* `LowestHPTargetStrategy`: Memprioritaskan unit sekarat untuk mempercepat eliminasi dan penyerapan mutasi genetik (*Kill Stealing*).

* `ApexPredatorStrategy`: Memilih musuh dengan jumlah mutasi terbanyak di arena.

### 6.2 Movement & Locomotion Strategies

* `DirectChargeStrategy`: Melesat lurus ke arah target dengan gaya tolak pendorong maksimum.

* `KitingStrafeStrategy`: Menjaga jarak ideal ($180 - 240\text{ px}$) dari musuh bertipe *melee*, berotasi mengelilingi target sambil menembakkan proyektil.

* `FleeWhenLowStrategy`: Menjauhi pertempuran saat darah di bawah $25\%$ untuk berburu kotak pasokan supply drop.

## 7. ARSITEKTUR TEKNIS & OPTIMASI (PIXI.JS V8)

### 7.1 Pipeline Tiga Scene

```
[ LOADING SCENE ] ──(Bake Textures & LUT)──► [ EDITOR SCENE ] ──(Deploy Drop)──► [ SIMULATION SCENE ]
                                                   ▲                                    │
                                                   └───────────(Auto Reset)─────────────┘

```

#### A. Scene 1: Loading Scene (Pre-computation & Baking)

* **Procedural Paper Texture Baking:**

  * Chassis *Circle*, *Triangle*, dan *Soft Rectangle* digambar menggunakan `Graphics` lengkap dengan serat dan *drop shadow*, kemudian diubah menjadi `RenderTexture` tunggal.

  * Komponen mutasi (*pincer, spitter, parasite, parachute*) di-*bake* ke texture atlas internal.

* **Math Lookup Tables (LUT):**

  * `sinLUT` dan `cosLUT` dial