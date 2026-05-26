import Phaser from 'phaser';
import { TILESETS } from '../data/assets.js';
import { createGameAnimations } from '../game/animations.js';
import { Sfx } from '../systems/Sfx.js';

const TILE_SIZE = 64;
const LOGIC_WALKABLE_LAYER = 'Gameplay_Walkable';
const LOGIC_BLOCKER_LAYER = 'Gameplay_Blocker';
const LOGIC_LAYERS = [LOGIC_WALKABLE_LAYER, LOGIC_BLOCKER_LAYER];
const MAP_LAYERS = [
  'Water',
  'decor_Water',
  'Bukit',
  'Tangga',
  'bukit_1',
  'Bangunan',
  'decor',
  ...LOGIC_LAYERS,
];
const NAV_DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const BLOCKED_GROUND_GIDS = new Set([42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55]);
const STAIR_GIDS = new Set([6, 15, 38, 41, 47, 50]);
const BRIDGE_RANGE = [273, 284];
const WALKABLE_TERRAIN_LAYERS = ['Bukit', 'bukit_1'];
const BRIDGE_LAYERS = ['Bangunan', 'decor_Water'];

const OBJECT_FALLBACKS = {
  player_spawn: [13, 8],
  castle_core: [12, 4],
  castle_attack: [13, 6],
  village_center: [24, 5],
  elder: [22, 5],
  blacksmith: [25, 4],
  healer: [23, 6],
  villager: [26, 6],
  captain: [13, 5],
  scout: [17, 10],
  merchant: [28, 7],
  aran: [18, 14],
  healer_south: [20, 12],
  guard_1: [14, 6],
  guard_2: [12, 6],
  guard_3: [17, 10],
  guard_4: [22, 10],
  enemy_spawn_south: [16, 21],
  enemy_spawn_east: [24, 18],
  enemy_spawn_west: [4, 18],
  enemy_spawn_far_left: [0, 10],
  enemy_spawn_far_right: [35, 10],
  enemy_spawn_bottom_left: [2, 16],
  enemy_spawn_bottom_right: [33, 16],
  enemy_base_core: [22, 18],
  boss_spawn: [24, 18],
};

const RESOURCE_NODES = [
  { key: 'wood-resource', type: 'wood', tile: [6, 3], amount: 4 },
  { key: 'wood-resource', type: 'wood', tile: [15, 6], amount: 4 },
  { key: 'gold-resource', type: 'gold', tile: [28, 5], amount: 5 },
  { key: 'gold-stone-6', type: 'gold', tile: [20, 6], amount: 6 },
  { key: 'meat-resource', type: 'wood', tile: [10, 8], amount: 3 },
  { key: 'gold-resource-highlight', type: 'gold', tile: [14, 12], amount: 8 },
];

const WAVE_CONFIGS = [
  {
    chapter: 1, chapterTitle: 'Bab 1: Bayangan di Perbatasan', title: 'Gelombang 1 - Pengintai Barat',
    speaker: 'Tetua Desa',
    dialog: 'Pengintai pasukan merah terlihat dari arah menara barat! Hadang mereka sebelum mereka sampai ke kastil, Ksatria!',
    units: [{ kind: 'grunt', count: 4, spawn: 'enemy_spawn_west' }],
  },
  {
    chapter: 2, chapterTitle: 'Bab 2: Barak Musuh', title: 'Gelombang 2 - Serangan Tengah',
    speaker: 'Pandai Besi',
    dialog: 'Pemanah dari barak pusat sudah bergabung dengan pasukan penyerang! Hati-hati, mereka menembak dari jauh!',
    units: [{ kind: 'grunt', count: 4, spawn: 'enemy_spawn_south' }, { kind: 'archer', count: 3, spawn: 'enemy_spawn_south' }],
  },
  {
    chapter: 3, chapterTitle: 'Bab 3: Benteng Timur', title: 'Gelombang 3 - Ksatria Berat',
    speaker: 'Kapten Jaga',
    dialog: 'Benteng timur mengirim ksatria berat ke arah kita! Pertahankan jembatan, jangan biarkan mereka lewat!',
    units: [{ kind: 'grunt', count: 2, spawn: 'enemy_spawn_east' }, { kind: 'raider', count: 4, spawn: 'enemy_spawn_east' }, { kind: 'brute', count: 1, spawn: 'enemy_spawn_east' }],
  },
  {
    chapter: 4, chapterTitle: 'Bab 4: Serangan Dua Arah', title: 'Gelombang 4 - Pengepungan',
    speaker: 'Warga Desa',
    dialog: 'Mereka menyerang dari barat dan selatan sekaligus! Desa kita dikepung! Tolong lindungi kami, Ksatria!',
    units: [{ kind: 'grunt', count: 5, spawn: 'enemy_spawn_west' }, { kind: 'brute', count: 2, spawn: 'enemy_spawn_west' }, { kind: 'archer', count: 4, spawn: 'enemy_spawn_south' }],
  },
  {
    chapter: 5, chapterTitle: 'Bab 5: Perbatasan Jauh', title: 'Gelombang 5 - Manuver Sayap',
    speaker: 'Tetua Desa',
    dialog: 'Penyusup datang dari perbatasan paling jauh! Bagaimana mereka tahu jalur rahasia kita? Aku curiga ada mata-mata di antara kita...',
    units: [{ kind: 'raider', count: 5, spawn: 'enemy_spawn_far_left' }, { kind: 'raider', count: 5, spawn: 'enemy_spawn_far_right' }],
  },
  {
    chapter: 6, chapterTitle: 'Bab 6: Gelombang Selatan', title: 'Gelombang 6 - Serbuan Massal',
    speaker: 'Tabib',
    dialog: 'Banyak prajurit kita yang terluka parah... Dan sekarang gelombang besar datang dari selatan! Bertahanlah, aku akan merawat yang bisa diselamatkan!',
    units: [{ kind: 'grunt', count: 6, spawn: 'enemy_spawn_bottom_left' }, { kind: 'archer', count: 6, spawn: 'enemy_spawn_bottom_right' }],
  },
  {
    chapter: 7, chapterTitle: 'Bab 7: Serangan Balik!', title: 'Gelombang 7 - Maju ke Depan',
    speaker: 'Aran',
    dialog: 'Ksatria, ini aku, Aran! Maafkan aku... Akulah yang membocorkan posisi kita ke musuh. Keluargaku disandera mereka. Tapi sekarang aku ingin menebus dosaku — biar kutunjukkan jalan ke markas mereka!',
    units: [{ kind: 'brute', count: 8, spawn: 'enemy_base_core' }, { kind: 'archer', count: 4, spawn: 'boss_spawn' }],
  },
  {
    chapter: 8, chapterTitle: 'Bab 8: Menembus Garis Pertahanan', title: 'Gelombang 8 - Penjaga Markas',
    speaker: 'Aran',
    dialog: 'Lewat sini! Aku tahu titik lemah pertahanan mereka. Mereka menyimpan pasukan terkuat di dalam kastil merah. Kita harus cepat sebelum mereka menyadari kehadiran kita!',
    units: [
      { kind: 'brute', count: 3, spawn: 'enemy_base_core' }, { kind: 'archer', count: 4, spawn: 'boss_spawn' },
      { kind: 'raider', count: 4, spawn: 'enemy_base_core' }, { kind: 'grunt', count: 4, spawn: 'boss_spawn' },
      { kind: 'grunt', count: 4, spawn: 'enemy_base_core' }
    ],
  },
  {
    chapter: 9, chapterTitle: 'Bab 9: Panji Merah', title: 'Gelombang 9 - Pertahanan Terakhir',
    speaker: 'Pandai Besi',
    dialog: 'Ini pedang terakhir yang bisa kutempa. Gunakan dengan bijak, Ksatria! Pasukan merah bertahan mati-matian di kastil mereka. Satu serangan lagi dan panji merah akan jatuh!',
    units: [
      { kind: 'brute', count: 5, spawn: 'enemy_base_core' }, { kind: 'archer', count: 5, spawn: 'boss_spawn' },
      { kind: 'raider', count: 5, spawn: 'enemy_base_core' }, { kind: 'brute', count: 3, spawn: 'boss_spawn' },
      { kind: 'archer', count: 3, spawn: 'enemy_base_core' }
    ],
  },
  {
    chapter: 10, chapterTitle: 'Bab 10: Pertempuran Terakhir', title: 'Gelombang 10 - Dua Tombak Hitam',
    speaker: 'Aran',
    dialog: 'Dua Tombak Hitam menjaga kastil merah! Aku akan mengalihkan perhatian yang satu — kau hadapi yang lainnya! Ini pertempuran terakhir kita, Ksatria. Akhiri perang ini!',
    units: [
      { kind: 'boss', count: 1, spawn: 'enemy_base_core' }, { kind: 'boss', count: 1, spawn: 'boss_spawn' },
      { kind: 'brute', count: 6, spawn: 'enemy_base_core' }
    ],
  },
];

const ENEMY_DEFS = {
  grunt: {
    texture: 'red-warrior-idle',
    hp: 2,
    speed: 78,
    scale: 0.48,
    body: [46, 34, 73, 138],
    damage: 1,
    rewardGold: 2,
    rewardWood: 1,
  },
  raider: {
    texture: 'red-warrior-idle',
    hp: 2,
    speed: 100,
    scale: 0.45,
    body: [44, 32, 74, 140],
    damage: 1,
    rewardGold: 3,
    rewardWood: 1,
  },
  archer: {
    texture: 'red-archer-idle',
    hp: 2,
    speed: 58,
    scale: 0.48,
    body: [42, 32, 75, 140],
    damage: 1,
    rewardGold: 4,
    rewardWood: 1,
  },
  brute: {
    texture: 'red-warrior-idle',
    hp: 5,
    speed: 56,
    scale: 0.58,
    body: [50, 38, 71, 136],
    damage: 2,
    rewardGold: 5,
    rewardWood: 2,
  },
  boss: {
    texture: 'black-lancer-idle',
    hp: 45,
    speed: 70,
    scale: 0.44,
    body: [72, 48, 124, 244],
    damage: 4,
    rewardGold: 14,
    rewardWood: 5,
  },
};

const NPCS = [
  { id: 'elder', name: 'Tetua Desa', object: 'elder', texture: 'yellow-monk-idle', animation: 'yellow-monk-idle', scale: 0.5, avatar: 'avatar-01', lines: ['Lindungi kastil ini, Ksatria.', 'Desa ini bergantung padamu.', 'Aku percaya padamu.'] },
  { id: 'blacksmith', name: 'Pandai Besi', object: 'blacksmith', texture: 'yellow-pawn-gold-idle', animation: 'yellow-pawn-gold-idle', scale: 0.52, avatar: 'avatar-18', lines: ['Bawa kayu dan emas, akan kuperbaiki segalanya.', 'Senjata terbaik butuh bahan terbaik.'] },
  { id: 'captain', name: 'Kapten Jaga', object: 'captain', texture: 'yellow-pawn-gold-idle', animation: 'yellow-pawn-gold-idle', scale: 0.52, avatar: 'avatar-02', lines: ['Pos pertahanan aman, Ksatria.', 'Penjaga siap di posisi.'] },
  { id: 'healer', name: 'Tabib', object: 'healer_south', texture: 'yellow-monk-idle', animation: 'yellow-monk-idle', scale: 0.46, avatar: 'avatar-03', lines: ['Sini, biar kuobati lukamu.', 'Istirahatlah sebentar.'] },
  { id: 'villager', name: 'Warga Desa', object: 'villager', texture: 'yellow-pawn-gold-idle', animation: 'yellow-pawn-gold-idle', scale: 0.48, avatar: 'avatar-08', lines: ['Tolong lindungi kami, Ksatria.', 'Anak-anak kami bersembunyi di bawah tanah.'] },
  { id: 'scout', name: 'Pengintai', object: 'scout', texture: 'yellow-pawn-gold-idle', animation: 'yellow-pawn-gold-idle', scale: 0.46, avatar: 'avatar-04', lines: ['Dari sini aku bisa lihat pergerakan musuh.', 'Musuh berkumpul di selatan.'] },
  { id: 'merchant', name: 'Pedagang', object: 'merchant', texture: 'yellow-pawn-gold-idle', animation: 'yellow-pawn-gold-idle', scale: 0.5, avatar: 'avatar-09', lines: ['Mau beli sesuatu, Ksatria?', 'Daganganku terbatas di masa perang.'] },
  { id: 'aran', name: 'Aran', object: 'aran', texture: 'yellow-pawn-gold-idle', animation: 'yellow-pawn-gold-idle', scale: 0.5, avatar: 'avatar-14', minChapter: 7, lines: ['Ksatria... ada yang harus kuceritakan.'] },
];

const CHAPTER_QUESTS = [
  {
    chapter: 1, title: 'Bab 1: Bayangan di Perbatasan',
    subQuests: [
      { id: 'ch1_s1', npc: 'elder', title: 'Temui Tetua Desa', hint: 'Tetua Desa — Desa',
        dialog: [
          { speaker: 'elder', text: 'Ksatria, akhirnya kau tiba! Pengintai pasukan merah terlihat dari menara barat. Situasinya genting — kita butuh bantuanmu.', responses: ['Aku siap bertempur!', 'Seberapa besar ancamannya?'] },
          { speaker: 'elder', text: 'Semangatmu luar biasa! Tapi jangan gegabah. Temui Pandai Besi di desa — dia punya pedang yang sudah disiapkan khusus untukmu.' },
        ] },
      { id: 'ch1_s2', npc: 'blacksmith', title: 'Ambil pedang dari Pandai Besi', hint: 'Pandai Besi — Desa',
        dialog: [
          { speaker: 'blacksmith', text: 'Ah, kau pasti ksatria yang dikirim Tetua! Ini, pedang terbaik yang pernah kutempa. Rawat baik-baik, ya.', responses: ['Terima kasih, akan kugunakan sebaik mungkin.', 'Pedang ini cukup tajam?'] },
          { speaker: 'blacksmith', text: 'Haha, percayalah — pedang ini sudah menembus banyak baju besi! Sekarang, lapor ke Kapten Jaga di kastil. Dia yang atur strategi.' },
        ] },
      { id: 'ch1_s3', npc: 'captain', title: 'Lapor ke Kapten Jaga', hint: 'Kapten Jaga — Kastil',
        dialog: [
          { speaker: 'captain', text: 'Kau ksatria baru itu? Bagus. Posisikan dirimu dekat kastil — musuh datang dari barat.', responses: ['Siap, Kapten!', 'Berapa banyak penjaga kita?'] },
          { speaker: 'captain', text: 'Dua penjaga di pos. Tidak banyak, tapi cukup kalau kau pimpin dari depan. Bilang Tetua Desa kalau kau sudah siap tempur!' },
        ] },
    ],
    mainQuest: { title: 'Hadapi Gelombang 1', triggerNpc: 'elder',
      triggerDialog: [
        { speaker: 'elder', text: 'Semua sudah siap. Pengintai merah mulai bergerak dari barat. Pertahankan kastil kita!', responses: ['Untuk desa kita!', 'Kita pasti menang!'] },
        { speaker: 'elder', text: 'Semoga para leluhur melindungi kita. Maju, Ksatria!' },
      ] },
  },
  {
    chapter: 2, title: 'Bab 2: Barak Musuh',
    subQuests: [
      { id: 'ch2_s1', npc: 'healer', title: 'Temui Tabib di selatan', hint: 'Tabib — Area Selatan',
        dialog: [
          { speaker: 'healer', text: 'Ksatria! Pertempuran pertama sudah selesai, tapi lukamu perlu diobati. Sini, minum ramuan ini.', responses: ['Terima kasih, Tabib.', 'Aku baik-baik saja kok.'] },
          { speaker: 'healer', text: 'Jangan sok kuat! Oh ya, Pengintai di menara tengah punya info tentang musuh. Temui dia.' },
        ] },
      { id: 'ch2_s2', npc: 'scout', title: 'Temui Pengintai', hint: 'Pengintai — Menara Tengah',
        dialog: [
          { speaker: 'scout', text: 'Ksatria! Dari menara ini aku lihat semuanya. Musuh punya barak di selatan — mereka kirim pemanah kali ini!', responses: ['Pemanah? Itu merepotkan.', 'Berapa jumlah mereka?'] },
          { speaker: 'scout', text: 'Sekitar tujuh prajurit, tiga di antaranya pemanah. Hati-hati dengan panah mereka! Bilang Tetua kau sudah siap.' },
        ] },
    ],
    mainQuest: { title: 'Hadapi Gelombang 2', triggerNpc: 'elder',
      triggerDialog: [
        { speaker: 'elder', text: 'Pemanah ikut menyerang kali ini. Kau siap, Ksatria?', responses: ['Selalu siap!', 'Aku akan berhati-hati.'] },
        { speaker: 'elder', text: 'Jaga jarak dari pemanah mereka. Lindungi kastil!' },
      ] },
  },
  {
    chapter: 3, title: 'Bab 3: Benteng Timur',
    subQuests: [
      { id: 'ch3_s1', npc: 'captain', title: 'Strategi dengan Kapten Jaga', hint: 'Kapten Jaga — Kastil',
        dialog: [
          { speaker: 'captain', text: 'Masalah besar! Benteng timur kirim ksatria berat. Lambat tapi kuat — satu pukulan bisa remukkan perisai.', responses: ['Kita butuh strategi baru.', 'Aku bisa tangani mereka.'] },
          { speaker: 'captain', text: 'Pertahankan jembatan — titik sempit yang bisa kita manfaatkan. Tapi kita butuh senjata lebih tajam. Temui Pandai Besi!' },
        ] },
      { id: 'ch3_s2', npc: 'blacksmith', title: 'Senjata baru dari Pandai Besi', hint: 'Pandai Besi — Desa', requireResource: { type: 'wood', amount: 3 },
        failDialog: 'Kau butuh minimal 3 kayu dulu. Cari di sekitar hutan.',
        dialog: [
          { speaker: 'blacksmith', text: 'Ksatria berat, ya? Bawa 3 kayu, akan kutempa ulang pedangmu jadi lebih tajam.', responses: ['Ini kayunya.', 'Bisa lebih tajam lagi?'] },
          { speaker: 'blacksmith', text: 'Sempurna! Pedangmu sekarang bisa tembus baju besi. Hati-hati di jembatan, Ksatria!' },
        ] },
    ],
    mainQuest: { title: 'Hadapi Gelombang 3', triggerNpc: 'elder',
      triggerDialog: [
        { speaker: 'elder', text: 'Ksatria berat dari timur sudah dekat. Jembatan adalah kunci pertahanan kita!', responses: ['Jembatan tidak akan jatuh!', 'Demi kastil!'] },
        { speaker: 'elder', text: 'Pertahankan jembatan itu. Mereka tidak boleh lewat!' },
      ] },
  },
  {
    chapter: 4, title: 'Bab 4: Serangan Dua Arah',
    subQuests: [
      { id: 'ch4_s1', npc: 'villager', title: 'Tenangkan Warga Desa', hint: 'Warga Desa — Desa',
        action: { type: 'ambush', count: 2, kind: 'raider', hint: 'Kalahkan penyusup yang muncul!' },
        dialog: [
          { speaker: 'villager', text: 'Ksatria! Ibu-ibu menangis, anak-anak ketakutan... Katanya musuh serang dari dua arah!', responses: ['Tenanglah, aku lindungi kalian.', 'Dari mana kau dengar itu?'] },
          { speaker: 'villager', text: 'Tunggu, apa itu di belakangmu?! Awas Ksatria, ada penyusup!' },
        ] },
      { id: 'ch4_s2', npc: 'healer', title: 'Perbekalan dari Tabib', hint: 'Tabib — Area Selatan',
        dialog: [
          { speaker: 'healer', text: 'Lukamu dari lalu belum sembuh total. Minum ini — ramuan khusus meningkatkan daya tahan.', responses: ['Rasanya aneh tapi terima kasih.', 'Apa ini aman?'] },
          { speaker: 'healer', text: 'Haha, aman! Ramuanku sudah selamatkan banyak nyawa. Pergilah, Tetua Desa menunggumu.' },
        ] },
    ],
    mainQuest: { title: 'Hadapi Gelombang 4', triggerNpc: 'elder',
      triggerDialog: [
        { speaker: 'elder', text: 'Mereka menyerang dari dua arah sekaligus! Desa dikepung!', responses: ['Aku akan lindungi semua sisi!', 'Kita butuh bantuan.'] },
        { speaker: 'elder', text: 'Kau adalah harapan kami. Maju dan lindungi desa ini!' },
      ] },
  },
  {
    chapter: 5, title: 'Bab 5: Perbatasan Jauh',
    subQuests: [
      { id: 'ch5_s1', npc: 'elder', title: 'Tetua curiga mata-mata', hint: 'Tetua Desa — Desa',
        dialog: [
          { speaker: 'elder', text: 'Ksatria, ada yang tidak beres. Bagaimana musuh tahu jalur rahasia kita? Aku curiga ada mata-mata!', responses: ['Siapa yang kau curigai?', 'Aku akan cari tahu.'] },
          { speaker: 'elder', text: 'Aku tidak yakin siapa... Tanya Pengintai di menara — dia mungkin lihat sesuatu yang mencurigakan.' },
        ] },
      { id: 'ch5_s2', npc: 'scout', title: 'Interogasi Pengintai', hint: 'Pengintai — Menara Tengah',
        action: { type: 'search_clue', targetX: 28, targetY: 7, hint: 'Cari petunjuk di area timur' },
        dialog: [
          { speaker: 'scout', text: 'Mata-mata? Hmm... Beberapa malam lalu aku lihat bayangan mencurigakan di dekat selatan.', responses: ['Bisa kau tunjukkan lokasinya?', 'Kita harus lebih waspada.'] },
          { speaker: 'scout', text: 'Dekat area pedagang timur. Coba periksa ke sana dulu, mungkin ada barang yang tertinggal!' },
        ] },
      { id: 'ch5_s3', npc: 'merchant', title: 'Cek Pedagang di timur', hint: 'Pedagang — Area Timur',
        dialog: [
          { speaker: 'merchant', text: 'Mata-mata? Aku? Jangan asal tuduh, Ksatria! Aku cuma pedagang. Tapi... aku memang lihat seseorang asing beberapa malam lalu.', responses: ['Siapa orang asing itu?', 'Di mana kau lihat dia?'] },
          { speaker: 'merchant', text: 'Dia pakai jubah gelap, pergi ke arah selatan. Aku tidak kenal wajahnya. Mungkin ada hubungannya dengan penyusup yang masuk...' },
        ] },
    ],
    mainQuest: { title: 'Hadapi Gelombang 5', triggerNpc: 'elder',
      triggerDialog: [
        { speaker: 'elder', text: 'Penyusup dari perbatasan jauh! Mereka tahu jalur rahasia kita. Ada pengkhianat di antara kita...', responses: ['Kita akan temukan dia.', 'Sekarang, fokus bertahan dulu.'] },
        { speaker: 'elder', text: 'Kau benar, pertahanan dulu. Kita selidiki nanti. Maju, Ksatria!' },
      ] },
  },
  {
    chapter: 6, title: 'Bab 6: Gelombang Selatan',
    subQuests: [
      { id: 'ch6_s1', npc: 'healer', title: 'Tabib laporkan korban', hint: 'Tabib — Area Selatan',
        dialog: [
          { speaker: 'healer', text: 'Ksatria... Banyak yang terluka parah. Aku sudah kehabisan ramuan. Gelombang besar datang dari selatan.', responses: ['Kita akan bertahan.', 'Apa yang bisa kubantu?'] },
          { speaker: 'healer', text: 'Bertahanlah, itu saja yang bisa kau lakukan. Oh, Kapten Jaga ingin bicara soal rencana pertahanan baru.' },
        ] },
      { id: 'ch6_s2', npc: 'captain', title: 'Rencana pertahanan baru', hint: 'Kapten Jaga — Kastil',
        dialog: [
          { speaker: 'captain', text: 'Situasinya buruk. Serbuan massal dari selatan. Aku atur penjaga di posisi, tapi kita butuh lebih banyak emas untuk memperkuat pertahanan.', responses: ['Aku akan kumpulkan emas.', 'Penjaga kita cukup?'] },
          { speaker: 'captain', text: 'Kumpulkan emas dari sekitar peta. Setelah siap, temui Tetua Desa. Ini akan jadi pertempuran terberat sejauh ini.' },
        ] },
    ],
    mainQuest: { title: 'Hadapi Gelombang 6', triggerNpc: 'elder',
      triggerDialog: [
        { speaker: 'elder', text: 'Gelombang besar dari selatan! Ini akan jadi pertempuran terberat. Kau siap?', responses: ['Aku tidak akan mundur!', 'Demi semua orang di desa ini!'] },
        { speaker: 'elder', text: 'Semangat! Berdiri tegak dan lindungi kastil sampai akhir!' },
      ] },
  },
  {
    chapter: 7, title: 'Bab 7: Serangan Balik!',
    subQuests: [
      { id: 'ch7_s1', npc: 'aran', title: 'Temui Aran di selatan', hint: 'Aran — Area Selatan',
        action: { type: 'ambush', count: 3, kind: 'grunt', hint: 'Bertahanlah dari sergapan musuh!' },
        dialog: [
          { speaker: 'aran', text: 'Ksatria... Ini aku, Aran. Maafkan aku. Akulah yang membocorkan posisi kita ke musuh. Keluargaku disandera mereka.', responses: ['Kau... pengkhianat?!', 'Kenapa kau lakukan ini?'] },
          { speaker: 'aran', text: 'Aku tahu kau marah. Tapi AWAS! Pasukan merah menyusulku ke sini! Bertahanlah!' },
        ] },
      { id: 'ch7_s2', npc: 'elder', title: 'Rencana serangan balik', hint: 'Tetua Desa — Desa',
        dialog: [
          { speaker: 'elder', text: 'Jadi Aran yang selama ini... Aku kecewa, tapi kita butuh informasinya. Musuh sudah mundur — ini kesempatan kita menyerang!', responses: ['Aku percaya Aran ingin menebus dosa.', 'Kita harus waspada terhadap Aran.'] },
          { speaker: 'elder', text: 'Baiklah. Kita manfaatkan pengetahuannya. Siapkan peralatan dari Pandai Besi, lalu kita mulai serangan balik!' },
        ] },
      { id: 'ch7_s3', npc: 'blacksmith', title: 'Persiapan serangan balik', hint: 'Pandai Besi — Desa',
        dialog: [
          { speaker: 'blacksmith', text: 'Serangan balik?! Akhirnya! Ini peralatan tempur terbaik yang kumiliki. Hancurkan mereka, Ksatria!', responses: ['Terima kasih, Pandai Besi!', 'Ini pertempuran terakhir?'] },
          { speaker: 'blacksmith', text: 'Belum tentu terakhir, tapi ini awal dari kemenangan kita! Temui Tetua Desa kalau sudah siap.' },
        ] },
    ],
    mainQuest: { title: 'Serang Markas Merah!', triggerNpc: 'elder',
      triggerDialog: [
        { speaker: 'elder', text: 'Kastil berdiri tegak. Aran akan tunjukkan jalan. Seberangi jembatan dan hancurkan markas merah!', responses: ['Untuk desa kita!', 'Akhirnya kita menyerang!'] },
        { speaker: 'elder', text: 'Dewa-dewa menyertaimu, Ksatria. Akhiri perang ini!' },
      ] },
  },
  {
    chapter: 8, title: 'Bab 8: Menembus Garis Pertahanan',
    subQuests: [
      { id: 'ch8_s1', npc: 'aran', title: 'Aran tunjukkan jalan', hint: 'Aran — Area Selatan',
        action: { type: 'mini_boss', kind: 'brute', hint: 'Kalahkan komandan penjaga!' },
        dialog: [
          { speaker: 'aran', text: 'Lewat sini, Ksatria! Aku tahu titik lemah pertahanan mereka.', responses: ['Tunjukkan jalannya!', 'Bagaimana kalau ini jebakan?'] },
          { speaker: 'aran', text: 'Aku bersumpah ini bukan jebakan! Sial, komandan mereka memblokir jalan! Kalahkan dia dulu!' },
        ] },
      { id: 'ch8_s2', npc: 'captain', title: 'Koordinasi dengan Kapten', hint: 'Kapten Jaga — Kastil',
        dialog: [
          { speaker: 'captain', text: 'Aran memberi info bagus. Aku kirim penjaga mendampingimu. Kita serang dari dua sisi — kau dari depan, penjaga dari samping.', responses: ['Strategi yang bagus!', 'Penjaga kita cukup?'] },
          { speaker: 'captain', text: 'Cukup atau tidak, kita harus coba. Ini kesempatan terbaik kita. Temui Tetua Desa untuk memulai serangan!' },
        ] },
    ],
    mainQuest: { title: 'Tembus Pertahanan Musuh', triggerNpc: 'elder',
      triggerDialog: [
        { speaker: 'elder', text: 'Aran dan Kapten sudah siapkan rencana. Tembus pertahanan mereka, Ksatria!', responses: ['Kita pasti bisa!', 'Aku tidak akan gagal.'] },
        { speaker: 'elder', text: 'Maju, Ksatria! Seluruh desa mendoakanmu!' },
      ] },
  },
  {
    chapter: 9, title: 'Bab 9: Panji Merah',
    subQuests: [
      { id: 'ch9_s1', npc: 'blacksmith', title: 'Senjata terakhir', hint: 'Pandai Besi — Desa',
        dialog: [
          { speaker: 'blacksmith', text: 'Ini pedang terakhir yang bisa kutempa. Seluruh keahlianku kutuangkan di sini. Gunakan dengan bijak, Ksatria!', responses: ['Ini pedang terbaik yang pernah kupegang.', 'Aku berjanji akan mengembalikannya.'] },
          { speaker: 'blacksmith', text: 'Haha, kembalikan kalau masih utuh! Satu serangan lagi dan panji merah akan jatuh. Temui Tetua untuk doa terakhir.' },
        ] },
      { id: 'ch9_s2', npc: 'elder', title: 'Doa sebelum pertempuran', hint: 'Tetua Desa — Desa',
        dialog: [
          { speaker: 'elder', text: 'Ksatria, sebelum kau maju... Biarkan aku berdoa untuk keselamatanmu. Kau sudah berjuang lebih dari siapapun.', responses: ['Terima kasih, Tetua.', 'Doakan juga semua prajurit kita.'] },
          { speaker: 'elder', text: 'Aku doakan semua. Sekarang pergilah — hancurkan panji merah dan akhiri mimpi buruk ini!' },
        ] },
    ],
    mainQuest: { title: 'Hancurkan Panji Merah', triggerNpc: 'elder',
      triggerDialog: [
        { speaker: 'elder', text: 'Panji merah masih berkibar. Pasukan mereka bertahan mati-matian. Tapi kita tidak akan mundur!', responses: ['Panji itu akan jatuh hari ini!', 'Demi semua yang sudah berkorban!'] },
        { speaker: 'elder', text: 'Maju, Ksatria! Ini hampir berakhir!' },
      ] },
  },
  {
    chapter: 10, title: 'Bab 10: Pertempuran Terakhir',
    subQuests: [
      { id: 'ch10_s1', npc: 'aran', title: 'Rencana serangan Aran', hint: 'Aran — Area Selatan',
        action: { type: 'ignite_torch', count: 2, hint: 'Nyalakan 2 obor perang' },
        dialog: [
          { speaker: 'aran', text: 'Dua Tombak Hitam menjaga kastil merah. Ini rencana terakhirku — aku alihkan perhatian yang satu, kau hadapi yang lain.', responses: ['Kau yakin bisa?', 'Hati-hati, Aran.'] },
          { speaker: 'aran', text: 'Ini penebusan dosaku. Sebelum kita mulai, nyalakan dua obor perang sebagai sinyal untuk Kapten!' },
        ] },
      { id: 'ch10_s2', npc: 'captain', title: 'Atur formasi terakhir', hint: 'Kapten Jaga — Kastil',
        dialog: [
          { speaker: 'captain', text: 'Sinyal obor terlihat! Formasi terakhir sudah kuatur. Semua penjaga akan maju bersamamu.', responses: ['Kita selesaikan ini bersama!', 'Untuk kerajaan kita!'] },
          { speaker: 'captain', text: 'Untuk kerajaan! Temui Tetua Desa untuk pesan terakhir sebelum kita maju.' },
        ] },
      { id: 'ch10_s3', npc: 'elder', title: 'Pesan terakhir Tetua', hint: 'Tetua Desa — Desa',
        dialog: [
          { speaker: 'elder', text: 'Ksatria... Kau sudah berjuang luar biasa. Apapun yang terjadi hari ini, namamu akan dikenang selamanya.', responses: ['Aku tidak akan mengecewakan kalian.', 'Ini kehormatan bagiku, Tetua.'] },
          { speaker: 'elder', text: 'Pergilah, pahlawan kami. Akhiri perang ini — desa ini, kastil ini, semuanya bergantung padamu.' },
        ] },
    ],
    mainQuest: { title: 'Pertempuran Terakhir!', triggerNpc: 'elder',
      triggerDialog: [
        { speaker: 'elder', text: 'Ini dia. Pertempuran terakhir. Dua Tombak Hitam menunggu. Aran sudah siap di posisinya. Akhiri perang ini!', responses: ['UNTUK DESA KITA!', 'Akhirnya... ini berakhir hari ini!'] },
        { speaker: 'elder', text: 'MAJU, KSATRIA! MENANGKAN PERANG INI!' },
      ] },
  },
];

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    createGameAnimations(this);
    this.sfx = this.registry.get('sfx') || new Sfx();
    this.registry.set('sfx', this.sfx);
    this.sfx.startMusic(this);

    this.stats = {
      phase: 'intro',
      playerHp: 9,
      playerMaxHp: 9,
      castleHp: 30,
      castleMaxHp: 30,
      baseHp: 12,
      baseMaxHp: 12,
      wave: 0,
      maxWaves: WAVE_CONFIGS.length,
      gold: 5,
      wood: 6,
      playerDamage: 1,
      bladeLevel: 1,
      lifestealLevel: 0,
      guards: 2,
      kills: 0,
      score: 0,
    };
    this.lastDirection = new Phaser.Math.Vector2(1, 0);
    this.isAttacking = false;
    this.attackReadyAt = 0;
    this.invulnerableUntil = 0;
    this.gameEnded = false;
    
    this.skills = {
      whirlwind: { cooldown: 5000, readyAt: 0 },
      dash: { cooldown: 8000, readyAt: 0 },
      heal: { cooldown: 15000, readyAt: 0 },
    };
    this.spawnQueue = [];
    this.waveSpawnEvent = null;
    this.prepEndsAt = 0;
    this.counterUnlocked = false;
    this.bossDefeated = false;
    this.isDialogActive = false;
    
    // Quest system
    this.questState = { currentChapter: 1, subQuestProgress: 0, mainQuestReady: false };
    this.dialogChain = null;
    this.dialogChainIndex = 0;
    this.dialogOnComplete = null;
    
    // Anti-stuck system
    this.waveStartTime = 0;
    this.lastWaveEnemyCount = 0;
    this.lastWaveProgressTime = 0;
    this.STUCK_TIMEOUT = 8000;
    this.WAVE_STALL_TIMEOUT = 45000;
    
    this.createMap();
    this.createCollision();
    this.createFx();
    this.createAmbientFx();
    this.createPlayer();
    this.buildReachableTilesFrom(this.player.x, this.player.y);
    this.createCastleObjective();
    this.createEnemyBaseObjective();
    this.createEnemyBuildings();
    this.createNpcs();
    this.createResourcePickups();
    this.createGuards();
    this.createEnemies();
    this.createUi();
    this.createInput();
    this.setupPhysics();
    this.setupCamera();
    this.stats.phase = 'quest';
    this.updateQuestTracker();
    this.updateQuestMarkers();
    this.showDialog('Tetua Desa', 'Selamat datang, Ksatria! Kastil kita terancam. Temui aku di desa untuk membahas rencana pertahanan.', 5200, 'avatar-01');
  }

  createMap() {
    this.map = this.make.tilemap({ key: 'adventure-map' });
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    const tilesets = TILESETS.map((tileset) => {
      const phaserTileset = this.map.addTilesetImage(tileset.name, tileset.key);
      if (!phaserTileset) {
        console.warn(`Tileset not found: ${tileset.name}`);
      }
      return phaserTileset;
    }).filter(Boolean);

    this.layers = {};
    MAP_LAYERS.forEach((layerName, index) => {
      const layer = this.map.createLayer(layerName, tilesets, 0, 0);
      if (layer) {
        layer.setDepth(index);
        layer.setVisible(!LOGIC_LAYERS.includes(layerName));
        this.layers[layerName] = layer;
      }
    });

    // Removed logic layers completely
  }

  createCollision() {
    this.blockers = this.physics.add.staticGroup();
    this.solidTiles = new Set();

    for (let y = 0; y < this.map.height; y += 1) {
      for (let x = 0; x < this.map.width; x += 1) {
        if (!this.isBaseWalkableTile(x, y)) {
          this.solidTiles.add(this.tileKey(x, y));
          this.addStaticBox(this.blockers, x, y, TILE_SIZE, TILE_SIZE, 0, 0, false);
        }
      }
    }
  }

  createFx() {
    this.dustEmitter = this.add.particles(0, 0, 'dust', {
      frame: { start: 0, end: 7 },
      lifespan: 360,
      speed: { min: 14, max: 42 },
      scale: { start: 0.54, end: 0 },
      alpha: { start: 0.42, end: 0 },
      emitting: false,
      quantity: 1,
      blendMode: 'NORMAL',
    });
    this.dustEmitter.setDepth(900);
  }

  createAmbientFx() {
    this.createLoopingSplash(4, 12, 400);
    this.createLoopingSplash(18, 14, 1600);
    this.createLoopingSplash(32, 15, 2600);
  }

  createPlayer() {
    const spawn = this.findPointWorld('player_spawn', 8);
    this.playerShadow = this.add.ellipse(spawn.x, spawn.y + 25, 42, 15, 0x142433, 0.28)
      .setDepth(spawn.y - 2);
    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'blue-warrior-idle')
      .setScale(0.5)
      .play('blue-idle');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(48, 34);
    this.player.body.setOffset(72, 138);
    this.lastSafePosition = new Phaser.Math.Vector2(spawn.x, spawn.y);
  }

  createCastleObjective() {
    this.castleCore = this.findPointWorld('castle_core', 8, false);
    this.castleAttackPoint = this.findPointWorld('castle_attack', 8);
    this.castleZone = this.add.zone(this.castleAttackPoint.x, this.castleAttackPoint.y, 144, 128);
    this.physics.add.existing(this.castleZone, true);
    this.castleGlow = this.add.ellipse(this.castleAttackPoint.x, this.castleAttackPoint.y + 6, 126, 38, 0x72b7ff, 0.13)
      .setDepth(this.castleAttackPoint.y - 1);
    this.tweens.add({
      targets: this.castleGlow,
      alpha: 0.04,
      scaleX: 1.14,
      scaleY: 1.25,
      duration: 1050,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Castle HP bar in world space
    const barY = this.castleAttackPoint.y - 180;
    this.castleWorldHpBarBack = this.add.rectangle(this.castleAttackPoint.x, barY, 100, 12, 0x20323a, 0.9)
      .setDepth(this.castleAttackPoint.y + 5);
    this.castleWorldHpBar = this.add.rectangle(this.castleAttackPoint.x, barY, 96, 8, 0x64b5f6)
      .setDepth(this.castleAttackPoint.y + 6);
    this.castleWorldHpBarBorder = this.add.rectangle(this.castleAttackPoint.x, barY, 100, 12)
      .setStrokeStyle(2, 0xffe0a3, 0.82)
      .setFillStyle(0x000000, 0)
      .setDepth(this.castleAttackPoint.y + 7);
    this.castleWorldHpLabel = this.add.text(this.castleAttackPoint.x, barY - 14, 'KASTIL', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '10px',
      color: '#64b5f6',
      stroke: '#1c2b33',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(this.castleAttackPoint.y + 7);
  }

  createEnemyBaseObjective() {
    const pos = this.findPointWorld('enemy_base_core', 8);
    this.enemyBasePoint = pos;
    this.enemyCoreZone = this.add.zone(pos.x, pos.y, 128, 128);
    this.physics.add.existing(this.enemyCoreZone, true);
    this.enemyCoreGlow = this.add.ellipse(pos.x, pos.y + 8, 124, 38, 0xff5b54, 0.18)
      .setDepth(pos.y - 1)
      .setVisible(false);
    this.enemyCoreFire = this.add.sprite(pos.x, pos.y - 18, 'fire')
      .setScale(1.15)
      .setTint(0xff5048)
      .setDepth(pos.y + 10)
      .setVisible(false)
      .play('fire-burn');
    this.tweens.add({
      targets: this.enemyCoreGlow,
      alpha: 0.06,
      scaleX: 1.18,
      scaleY: 1.3,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createEnemyBuildings() {
    this.enemyBuildings = this.physics.add.staticGroup();
    
    const positions = [
      this.findSafeWorld(20, 16, 5),
      this.findSafeWorld(25, 16, 5)
    ];

    positions.forEach((pos) => {
      const tower = this.physics.add.staticSprite(pos.x, pos.y, 'red-tower')
        .setScale(0.8)
        .setDepth(pos.y);
      tower.body.setSize(64, 64);
      tower.body.setOffset(32, 90);
      
      tower.ai = {
        kind: 'building',
        health: 24,
        maxHealth: 24,
        rewardGold: 12,
        rewardWood: 18
      };
      
      tower.hpBarBack = this.add.rectangle(tower.x, tower.y - 70, 54, 8, 0x20323a, 0.86).setDepth(tower.y + 1);
      tower.hpBar = this.add.rectangle(tower.x, tower.y - 70, 50, 5, 0xe74f4f).setDepth(tower.y + 2);
      
      this.enemyBuildings.add(tower);
    });
  }

  createNpcs() {
    this.npcs = [];
    NPCS.forEach((config) => {
      const pos = this.findPointWorld(config.object, 5);
      const npc = this.add.sprite(pos.x, pos.y, config.texture)
        .setScale(config.scale)
        .setDepth(pos.y)
        .play(config.animation);
      npc.npcData = config;
      npc.nameTag = this.add.text(pos.x, pos.y - 52, config.name, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '11px',
        color: '#fff1b8',
        stroke: '#1c2b33',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(pos.y + 1);
      // Quest marker "!" above NPC
      npc.questMarker = this.add.text(pos.x, pos.y - 72, '!', {
        fontFamily: 'Arial Black',
        fontSize: '22px',
        color: '#ffd700',
        stroke: '#3d2817',
        strokeThickness: 5,
      }).setOrigin(0.5).setDepth(pos.y + 2).setVisible(false);
      // Bounce animation for quest marker
      this.tweens.add({ targets: npc.questMarker, y: pos.y - 82, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // Hide NPCs with minChapter
      if (config.minChapter) {
        npc.setVisible(false);
        npc.nameTag.setVisible(false);
      }
      this.npcs.push(npc);
    });

    this.sheep = [
      this.createSheep(10, 13),
      this.createSheep(18, 13),
      this.createSheep(30, 13),
    ];
  }

  createSheep(tileX, tileY) {
    const pos = this.findSafeWorld(tileX, tileY, 5);
    const sheep = this.add.sprite(pos.x, pos.y, 'sheep-idle')
      .setScale(0.42)
      .setDepth(pos.y)
      .play('sheep-idle');
    this.tweens.add({
      targets: sheep,
      x: pos.x + Phaser.Math.Between(-24, 24),
      duration: Phaser.Math.Between(1400, 2200),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return sheep;
  }

  createResourcePickups() {
    this.resources = this.physics.add.staticGroup();
    RESOURCE_NODES.forEach((node, index) => {
      const pos = this.findSafeWorld(node.tile[0], node.tile[1], 6);
      const sprite = this.physics.add.staticSprite(pos.x, pos.y - 8, node.key)
        .setScale(node.key.includes('gold') ? 0.38 : 0.58)
        .setDepth(pos.y + 10);
      sprite.body.setCircle(24);
      sprite.resourceData = node;
      this.resources.add(sprite);
      this.tweens.add({
        targets: sprite,
        y: pos.y - 16,
        duration: 900 + index * 85,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: () => sprite.refreshBody(),
      });
    });
  }

  createGuards() {
    this.guards = this.physics.add.group();
    this.guardHomePoints = ['guard_1', 'guard_2', 'guard_3', 'guard_4'].map((name) => this.findPointWorld(name, 5));
    this.guardHomePoints.push(this.findSafeWorld(22, 11, 5));
    this.spawnGuard(this.guardHomePoints[0]);
    this.spawnGuard(this.guardHomePoints[1]);
  }

  spawnGuard(pos = null) {
    const home = pos || this.guardHomePoints[Math.min(this.stats.guards, this.guardHomePoints.length - 1)] || this.castleAttackPoint;
    const guard = this.physics.add.sprite(home.x, home.y, 'blue-warrior-idle')
      .setScale(0.45)
      .setDepth(home.y)
      .play('blue-idle');
    guard.body.setSize(46, 34);
    guard.body.setOffset(73, 138);
    guard.ai = {
      home: new Phaser.Math.Vector2(home.x, home.y),
      health: 8,
      maxHealth: 8,
      nextAttackAt: 0,
      lastSafePosition: new Phaser.Math.Vector2(home.x, home.y),
    };
    guard.hpBarBack = this.add.rectangle(guard.x, guard.y - 42, 34, 6, 0x20323a, 0.86).setDepth(guard.y + 1);
    guard.hpBar = this.add.rectangle(guard.x, guard.y - 42, 30, 4, 0x64b5f6).setDepth(guard.y + 2);
    this.guards.add(guard);
    return guard;
  }

  createEnemies() {
    this.enemies = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();
  }

  createUi() {
    this.uiElements = [];
    const fixed = (obj, depth = 10000) => {
      obj.setScrollFactor(0).setDepth(depth);
      this.uiElements.push(obj);
      return obj;
    };

    this.hudPanel = fixed(this.add.graphics());
    this.playerHpBar = fixed(this.add.graphics());
    this.castleHpBar = fixed(this.add.graphics());
    this.baseHpBar = fixed(this.add.graphics());

    this.waveText = fixed(this.add.text(26, 168, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '15px',
      color: '#fff5c7',
      stroke: '#1b2b34',
      strokeThickness: 4,
    }));
    
    this.goldIcon = fixed(this.add.sprite(44, 258, 'gold-resource').setScale(0.35));
    this.goldText = fixed(this.add.text(66, 250, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#e7f7f0',
      stroke: '#20313b',
      strokeThickness: 3,
    }));
    
    this.woodIcon = fixed(this.add.sprite(130, 258, 'wood-resource').setScale(0.45));
    this.woodText = fixed(this.add.text(152, 250, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#e7f7f0',
      stroke: '#20313b',
      strokeThickness: 3,
    }));

    this.statsText = fixed(this.add.text(26, 286, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#e7f7f0',
      stroke: '#20313b',
      strokeThickness: 3,
    }));

    this.questPanel = fixed(this.add.graphics());
    this.questChapterText = fixed(this.add.text(756, 30, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '11px',
      color: '#6b4b31',
    }));
    this.questMainText = fixed(this.add.text(756, 50, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '11px',
      color: '#8b4513',
    }));
    this.questSubTexts = [];
    for (let i = 0; i < 3; i++) {
      this.questSubTexts.push(fixed(this.add.text(756, 72, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#27333a',
        wordWrap: { width: 180 },
        lineSpacing: 2,
      })));
    }
    this.questNavText = fixed(this.add.text(756, 138, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#4a7c59',
      fontStyle: 'italic',
      wordWrap: { width: 180 },
    }));
    
    this.interactionHint = fixed(this.add.text(400, 480, 'Tekan [E] untuk bicara', {
      fontFamily: 'Arial Black',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    })).setOrigin(0.5).setVisible(false);

    // RPG Dialog UI
    this.dialogPanel = fixed(this.add.graphics(), 10020).setVisible(false).setAlpha(0);
    this.dialogPortrait = fixed(this.add.image(130, 478, 'avatar-01').setScale(1.1), 10022).setVisible(false).setAlpha(0);
    this.dialogPortraitFrame = fixed(this.add.graphics(), 10021).setVisible(false).setAlpha(0);
    this.dialogTitle = fixed(this.add.text(200, 440, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '15px',
      color: '#fff1b8',
      stroke: '#16242c',
      strokeThickness: 3,
    }), 10023).setVisible(false).setAlpha(0);
    this.dialogText = fixed(this.add.text(200, 466, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#edf7e8',
      lineSpacing: 3,
      wordWrap: { width: 520 },
    }), 10023).setVisible(false).setAlpha(0);
    // Response buttons
    this.dialogResponse1Bg = fixed(this.add.rectangle(280, 548, 280, 28, 0x3d5a1e, 0.92)
      .setStrokeStyle(2, 0x7cba3f, 0.9)
      .setInteractive({ cursor: 'pointer' }), 10024).setVisible(false).setAlpha(0);
    this.dialogResponse1Text = fixed(this.add.text(280, 548, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#d4f5a0',
    }).setOrigin(0.5), 10025).setVisible(false).setAlpha(0);
    this.dialogResponse2Bg = fixed(this.add.rectangle(580, 548, 280, 28, 0x3d5a1e, 0.92)
      .setStrokeStyle(2, 0x7cba3f, 0.9)
      .setInteractive({ cursor: 'pointer' }), 10024).setVisible(false).setAlpha(0);
    this.dialogResponse2Text = fixed(this.add.text(580, 548, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#d4f5a0',
    }).setOrigin(0.5), 10025).setVisible(false).setAlpha(0);
    // Continue prompt
    this.dialogContinue = fixed(this.add.text(700, 548, '> Lanjutkan', {
      fontFamily: 'Arial Black', fontSize: '12px', color: '#ffd700', stroke: '#16242c', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' }), 10025).setVisible(false).setAlpha(0);
    // Response hover effects
    this.dialogResponse1Bg.on('pointerover', () => this.dialogResponse1Bg.setFillStyle(0x4a7024, 0.95));
    this.dialogResponse1Bg.on('pointerout', () => this.dialogResponse1Bg.setFillStyle(0x3d5a1e, 0.92));
    this.dialogResponse2Bg.on('pointerover', () => this.dialogResponse2Bg.setFillStyle(0x4a7024, 0.95));
    this.dialogResponse2Bg.on('pointerout', () => this.dialogResponse2Bg.setFillStyle(0x3d5a1e, 0.92));
    // Response click handlers
    this.dialogResponse1Bg.on('pointerdown', () => this.handleDialogResponse(0));
    this.dialogResponse2Bg.on('pointerdown', () => this.handleDialogResponse(1));
    this.dialogContinue.on('pointerdown', () => this.handleDialogResponse(-1));

    this.objectiveMarker = this.add.sprite(0, 0, 'red-arrow').setDepth(10010).setScrollFactor(0).setVisible(false);
    this.objectiveDistanceText = this.add.text(0, 0, '', {
      fontFamily: 'Arial Black', fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 3
    }).setDepth(10011).setScrollFactor(0).setVisible(false);
    
    this.uiElements.push(this.objectiveMarker, this.objectiveDistanceText);

    this.createUpgradeUi();
    this.updateUi();
  }

  createUpgradeUi() {
    const fixed = (obj, depth = 10015) => {
      obj.setScrollFactor(0).setDepth(depth);
      if (this.uiElements) this.uiElements.push(obj);
      return obj;
    };
    this.upgradePanel = fixed(this.add.graphics()).setVisible(false);
    this.upgradeButtons = [
      this.createUpgradeButton(860, 438, 'Perbaiki Kastil', '5 kayu', () => this.repairCastle()),
      this.createUpgradeButton(860, 478, 'Asah Pedang', '15 emas', () => this.upgradeBlade()),
      this.createUpgradeButton(860, 518, 'Panggil Penjaga', '10 emas', () => this.hireGuard()),
      this.createUpgradeButton(860, 558, 'Curi Nyawa', '25 emas', () => this.buyLifesteal()),
    ];
  }

  createUpgradeButton(x, y, label, cost, callback) {
    const bg = this.add.rectangle(x, y, 178, 32, 0x3d2817, 0.95)
      .setStrokeStyle(2, 0xffa500, 0.8)
      .setScrollFactor(0)
      .setDepth(10016)
      .setInteractive({ cursor: 'pointer' })
      .setVisible(false);
    const text = this.add.text(x, y - 2, `${label}\n${cost}`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: -2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10017).setVisible(false);
    
    bg.on('pointerover', () => {
      bg.setFillStyle(0x52341b, 0.95);
      bg.setStrokeStyle(2, 0xffd700, 1);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x3d2817, 0.95);
      bg.setStrokeStyle(2, 0xffa500, 0.8);
    });
    
    bg.on('pointerdown', () => {
      this.sfx.click();
      callback();
    });
    bg.on('pointerover', () => bg.setFillStyle(0x355f73, 0.95));
    bg.on('pointerout', () => bg.setFillStyle(0x284252, 0.88));
    return { bg, text };
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      attackA: Phaser.Input.Keyboard.KeyCodes.SPACE,
      attackB: Phaser.Input.Keyboard.KeyCodes.J,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      repair: Phaser.Input.Keyboard.KeyCodes.R,
      upgrade: Phaser.Input.Keyboard.KeyCodes.U,
      guard: Phaser.Input.Keyboard.KeyCodes.G,
      skill1: Phaser.Input.Keyboard.KeyCodes.ONE,
      skill2: Phaser.Input.Keyboard.KeyCodes.TWO,
      skill3: Phaser.Input.Keyboard.KeyCodes.THREE,
    });

    this.input.on('pointerdown', (pointer) => {
      this.sfx.ensure();
      if (this.isDialogActive) {
        // If dialog chain has responses showing, don't handle click here (buttons handle it)
        if (this.dialogResponsesVisible) return;
        if (this.dialogReadyToClose) {
          this.advanceDialogChain();
        } else {
          this.dialogSkipped = true;
          this.dialogReadyToClose = true;
          if (this.dialogTypewriter) this.dialogTypewriter.remove(false);
          this.dialogText.setText(this.dialogBody);
          // Show responses or continue after skip
          this.showDialogActions();
        }
        return;
      }
      if (pointer.leftButtonDown()) {
        this.attack();
      }
    });
  }

  setupPhysics() {
    this.redBaseBarrier = this.add.rectangle(24 * 64, 18 * 64, 384, 512, 0x000000, 0).setOrigin(0.5);
    this.physics.add.existing(this.redBaseBarrier, true);
    this.physics.add.collider(
      this.player, 
      this.redBaseBarrier, 
      () => {
        if (!this.barrierHintTime || this.time.now > this.barrierHintTime) {
          this.spawnFloatingText(this.player.x, this.player.y - 40, "Markas Merah terkunci sampai Bab 7!", "#ff8888");
          this.barrierHintTime = this.time.now + 2000;
        }
      }, 
      () => {
        return this.stats.wave <= 6 && this.stats.phase !== 'counter' && this.stats.phase !== 'final';
      }
    );

    this.physics.add.collider(this.player, this.blockers);
    this.physics.add.collider(this.player, this.enemyBuildings);
    this.physics.add.collider(this.guards, this.blockers);
    this.physics.add.collider(this.enemies, this.blockers);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.enemies, this.enemyBuildings);
    this.physics.add.collider(this.guards, this.enemies);
    this.physics.add.collider(this.enemyProjectiles, this.blockers, this.destroyProjectile, undefined, this);
    this.physics.add.collider(this.enemyProjectiles, this.enemyBuildings, this.destroyProjectile, undefined, this);

    this.physics.add.overlap(this.player, this.resources, this.collectResource, undefined, this);
    this.physics.add.overlap(this.player, this.enemyProjectiles, this.projectileHitsPlayer, undefined, this);
    this.physics.add.overlap(this.enemyProjectiles, this.castleZone, this.projectileHitsCastle, undefined, this);
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.11, 0.11);
    this.cameras.main.setDeadzone(150, 104);
    this.cameras.main.setZoom(1);

    this.minimap = this.cameras.add(16, 16, 120, 120).setZoom(0.12).setName('minimap');
    this.minimap.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.minimap.startFollow(this.player);
    this.minimap.setBackgroundColor(0x769b76);
    
    this.minimapBorder = this.add.graphics().setScrollFactor(0).setDepth(10050);
    this.minimapBorder.lineStyle(6, 0x3d2817, 1);
    this.minimapBorder.strokeRoundedRect(14, 14, 124, 124, 8);
    
    if (this.uiElements) {
       this.uiElements.push(this.minimapBorder);
       this.minimap.ignore(this.uiElements);
    }
  }

  update(time, delta) {
    if (this.gameEnded) {
      return;
    }

    this.updatePlayer(time);
    this.updateEnemies(time);
    this.updateGuards(time);
    this.updateProjectiles(delta);
    this.updateWaveState(time);
    this.updateQuestAction(time);
    this.updateInteractionHint();
    this.updateDepths();
    this.updateObjectiveMarker();
    this.updateUi();
  }

  updateQuestAction(time) {
    if (!this.activeQuestAction) return;
    
    if (this.activeQuestAction.type === 'ambush' || this.activeQuestAction.type === 'mini_boss') {
      let aliveCount = 0;
      if (this.questEnemies) {
        this.questEnemies.children.iterate((enemy) => {
          if (enemy && enemy.active) aliveCount++;
        });
      }
      if (aliveCount === 0) {
        this.finishQuestAction();
      }
    } else if (this.activeQuestAction.type === 'search_clue') {
      if (this.clueZone && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.clueZone.getBounds())) {
        this.spawnFloatingText(this.player.x, this.player.y - 50, "Petunjuk ditemukan!", "#ffff00");
        this.sfx.collect();
        this.clueZone.destroy();
        this.finishQuestAction();
      }
    }
  }

  finishQuestAction() {
    this.activeQuestAction = null;
    this.showDialog('Sistem', 'Aksi misi berhasil diselesaikan!', 3000);
    this.time.delayedCall(1500, () => {
      this.completeSubQuest();
    });
  }

  spawnQuestEnemy(kind, x, y) {
    const enemy = this.spawnEnemy(kind, 'enemy_spawn_south', { waveEnemy: false });
    if (enemy) {
      enemy.setPosition(x, y);
      enemy.ai.lastSafePosition.set(x, y);
      enemy.ai.questEnemy = true;
      if (!this.questEnemies) this.questEnemies = this.physics.add.group();
      this.questEnemies.add(enemy);
    }
  }

  startQuestAction(action, subQuest) {
    this.activeQuestAction = action;
    this.activeSubQuestToComplete = subQuest;
    
    if (action.type === 'ambush' || action.type === 'mini_boss') {
      this.questEnemies = this.physics.add.group();
      const count = action.count || 1;
      for (let i = 0; i < count; i++) {
        const offset = [Phaser.Math.Between(-2, 2), Phaser.Math.Between(2, 4)];
        const tileX = this.worldToTile(this.player.x).x + offset[0];
        const tileY = this.worldToTile(this.player.y).y + offset[1];
        const pos = this.findSafeWorld(tileX, tileY, 10);
        this.spawnQuestEnemy(action.kind, pos.x, pos.y);
      }
      this.setObjective(action.hint, null);
    } else if (action.type === 'search_clue') {
      this.clueZone = this.add.zone(action.targetX * 64, action.targetY * 64, 128, 128);
      this.physics.add.existing(this.clueZone);
      this.setObjective(action.hint, { x: action.targetX * 64, y: action.targetY * 64 });
    } else if (action.type === 'ignite_torch') {
      this.questTorches = [
        this.spawnQuestTorch(20, 15),
        this.spawnQuestTorch(26, 15)
      ];
      this.setObjective(action.hint, this.questTorches[0]);
    }
  }

  spawnQuestTorch(tx, ty) {
    const pos = this.findSafeWorld(tx, ty, 5);
    const torch = this.physics.add.staticSprite(pos.x, pos.y, 'fire').setScale(0.8).setDepth(pos.y).setTint(0x555555);
    torch.body.setSize(32, 32);
    torch.ignited = false;
    return torch;
  }

  updatePlayer(time) {
    if (this.isDialogActive) {
      this.player.setVelocity(0, 0);
      this.player.play('blue-idle', true);
      
      if (Phaser.Input.Keyboard.JustDown(this.keys.attackA) || Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
        this.sfx.ensure();
        if (this.dialogResponsesVisible) return;
        if (this.dialogReadyToClose) {
          this.advanceDialogChain();
        } else {
          this.dialogSkipped = true;
          this.dialogReadyToClose = true;
          if (this.dialogTypewriter) this.dialogTypewriter.remove(false);
          this.dialogText.setText(this.dialogBody);
          this.showDialogActions();
        }
      }
      return;
    }

    if (this.isAttacking && time > this.attackReadyAt) {
      this.isAttacking = false;
    }

    const direction = new Phaser.Math.Vector2(
      (this.cursors.left.isDown || this.keys.left.isDown ? -1 : 0) + (this.cursors.right.isDown || this.keys.right.isDown ? 1 : 0),
      (this.cursors.up.isDown || this.keys.up.isDown ? -1 : 0) + (this.cursors.down.isDown || this.keys.down.isDown ? 1 : 0),
    );

    if (Phaser.Input.Keyboard.JustDown(this.keys.attackA) || Phaser.Input.Keyboard.JustDown(this.keys.attackB)) {
      this.sfx.ensure();
      this.attack();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
      this.sfx.ensure();
      this.interact();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.repair)) {
      this.repairCastle();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.upgrade)) {
      this.upgradeBlade();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.guard)) {
      this.hireGuard();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.skill1)) {
      this.useWhirlwind(time);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.skill2)) {
      this.useDashStrike(time);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.skill3)) {
      this.useHolyHeal(time);
    }

    const speed = 190;
    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.lastDirection.copy(direction);
      this.player.body.velocity.x = Phaser.Math.Linear(this.player.body.velocity.x, direction.x * speed, 0.32);
      this.player.body.velocity.y = Phaser.Math.Linear(this.player.body.velocity.y, direction.y * speed, 0.32);
      this.player.setFlipX(direction.x < -0.05 || (direction.x === 0 && this.player.flipX));
      if (!this.isAttacking) {
        this.player.play('blue-run', true);
      }
      if (!this.lastDustAt || time > this.lastDustAt + 95) {
        this.dustEmitter.emitParticleAt(this.player.x, this.player.y + 24, 1);
        this.lastDustAt = time;
      }
    } else {
      this.player.body.velocity.x = Phaser.Math.Linear(this.player.body.velocity.x, 0, 0.36);
      this.player.body.velocity.y = Phaser.Math.Linear(this.player.body.velocity.y, 0, 0.36);
      if (!this.isAttacking) {
        this.player.play('blue-idle', true);
      }
    }

    this.playerShadow.setPosition(this.player.x, this.player.y + 25);
    this.playerShadow.setDepth(this.player.y - 1);
    this.keepActorInsideWalkableArea(this.player, this.lastSafePosition);
    this.player.setAlpha(time < this.invulnerableUntil && time % 140 < 70 ? 0.58 : 1);
  }

  updateEnemies(time) {
    if (this.isDialogActive) return;

    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) {
        return;
      }

      const ai = enemy.ai;
      const playerDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const castleDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.castleAttackPoint.x, this.castleAttackPoint.y);

      // Anti-stuck detection: track enemy position changes
      if (!ai._lastCheckPos) {
        ai._lastCheckPos = new Phaser.Math.Vector2(enemy.x, enemy.y);
        ai._lastMoveTime = time;
        ai._stuckTeleports = 0;
      }
      const movedDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, ai._lastCheckPos.x, ai._lastCheckPos.y);
      if (movedDist > 10) {
        ai._lastCheckPos.set(enemy.x, enemy.y);
        ai._lastMoveTime = time;
      }

      // If enemy is stuck for too long, fix it
      if (ai.waveEnemy && time - ai._lastMoveTime > this.STUCK_TIMEOUT) {
        ai._stuckTeleports += 1;
        if (ai._stuckTeleports >= 3) {
          // Too many teleports = force kill this enemy
          this.forceKillStuckEnemy(enemy);
          return;
        }
        // Teleport enemy to a safe tile closer to castle
        this.teleportEnemyTowardTarget(enemy, this.castleAttackPoint);
        ai._lastMoveTime = time;
        return;
      }

      if (this.stats.phase === 'defense' && castleDistance < 72 && time > ai.nextAttackAt) {
        enemy.setVelocity(0, 0);
        enemy.play(this.getEnemyAnim(ai.kind, 'attack'), true);
        this.damageCastle(ai.damage, enemy);
        ai.nextAttackAt = time + (ai.kind === 'brute' ? 1200 : 950);
      } else if (playerDistance < 56 && time > ai.nextAttackAt) {
        enemy.setVelocity(0, 0);
        enemy.play(this.getEnemyAnim(ai.kind, 'attack'), true);
        this.damagePlayer(ai.damage, enemy);
        ai.nextAttackAt = time + (ai.kind === 'boss' ? 760 : 900);
      } else if (ai.kind === 'archer' && playerDistance < 250 && time > ai.nextShotAt && this.hasLineOfSight(enemy, this.player)) {
        enemy.setVelocity(0, 0);
        enemy.play('red-archer-shoot', true);
        this.time.delayedCall(160, () => {
          if (enemy.active) {
            this.shootArrow(enemy, this.player);
          }
        });
        ai.nextShotAt = time + 1500;
      } else {
        const target = this.pickEnemyTarget(enemy);
        this.moveActorToward(enemy, target, ai.speed, time, true);
      }

      this.keepActorInsideWalkableArea(enemy, ai.lastSafePosition);
      this.syncEnemyHp(enemy);
    });
  }

  pickEnemyTarget(enemy) {
    const playerDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    if (playerDistance < (enemy.ai.kind === 'boss' ? 280 : 190)) {
      return this.player;
    }
    // From wave 7 onwards, they defend their base rather than attacking ours
    if (this.stats.phase === 'defense' && this.stats.wave < 7) {
      return this.castleAttackPoint;
    }
    // If wave 7+, they stay near their base or target the player
    return this.player;
  }

  updateGuards(time) {
    if (this.isDialogActive) return;
    
    this.guards.children.iterate((guard) => {
      if (!guard?.active) {
        return;
      }

      const target = this.findNearestEnemy(guard.x, guard.y, 230);
      if (target) {
        const distance = Phaser.Math.Distance.Between(guard.x, guard.y, target.x, target.y);
        if (distance < 58 && time > guard.ai.nextAttackAt) {
          guard.setVelocity(0, 0);
          guard.play('blue-attack', true);
          this.damageEnemy(target, new Phaser.Math.Vector2(target.x - guard.x, target.y - guard.y), 1);
          guard.ai.nextAttackAt = time + 820;
          guard.once('animationcomplete-blue-attack', () => {
            if (guard.active) {
              guard.play('blue-idle', true);
            }
          });
        } else {
          this.moveActorToward(guard, target, 116, time, false);
        }
      } else {
        let currentHome = guard.ai.home;
        if (this.stats.wave >= 7 || ['counter', 'final'].includes(this.stats.phase)) {
          // Push towards enemy base in counter-attack levels
          currentHome = this.enemyBasePoint;
        }

        const homeDistance = Phaser.Math.Distance.Between(guard.x, guard.y, currentHome.x, currentHome.y);
        if (homeDistance > 32) {
          this.moveActorToward(guard, currentHome, 92, time, false);
        } else {
          guard.setVelocity(0, 0);
          guard.play('blue-idle', true);
        }
      }

      this.keepActorInsideWalkableArea(guard, guard.ai.lastSafePosition);
    });
  }

  updateProjectiles(delta) {
    this.enemyProjectiles.children.iterate((projectile) => {
      if (!projectile?.active) {
        return;
      }
      projectile.life -= delta;
      if (projectile.life <= 0) {
        this.destroyProjectile(projectile);
      }
    });
  }

  updateWaveState(time) {
    if (this.stats.phase !== 'defense') {
      return;
    }

    // Wave stall detection: if no enemies killed in WAVE_STALL_TIMEOUT, force-kill stuck ones
    const currentAlive = this.aliveWaveEnemies();
    if (this.spawnQueue.length === 0 && currentAlive > 0) {
      if (currentAlive !== this.lastWaveEnemyCount) {
        this.lastWaveEnemyCount = currentAlive;
        this.lastWaveProgressTime = time;
      } else if (time - this.lastWaveProgressTime > this.WAVE_STALL_TIMEOUT) {
        // Force kill all stuck wave enemies
        this.forceKillAllStuckWaveEnemies();
        this.lastWaveProgressTime = time;
      }
    }

    if (this.spawnQueue.length === 0 && currentAlive === 0 && !this.waveCompleting) {
      this.waveCompleting = true;
      this.time.delayedCall(700, () => {
        this.waveCompleting = false;
        if (this.stats.wave >= this.stats.maxWaves) {
          this.unlockCounterAttack();
        } else {
          this.enterPreparation();
        }
      });
    }
  }

  updateDepths() {
    this.player.setDepth(this.player.y);
    this.playerShadow.setDepth(this.player.y - 1);
    this.castleGlow?.setDepth(this.castleAttackPoint.y - 1);
    this.enemyCoreGlow?.setDepth(this.enemyBasePoint.y - 1);
    this.enemyCoreFire?.setDepth(this.enemyCoreFire.y + 20);
    this.npcs.forEach((npc) => {
      npc.setDepth(npc.y);
      npc.nameTag.setDepth(npc.y + 1);
      if (npc.questMarker) npc.questMarker.setDepth(npc.y + 2);
    });
    this.sheep.forEach((sheep) => sheep.setDepth(sheep.y));
    this.resources.children.iterate((resource) => resource?.setDepth(resource.y + 10));
    this.guards.children.iterate((guard) => guard?.active && guard.setDepth(guard.y));
    this.enemies.children.iterate((enemy) => enemy?.active && enemy.setDepth(enemy.y));
    this.enemyBuildings.children.iterate((building) => building?.active && building.setDepth(building.y));
  }

  updateInteractionHint() {
    const npc = this.getNearbyNpc();
    this.npcs.forEach((entry) => entry.nameTag.setAlpha(entry === npc ? 1 : 0.76));
    
    if (this.interactionHint) {
      if (npc && !this.dialogPanel.visible) {
        this.interactionHint.setVisible(true);
        this.interactionHint.y = 480 + Math.sin(this.time.now / 150) * 3;
      } else {
        this.interactionHint.setVisible(false);
      }
    }
  }

  interact() {
    const npc = this.getNearbyNpc();
    if (!npc) return;
    const data = npc.npcData;
    
    // During quest phase: check if this NPC has an active sub-quest
    if (this.stats.phase === 'quest') {
      const chapter = CHAPTER_QUESTS[this.questState.currentChapter - 1];
      if (!chapter) return;
      
      const activeSubQuest = chapter.subQuests[this.questState.subQuestProgress];
      
      // Check if this NPC is the active sub-quest target
      if (activeSubQuest && activeSubQuest.npc === data.id) {
        // Check resource requirements
        if (activeSubQuest.requireResource) {
          const res = activeSubQuest.requireResource;
          if (this.stats[res.type] < res.amount) {
            this.showDialog(data.name, activeSubQuest.failDialog || `Kau butuh ${res.amount} ${res.type === 'gold' ? 'emas' : 'kayu'} dulu.`, 3000, data.avatar);
            return;
          }
          // Deduct resources
          this.stats[res.type] -= res.amount;
        }
        // Play sub-quest dialog chain
        this.playDialogChain(activeSubQuest.dialog, () => {
          if (activeSubQuest.action) {
            this.startQuestAction(activeSubQuest.action, activeSubQuest);
          } else {
            this.completeSubQuest();
          }
        });
        return;
      }
      
      // Check if this NPC triggers the main quest (all sub-quests done)
      if (this.questState.mainQuestReady && chapter.mainQuest.triggerNpc === data.id) {
        this.playDialogChain(chapter.mainQuest.triggerDialog, () => {
          this.time.delayedCall(800, () => this.startWave(this.questState.currentChapter));
        });
        return;
      }
      
      // Main quest NPC but sub-quests not done
      if (chapter.mainQuest.triggerNpc === data.id && !this.questState.mainQuestReady) {
        this.showDialog(data.name, 'Persiapanmu belum selesai, Ksatria. Selesaikan semua misi kecil dulu sebelum kita mulai pertempuran.', 4000, data.avatar);
        return;
      }
    }
    
    // Check torches
    if (this.activeQuestAction && this.activeQuestAction.type === 'ignite_torch') {
      let interactedTorch = false;
      this.questTorches.forEach(t => {
        if (!t.ignited && Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y) < 60) {
          t.ignited = true;
          t.clearTint();
          t.play('fire-burn');
          this.sfx.hit();
          this.spawnFloatingText(t.x, t.y - 30, "Menyala!", "#ff8800");
          interactedTorch = true;
        }
      });
      if (interactedTorch) {
        if (this.questTorches.every(t => t.ignited)) {
          this.finishQuestAction();
        }
        return;
      }
    }
    
    // Generic dialog for non-quest interactions
    let line = data.lines[Phaser.Math.Between(0, data.lines.length - 1)];
    
    if (this.stats.phase === 'defense') {
      if (data.id === 'elder') line = 'Fokus ke musuh! Jangan biarkan kastil jatuh!';
      else if (data.id === 'blacksmith') line = 'Aku tidak bisa menempa saat pertempuran!';
      else if (data.id === 'healer') line = 'Bertahanlah! Selesaikan pertempuran dulu!';
      else if (data.id === 'captain') line = 'Pertahankan posisi! Musuh masih menyerang!';
    } else if (this.stats.phase === 'counter' || this.stats.phase === 'final') {
      if (data.id === 'elder') line = 'Kastil berdiri. Sekarang saatnya membalas!';
      else if (data.id === 'aran') line = 'Hancurkan inti markas mereka, Ksatria!';
    }
    
    this.showDialog(data.name, line, 4200, data.avatar);
    
    // Healer always heals during non-combat
    if (data.id === 'healer' && this.stats.phase !== 'defense') {
      this.healPlayer(2);
      this.spawnFloatingText(this.player.x, this.player.y - 58, 'SEMBUH', '#bdf7c5');
    }
  }

  startWave(waveNumber) {
    const wave = WAVE_CONFIGS[waveNumber - 1];
    if (!wave || this.gameEnded) {
      return;
    }

    this.stats.phase = 'defense';
    this.stats.wave = waveNumber;
    this.spawnQueue = this.expandWave(wave);
    this.waveCompleting = false;
    this.waveStartTime = this.time.now;
    this.lastWaveEnemyCount = 0;
    this.lastWaveProgressTime = this.time.now;
    const speakerNpc = NPCS.find(n => n.name === (wave.speaker || 'Tetua Desa'));
    this.showDialog(wave.speaker || wave.chapterTitle || wave.title, wave.dialog, 4300, speakerNpc?.avatar || 'avatar-01');
    this.updateQuestMarkers();
    
    if (waveNumber >= 7) {
      this.setObjective(`Gelombang ${waveNumber}: Serang Markas Merah!`, this.enemyBasePoint);
      this.enemyCoreGlow.setVisible(true);
      this.enemyCoreFire.setVisible(true);
    } else {
      this.setObjective(`Bertahan ${wave.title}. Lindungi kastil.`, null);
    }

    if (this.waveSpawnEvent) {
      this.waveSpawnEvent.remove(false);
    }
    this.waveSpawnEvent = this.time.addEvent({
      delay: 820,
      repeat: this.spawnQueue.length - 1,
      callback: () => this.spawnNextWaveEnemy(),
    });
    this.spawnNextWaveEnemy();
  }

  expandWave(wave) {
    const list = [];
    wave.units.forEach((unit) => {
      for (let index = 0; index < unit.count; index += 1) {
        list.push(unit);
      }
    });
    return Phaser.Utils.Array.Shuffle(list);
  }

  spawnNextWaveEnemy() {
    const entry = this.spawnQueue.shift();
    if (!entry || this.gameEnded) {
      return;
    }
    this.spawnEnemy(entry.kind, entry.spawn, { waveEnemy: true });
  }

  enterPreparation() {
    // Player HP upgrade: +1 max HP per wave completed
    this.stats.playerMaxHp += 1;
    this.healPlayer(2, false);
    this.spawnFloatingText(this.player.x, this.player.y - 70, '+1 HP MAKS!', '#00ff88');
    
    // Advance to next chapter's quest phase
    const nextChapter = this.questState.currentChapter + 1;
    if (nextChapter > CHAPTER_QUESTS.length) {
      this.unlockCounterAttack();
      return;
    }
    this.questState.currentChapter = nextChapter;
    this.questState.subQuestProgress = 0;
    this.questState.mainQuestReady = false;
    this.stats.phase = 'quest';
    
    // Show/hide NPCs based on chapter
    this.npcs.forEach((npc) => {
      if (npc.npcData.minChapter && npc.npcData.minChapter <= nextChapter) {
        npc.setVisible(true);
        npc.nameTag.setVisible(true);
      }
    });
    
    const chapter = CHAPTER_QUESTS[nextChapter - 1];
    this.showDialog('Tetua Desa', `${chapter.title} dimulai! Selesaikan misi persiapan sebelum pertempuran berikutnya.`, 4600, 'avatar-01');
    this.updateQuestTracker();
    this.updateQuestMarkers();
  }

  unlockCounterAttack() {
    this.stats.phase = 'counter';
    this.counterUnlocked = true;
    this.enemyCoreGlow.setVisible(true);
    this.enemyCoreFire.setVisible(true);
    this.spawnBaseDefenders();
    this.showDialog('Tetua Desa', 'Kastil kita masih berdiri tegak! Sekarang seberangi jembatan dan hancurkan markas pasukan merah!', 5600, 'avatar-01');
    this.setObjective('Pergi ke markas merah dan kalahkan Tombak Hitam.', this.enemyBasePoint);
  }

  spawnBaseDefenders() {
    if (this.baseDefendersSpawned) {
      return;
    }
    this.baseDefendersSpawned = true;
    this.spawnEnemy('grunt', 'enemy_base_core', { waveEnemy: false, offsetTile: [-2, 1] });
    this.spawnEnemy('archer', 'enemy_base_core', { waveEnemy: false, offsetTile: [3, 0] });
    this.spawnEnemy('brute', 'enemy_base_core', { waveEnemy: false, offsetTile: [-3, -1] });
    this.spawnEnemy('boss', 'boss_spawn', { waveEnemy: false, boss: true });
  }

  spawnEnemy(kind, objectName, options = {}) {
    const def = ENEMY_DEFS[kind];
    const baseTile = OBJECT_FALLBACKS[objectName] || OBJECT_FALLBACKS.enemy_spawn_south;
    const tile = options.offsetTile
      ? [baseTile[0] + options.offsetTile[0], baseTile[1] + options.offsetTile[1]]
      : baseTile;
    let pos = this.findSafeWorld(tile[0], tile[1], 20);
    if (!pos) {
      pos = this.tileToWorld(tile[0], tile[1]);
    }
    const enemy = this.physics.add.sprite(pos.x, pos.y, def.texture)
      .setScale(def.scale)
      .setDepth(pos.y)
      .play(this.getEnemyAnim(kind, 'idle'));
    enemy.body.setSize(def.body[0], def.body[1]);
    enemy.body.setOffset(def.body[2], def.body[3]);
    
    // Wave-based enemy scaling: reduced scaling so the game is easier to win
    const waveNum = this.stats.wave || 1;
    const hpBonus = Math.floor((waveNum - 1) * 0.2); // Very slow HP scaling
    const speedBonus = (waveNum - 1) * 1; // Mild speed scaling
    const damageBonus = Math.floor((waveNum - 1) / 5); // +1 damage every 5 waves
    
    const scaledHp = def.hp + hpBonus;
    const scaledSpeed = def.speed + speedBonus;
    const scaledDamage = def.damage + damageBonus;
    
    enemy.ai = {
      kind,
      health: scaledHp,
      maxHealth: scaledHp,
      speed: scaledSpeed,
      damage: scaledDamage,
      rewardGold: def.rewardGold,
      rewardWood: def.rewardWood,
      waveEnemy: Boolean(options.waveEnemy),
      boss: Boolean(options.boss),
      nextAttackAt: 0,
      nextShotAt: 0,
      hurtUntil: 0,
      nextPathAt: 0,
      path: [],
      pathTargetKey: null,
      lastSafePosition: new Phaser.Math.Vector2(pos.x, pos.y),
    };
    enemy.hpBarBack = this.add.rectangle(enemy.x, enemy.y - 42, 44, 8, 0x20323a, 0.86).setDepth(enemy.y + 1);
    enemy.hpBar = this.add.rectangle(enemy.x, enemy.y - 42, 40, 5, kind === 'boss' ? 0x9b60ff : 0xe74f4f).setDepth(enemy.y + 2);
    this.enemies.add(enemy);
    this.spawnImpact(enemy.x, enemy.y, 0.32);
    return enemy;
  }

  moveActorToward(actor, target, speed, time, usePath) {
    const targetTile = this.worldToTile(target.x, target.y);
    const safeTarget = this.findSafeTile(targetTile.x, targetTile.y, 12, { reachableOnly: true });
    const targetKey = this.tileKey(safeTarget.x, safeTarget.y);

    if (usePath && (!actor.ai.path || actor.ai.pathTargetKey !== targetKey || time > actor.ai.nextPathAt)) {
      const startTile = this.worldToTile(actor.x, actor.y);
      const safeStart = this.findSafeTile(startTile.x, startTile.y, 6, { reachableOnly: true });
      actor.ai.path = this.findPathTiles(safeStart, safeTarget);
      actor.ai.pathTargetKey = targetKey;
      actor.ai.nextPathAt = time + 420;
    }

    if (usePath && actor.ai.path) {
      while (actor.ai.path.length > 0) {
        const nextWorld = this.tileToWorld(actor.ai.path[0].x, actor.ai.path[0].y);
        if (Phaser.Math.Distance.Between(actor.x, actor.y, nextWorld.x, nextWorld.y) > 10) {
          break;
        }
        actor.ai.path.shift();
      }
    }

    const targetWorld = usePath && actor.ai.path?.length > 0
      ? this.tileToWorld(actor.ai.path[0].x, actor.ai.path[0].y)
      : { x: target.x, y: target.y };
    const move = new Phaser.Math.Vector2(targetWorld.x - actor.x, targetWorld.y - actor.y);
    if (move.lengthSq() > 64) {
      move.normalize();
      actor.setVelocity(move.x * speed, move.y * speed);
      actor.setFlipX(move.x < -0.05);
      actor.play(this.getActorRunAnim(actor), true);
      return false;
    }

    actor.setVelocity(0, 0);
    actor.play(this.getActorIdleAnim(actor), true);
    return true;
  }

  attack() {
    const now = this.time.now;
    if (now < this.attackReadyAt || this.isAttacking) {
      return;
    }

    this.isAttacking = true;
    this.attackReadyAt = now + 370;
    this.player.setVelocity(this.player.body.velocity.x * 0.55, this.player.body.velocity.y * 0.55);
    this.player.play('blue-attack', true);

    const dir = this.lastDirection.lengthSq() > 0 ? this.lastDirection.clone().normalize() : new Phaser.Math.Vector2(1, 0);
    const hitX = this.player.x + dir.x * 72;
    const hitY = this.player.y + 14 + dir.y * 58;
    const attackBox = new Phaser.Geom.Rectangle(hitX - 64, hitY - 60, 128, 120);
    let hitSomething = false;

    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active || enemy.ai.hurtUntil > now) {
        return;
      }
      if (Phaser.Geom.Intersects.RectangleToRectangle(attackBox, this.getActorHitRect(enemy, 24))) {
        hitSomething = true;
        this.damageEnemy(enemy, dir, this.stats.playerDamage);
      }
    });

    this.enemyBuildings.children.iterate((building) => {
      if (!building?.active) return;
      if (Phaser.Geom.Intersects.RectangleToRectangle(attackBox, this.getActorHitRect(building, 10))) {
        hitSomething = true;
        this.damageEnemyBuilding(building, this.stats.playerDamage);
      }
    });

    if ((this.stats.phase === 'final' || this.stats.phase === 'counter' || this.stats.wave >= 10 || this.bossDefeated) && this.stats.baseHp > 0) {
      const coreRect = new Phaser.Geom.Rectangle(this.enemyBasePoint.x - 58, this.enemyBasePoint.y - 58, 116, 116);
      if (Phaser.Geom.Intersects.RectangleToRectangle(attackBox, coreRect)) {
        hitSomething = true;
        this.damageEnemyBase(this.stats.playerDamage);
      }
    }

    if (hitSomething) {
      this.sfx.hit();
      if (this.stats.lifestealLevel > 0 && Math.random() < (0.12 * this.stats.lifestealLevel)) {
         this.healPlayer(1);
         this.spawnFloatingText(this.player.x, this.player.y - 48, '+NYAWA', '#ff5555');
      }
    }

    this.player.once('animationcomplete-blue-attack', () => {
      this.isAttacking = false;
    });
  }

  useWhirlwind(time) {
    if (time < this.skills.whirlwind.readyAt || this.isAttacking) return;
    this.skills.whirlwind.readyAt = time + this.skills.whirlwind.cooldown;
    this.isAttacking = true;
    this.attackReadyAt = time + 600;
    this.player.setVelocity(0, 0);
    this.player.play('blue-attack', true);
    this.sfx.hit();

    const spin = this.add.circle(this.player.x, this.player.y, 140, 0x00aaff, 0.4).setDepth(this.player.y + 10);
    this.tweens.add({ targets: spin, scale: 1.5, alpha: 0, duration: 500, onComplete: () => spin.destroy() });

    const hitCircle = new Phaser.Geom.Circle(this.player.x, this.player.y, 140);
    let hitCount = 0;
    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active || enemy.ai.hurtUntil > time) return;
      if (Phaser.Geom.Intersects.CircleToRectangle(hitCircle, this.getActorHitRect(enemy, 24))) {
        const pushDir = new Phaser.Math.Vector2(enemy.x - this.player.x, enemy.y - this.player.y).normalize();
        this.damageEnemy(enemy, pushDir, this.stats.playerDamage * 2);
        hitCount++;
      }
    });
    if (hitCount > 0) this.sfx.hit();
  }

  useDashStrike(time) {
    if (time < this.skills.dash.readyAt || this.isAttacking) return;
    this.skills.dash.readyAt = time + this.skills.dash.cooldown;
    
    this.isAttacking = true;
    this.attackReadyAt = time + 500;
    this.player.play('blue-attack', true);
    
    const dir = this.lastDirection.lengthSq() > 0 ? this.lastDirection.clone().normalize() : new Phaser.Math.Vector2(1, 0);
    this.player.setVelocity(dir.x * 750, dir.y * 750);

    for(let i=0; i<6; i++) {
        this.time.delayedCall(i * 40, () => {
            const trail = this.add.sprite(this.player.x, this.player.y, this.player.texture.key, this.player.frame.name)
              .setTintFill(0x00aaff).setAlpha(0.6).setFlipX(this.player.flipX).setDepth(this.player.y - 1);
            this.tweens.add({ targets: trail, alpha: 0, duration: 300, onComplete: () => trail.destroy() });
        });
    }

    const hitLine = new Phaser.Geom.Line(this.player.x, this.player.y, this.player.x + dir.x * 250, this.player.y + dir.y * 250);
    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active || enemy.ai.hurtUntil > time) return;
      if (Phaser.Geom.Intersects.LineToRectangle(hitLine, this.getActorHitRect(enemy, 24))) {
        this.damageEnemy(enemy, dir, this.stats.playerDamage * 3);
      }
    });
    this.sfx.hit();
  }

  useHolyHeal(time) {
    if (time < this.skills.heal.readyAt || this.isAttacking) return;
    this.skills.heal.readyAt = time + this.skills.heal.cooldown;
    
    this.isAttacking = true;
    this.attackReadyAt = time + 500;
    this.player.setVelocity(0, 0);
    this.player.play('blue-idle', true);

    this.healPlayer(Math.ceil(this.stats.playerMaxHp / 2));
    this.stats.castleHp = Math.min(this.stats.castleMaxHp, this.stats.castleHp + 10);
    this.syncCastleWorldHpBar();
    this.spawnFloatingText(this.player.x, this.player.y - 60, 'PENYEMBUHAN SUCI!', '#00ff00');
    
    const aura = this.add.circle(this.player.x, this.player.y, 220, 0x00ff00, 0.4).setDepth(this.player.y + 10);
    this.tweens.add({ targets: aura, scale: 1.5, alpha: 0, duration: 1000, onComplete: () => aura.destroy() });

    this.guards.children.iterate((guard) => {
      if (guard?.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, guard.x, guard.y) < 220) {
         guard.ai.health = guard.ai.maxHealth;
         this.spawnFloatingText(guard.x, guard.y - 40, '+NYAWA', '#00ff00');
         this.syncGuardHp(guard);
      }
    });
  }

  damageEnemy(enemy, direction, amount) {
    if (!enemy?.active) {
      return;
    }
    const push = direction.clone();
    if (push.lengthSq() === 0) {
      push.set(1, 0);
    }
    push.normalize();

    enemy.ai.health -= amount;
    enemy.ai.hurtUntil = this.time.now + 240;
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(80, () => enemy.active && enemy.clearTint());
    enemy.setVelocity(push.x * 145, push.y * 145);
    this.spawnImpact(enemy.x, enemy.y, enemy.ai.kind === 'boss' ? 0.58 : 0.42);

    if (enemy.ai.health <= 0) {
      this.defeatEnemy(enemy);
    } else {
      this.syncEnemyHp(enemy);
    }
  }

  damageEnemyBuilding(building, amount) {
    if (!building?.active) return;
    
    building.ai.health -= amount;
    building.setTintFill(0xffffff);
    this.time.delayedCall(80, () => building.active && building.clearTint());
    this.spawnImpact(building.x, building.y, 0.6);
    this.cameras.main.shake(80, 0.003);

    if (building.ai.health <= 0) {
      this.stats.gold += building.ai.rewardGold;
      this.stats.wood += building.ai.rewardWood;
      this.spawnFloatingText(building.x, building.y - 80, `+${building.ai.rewardGold}G +${building.ai.rewardWood}W`, '#ffd073');
      
      const boom = this.add.sprite(building.x, building.y, 'explosion-big')
        .setScale(0.8)
        .setDepth(building.y + 40)
        .play('explode-big');
      boom.once('animationcomplete', () => boom.destroy());
      
      building.hpBar?.destroy();
      building.hpBarBack?.destroy();
      building.destroy();
    } else {
      const ratio = Phaser.Math.Clamp(building.ai.health / building.ai.maxHealth, 0, 1);
      building.hpBar.setPosition(building.x - (50 * (1 - ratio)) / 2, building.y - 70)
        .setDisplaySize(50 * ratio, 5);
    }
  }

  defeatEnemy(enemy) {
    if (!enemy?.active) {
      return;
    }
    const ai = enemy.ai;
    this.stats.kills += 1;
    this.stats.gold += ai.rewardGold;
    this.stats.wood += ai.rewardWood;
    this.stats.score += ai.boss ? 900 : 120 + ai.rewardGold * 10;
    this.spawnFloatingText(enemy.x, enemy.y - 52, `+${ai.rewardGold}G +${ai.rewardWood}W`, '#ffd073');

    const boom = this.add.sprite(enemy.x, enemy.y, ai.boss ? 'explosion-big' : 'explosion')
      .setScale(ai.boss ? 0.74 : 0.42)
      .setDepth(enemy.y + 40)
      .play(ai.boss ? 'explode-big' : 'explode');
    boom.once('animationcomplete', () => boom.destroy());
    enemy.hpBar?.destroy();
    enemy.hpBarBack?.destroy();
    enemy.destroy();

    if (ai.boss) {
      this.bossDefeated = true;
      this.stats.phase = 'final';
      this.showDialog('Aran', 'Penjaga panji sudah tumbang! Ksatria, ini kesempatanmu! Hancurkan inti markas mereka dan akhiri perang ini!', 5000, 'avatar-14');
      this.setObjective('Hancurkan inti markas merah.', this.enemyBasePoint);
    }
  }

  damageEnemyBase(amount) {
    if (this.stats.baseHp <= 0) {
      return;
    }
    this.stats.baseHp = Math.max(0, this.stats.baseHp - amount);
    this.enemyCoreFire.setTintFill(0xffffff);
    this.time.delayedCall(90, () => this.enemyCoreFire?.clearTint().setTint(0xff5048));
    this.spawnImpact(this.enemyBasePoint.x, this.enemyBasePoint.y, 0.54);
    this.cameras.main.shake(100, 0.003);
    if (this.stats.baseHp <= 0) {
      this.spawnImpact(this.enemyBasePoint.x, this.enemyBasePoint.y, 0.9);
      this.sfx.win();
      this.time.delayedCall(650, () => this.endGame('win'));
    }
  }

  shootArrow(enemy, target) {
    const arrow = this.enemyProjectiles.get(enemy.x, enemy.y - 8, 'red-arrow');
    if (!arrow) {
      return;
    }
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
    arrow.setActive(true).setVisible(true).setDepth(enemy.y + 2).setRotation(angle).setScale(0.62);
    arrow.body.setSize(28, 16);
    arrow.life = 2600;
    arrow.damage = enemy.ai.damage;
    this.physics.velocityFromRotation(angle, 240, arrow.body.velocity);
  }

  destroyProjectile(projectile) {
    if (!projectile?.active) {
      return;
    }
    this.spawnImpact(projectile.x, projectile.y, 0.42);
    projectile.destroy();
  }

  projectileHitsPlayer(player, projectile) {
    this.damagePlayer(projectile.damage || 1, projectile);
    this.destroyProjectile(projectile);
  }

  projectileHitsCastle(castle, projectile) {
    if (this.stats.phase === 'defense') {
      this.damageCastle(projectile.damage || 1, projectile);
    }
    this.destroyProjectile(projectile);
  }

  damagePlayer(amount, source) {
    if (this.time.now < this.invulnerableUntil || this.gameEnded) {
      return;
    }
    this.stats.playerHp = Math.max(0, this.stats.playerHp - amount);
    this.invulnerableUntil = this.time.now + 950;
    this.sfx.hurt();
    this.cameras.main.shake(120, 0.006);
    if (source?.x !== undefined) {
      const push = new Phaser.Math.Vector2(this.player.x - source.x, this.player.y - source.y);
      if (push.lengthSq() > 0) {
        push.normalize();
        this.player.setVelocity(push.x * 230, push.y * 230);
      }
    }
    if (this.stats.playerHp <= 0) {
      this.endGame('lose', 'hero');
    }
  }

  damageCastle(amount, source) {
    if (this.gameEnded || this.stats.phase !== 'defense') {
      return;
    }
    this.stats.castleHp = Math.max(0, this.stats.castleHp - amount);
    this.spawnImpact(source?.x || this.castleAttackPoint.x, source?.y || this.castleAttackPoint.y, 0.36);
    this.cameras.main.shake(120, 0.004);
    this.syncCastleWorldHpBar();
    if (this.stats.castleHp <= 0) {
      this.endGame('lose', 'castle');
    }
  }

  healPlayer(amount, playSound = true) {
    this.stats.playerHp = Phaser.Math.Clamp(this.stats.playerHp + amount, 0, this.stats.playerMaxHp);
    if (playSound) {
      this.sfx.heal();
    }
  }

  repairCastle() {
    if (!this.canUpgrade()) {
      return;
    }
    if (this.stats.wood < 5 || this.stats.castleHp >= this.stats.castleMaxHp) {
      this.showDialog('Pandai Besi', 'Kayunya kurang, atau kastil sudah cukup kokoh.', 2600, 'avatar-18');
      return;
    }
    this.stats.wood -= 5;
    this.stats.castleHp = Math.min(this.stats.castleMaxHp, this.stats.castleHp + 8);
    this.spawnFloatingText(this.castleAttackPoint.x, this.castleAttackPoint.y - 48, '+KASTIL', '#bdf7c5');
    this.syncCastleWorldHpBar();
    this.sfx.heal();
  }

  upgradeBlade() {
    if (!this.canUpgrade()) {
      return;
    }
    if (this.stats.gold < 15) {
      this.showDialog('Pandai Besi', 'Pedangnya butuh 15 emas untuk diasah.', 2600, 'avatar-18');
      return;
    }
    this.stats.gold -= 15;
    this.stats.bladeLevel += 1;
    this.stats.playerDamage += 1;
    this.spawnFloatingText(this.player.x, this.player.y - 58, `SERANGAN ${this.stats.playerDamage}`, '#ffd073');
    this.sfx.collect();
  }

  buyLifesteal() {
    if (!this.canUpgrade()) {
      return;
    }
    if (this.stats.gold < 25) {
      this.showDialog('Pandai Besi', 'Sihir gelap butuh 25 emas.', 2600, 'avatar-18');
      return;
    }
    this.stats.gold -= 25;
    this.stats.lifestealLevel += 1;
    this.spawnFloatingText(this.player.x, this.player.y - 58, `CURI NYAWA ${this.stats.lifestealLevel}`, '#9966ff');
    this.sfx.collect();
  }

  hireGuard() {
    if (!this.canUpgrade()) {
      return;
    }
    if (this.stats.gold < 10 || this.stats.guards >= this.guardHomePoints.length) {
      this.showDialog('Pandai Besi', 'Emas tidak cukup, atau semua pos penjaga sudah terisi.', 2600, 'avatar-18');
      return;
    }
    this.stats.gold -= 10;
    this.spawnGuard(this.guardHomePoints[this.stats.guards]);
    this.stats.guards += 1;
    this.showDialog('Kapten Jaga', 'Penjaga baru sudah siap di posisinya!', 2600, 'avatar-06');
    this.sfx.collect();
  }

  canUpgrade() {
    return ['quest', 'waiting', 'counter', 'final'].includes(this.stats.phase);
  }

  collectResource(player, resource) {
    if (!resource.active) {
      return;
    }
    const data = resource.resourceData;
    resource.disableBody(true, true);
    this.stats[data.type] += data.amount;
    this.stats.score += data.amount * 12;
    this.sfx.collect();
    this.spawnCollectFx(resource.x, resource.y);
    this.spawnFloatingText(resource.x, resource.y - 44, `+${data.amount} ${data.type.toUpperCase()}`, '#fff1a8');
  }

  findNearestEnemy(x, y, radius) {
    let best = null;
    let bestDistance = radius;
    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    });
    return best;
  }

  aliveWaveEnemies() {
    let count = 0;
    this.enemies.children.iterate((enemy) => {
      if (enemy?.active && enemy.ai.waveEnemy) {
        count += 1;
      }
    });
    return count;
  }

  totalEnemyCount() {
    let count = this.spawnQueue.length;
    this.enemies.children.iterate((enemy) => {
      if (enemy?.active) {
        count += 1;
      }
    });
    return count;
  }

  getNearbyNpc() {
    let best = null;
    let bestDistance = 82;
    this.npcs.forEach((npc) => {
      if (!npc.visible) return;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (distance < bestDistance) {
        best = npc;
        bestDistance = distance;
      }
    });
    return best;
  }

  setObjective(text, targetObj = null) {
    this.currentObjective = text;
    this.objectiveTarget = targetObj;
  }

  updateObjectiveMarker() {
    if (!this.objectiveMarker || !this.objectiveDistanceText) return;
    
    // Auto-set objective target based on quest state
    if (this.stats.phase === 'quest') {
      const chapter = CHAPTER_QUESTS[this.questState.currentChapter - 1];
      if (chapter) {
        if (this.questState.mainQuestReady) {
          this.objectiveTarget = chapter.mainQuest.triggerNpc;
        } else {
          const activeQuest = chapter.subQuests[this.questState.subQuestProgress];
          if (activeQuest) {
            this.objectiveTarget = activeQuest.npc;
          }
        }
      }
    }
    
    if (!this.objectiveTarget) {
      this.objectiveMarker.setVisible(false);
      this.objectiveDistanceText.setVisible(false);
      return;
    }
    
    let targetX = 0; let targetY = 0;
    if (typeof this.objectiveTarget === 'string') {
      const npc = this.npcs.find(n => n.npcData.id === this.objectiveTarget);
      if (!npc || !npc.visible) {
        this.objectiveMarker.setVisible(false);
        this.objectiveDistanceText.setVisible(false);
        return;
      }
      targetX = npc.x; targetY = npc.y;
    } else {
      targetX = this.objectiveTarget.x; targetY = this.objectiveTarget.y;
    }

    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    if (dist < 120) {
      this.objectiveMarker.setVisible(false);
      this.objectiveDistanceText.setVisible(false);
      return;
    }

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    const margin = 50;
    const cw = this.cameras.main.width;
    const ch = this.cameras.main.height;
    
    let markerX = cw / 2 + Math.cos(angle) * (cw/2 - margin);
    let markerY = ch / 2 + Math.sin(angle) * (ch/2 - margin);
    markerX = Phaser.Math.Clamp(markerX, margin, cw - margin);
    markerY = Phaser.Math.Clamp(markerY, margin, ch - margin);

    this.objectiveMarker.setPosition(markerX, markerY);
    this.objectiveMarker.setRotation(angle);
    this.objectiveMarker.setVisible(true);

    this.objectiveDistanceText.setPosition(markerX - 15, markerY + 15);
    this.objectiveDistanceText.setText(`${Math.floor(dist/10)}m`);
    this.objectiveDistanceText.setVisible(true);
  }

  showDialog(title, body, duration, avatarKey) {
    if (this.dialogTypewriter) {
      this.dialogTypewriter.remove(false);
    }
    this.isDialogActive = true;
    this.dialogReadyToClose = false;
    this.dialogSkipped = false;
    this.dialogBody = body;
    this.dialogResponsesVisible = false;
    
    const targets = [this.dialogPanel, this.dialogTitle, this.dialogText, this.dialogPortrait, this.dialogPortraitFrame].filter(Boolean);
    
    // Draw panel
    this.dialogPanel.clear();
    this.dialogPanel.fillStyle(0x1a2a32, 0.92);
    this.dialogPanel.fillRoundedRect(70, 420, 720, 155, 8);
    this.dialogPanel.lineStyle(2, 0xe2c36f, 0.85);
    this.dialogPanel.strokeRoundedRect(70, 420, 720, 155, 8);
    
    // Draw portrait frame
    this.dialogPortraitFrame.clear();
    this.dialogPortraitFrame.fillStyle(0x2a1e1a, 0.95);
    this.dialogPortraitFrame.fillRoundedRect(85, 440, 80, 80, 6);
    this.dialogPortraitFrame.lineStyle(2, 0xffd700, 0.9);
    this.dialogPortraitFrame.strokeRoundedRect(85, 440, 80, 80, 6);
    
    // Set portrait
    if (avatarKey && this.textures.exists(avatarKey)) {
      this.dialogPortrait.setTexture(avatarKey).setPosition(125, 480).setScale(1.1);
    }
    
    this.dialogTitle.setText(title);
    this.dialogText.setText('');
    this.hideDialogResponses();

    this.tweens.killTweensOf(targets);
    targets.forEach((target) => target.setVisible(true).setAlpha(0));
    this.tweens.add({
      targets,
      alpha: 1,
      duration: 180,
      ease: 'Sine.easeOut',
    });
    
    let charIndex = 0;
    this.dialogTypewriter = this.time.addEvent({
      delay: 30,
      repeat: body.length - 1,
      callback: () => {
        if (this.dialogSkipped) return;
        this.dialogText.setText(body.substring(0, charIndex + 1));
        if (charIndex % 4 === 0) this.sfx.click();
        charIndex++;
        if (charIndex >= body.length) {
          this.dialogReadyToClose = true;
          // If this is a standalone dialog (no chain), show continue after typewriter
          if (!this.dialogChain) {
            this.time.delayedCall(duration || 4000, () => {
              if (this.isDialogActive && !this.dialogChain) this.closeDialog();
            });
          } else {
            this.showDialogActions();
          }
        }
      }
    });
  }

  closeDialog() {
    this.isDialogActive = false;
    this.dialogChain = null;
    this.dialogOnComplete = null;
    this.dialogResponsesVisible = false;
    const targets = [this.dialogPanel, this.dialogTitle, this.dialogText, this.dialogPortrait, this.dialogPortraitFrame,
      this.dialogResponse1Bg, this.dialogResponse1Text, this.dialogResponse2Bg, this.dialogResponse2Text, this.dialogContinue].filter(Boolean);
    this.tweens.add({
      targets,
      alpha: 0,
      duration: 300,
      ease: 'Sine.easeIn',
      onComplete: () => targets.forEach((target) => target.setVisible(false)),
    });
  }

  updateUi() {
    this.hudPanel.clear();
    this.hudPanel.fillStyle(0x2a1e1a, 0.85);
    this.hudPanel.fillRoundedRect(16, 156, 310, 160, 6);
    this.hudPanel.lineStyle(2, 0xb4885e, 0.9);
    this.hudPanel.strokeRoundedRect(16, 156, 310, 160, 6);

    const panelHeight = this.questPanelHeight || 145;
    this.questPanel.clear();
    this.questPanel.fillStyle(0xf1dfad, 0.92);
    this.questPanel.fillRoundedRect(740, 20, 210, panelHeight, 6);
    this.questPanel.lineStyle(3, 0x6b4b31, 0.82);
    this.questPanel.strokeRoundedRect(740, 20, 210, panelHeight, 6);

    const remaining = this.totalEnemyCount();
    const phaseLabel = this.getPhaseLabel();
    const currentChapter = this.questState.currentChapter;
    this.waveText.setText(`BAB ${currentChapter} - ${phaseLabel}   MUSUH ${remaining}`);
    
    this.goldText.setText(`${this.stats.gold}`);
    this.woodText.setText(`${this.stats.wood}`);
    this.statsText.setText(`BUNUH ${this.stats.kills}   SERANGAN ${this.stats.playerDamage}`);

    this.drawBar(this.playerHpBar, 26, 218, 135, 14, this.stats.playerHp, this.stats.playerMaxHp, 0xd94f4f, 'HP');
    this.drawBar(this.castleHpBar, 176, 218, 135, 14, this.stats.castleHp, this.stats.castleMaxHp, 0x64b5f6, 'KASTIL');
    if (this.questState.currentChapter === 10 || this.stats.wave >= 10 || this.stats.phase === 'final' || this.stats.phase === 'counter') {
      this.drawBar(this.baseHpBar, 756, 126, 158, 12, this.stats.baseHp, this.stats.baseMaxHp, 0xff675f, 'MARKAS');
    } else {
      this.baseHpBar.clear();
    }

    // Sync castle world HP bar every frame
    this.syncCastleWorldHpBar();

    const showUpgrades = this.canUpgrade() && !this.gameEnded;
    this.upgradePanel.clear();
    this.upgradePanel.setVisible(showUpgrades);
    
    this.upgradeButtons.forEach(({ bg, text }) => {
      bg.setVisible(showUpgrades);
      text.setVisible(showUpgrades);
    });

    if (!this.skillIcons) {
      const fixed = (obj) => { obj.setScrollFactor(0).setDepth(10001); if (this.uiElements) this.uiElements.push(obj); return obj; };
      this.skillIcons = [
        fixed(this.add.sprite(48, 360, 'ui-icon-03').setScale(0.8)),
        fixed(this.add.sprite(48, 430, 'ui-icon-01').setScale(0.8)),
        fixed(this.add.sprite(48, 500, 'ui-icon-08').setScale(0.8))
      ];
      this.skillTexts = [
        fixed(this.add.text(38, 350, '1', { fontSize: '18px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000', strokeThickness: 3 })),
        fixed(this.add.text(38, 420, '2', { fontSize: '18px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000', strokeThickness: 3 })),
        fixed(this.add.text(38, 490, '3', { fontSize: '18px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000', strokeThickness: 3 }))
      ];
    }
    
    const now = this.time.now;
    const skills = [
      { key: 'whirlwind', color: 0x00aaff },
      { key: 'dash', color: 0x00aaff },
      { key: 'heal', color: 0x00ff00 }
    ];
    skills.forEach((skill, i) => {
      const s = this.skills[skill.key];
      const ready = now >= s.readyAt;
      const ratio = ready ? 1 : Phaser.Math.Clamp(1 - ((s.readyAt - now) / s.cooldown), 0, 1);
      
      const cy = 360 + i * 70;
      const cx = 48;
      
      this.hudPanel.fillStyle(0x17242c, 0.9);
      this.hudPanel.fillRoundedRect(cx - 28, cy - 28, 56, 56, 8);
      
      this.hudPanel.fillStyle(skill.color, ready ? 0.6 : 0.1);
      this.hudPanel.fillRoundedRect(cx - 28, cy - 28 + 56 * (1 - ratio), 56, 56 * ratio, 8);
      
      this.hudPanel.lineStyle(2, ready ? 0xffffff : 0x555555, 1);
      this.hudPanel.strokeRoundedRect(cx - 28, cy - 28, 56, 56, 8);
      
      this.skillIcons[i].setAlpha(ready ? 1 : 0.4);
      this.skillTexts[i].setAlpha(ready ? 1 : 0.4);
    });
  }

  getPhaseLabel() {
    if (this.stats.phase === 'quest') {
      return 'MISI';
    }
    if (this.stats.phase === 'intro') {
      return 'PERKENALAN';
    }
    if (this.stats.phase === 'waiting') {
      return 'PERSIAPAN';
    }
    if (this.stats.phase === 'counter') {
      return 'SERANGAN BALIK';
    }
    if (this.stats.phase === 'final') {
      return 'HANCURKAN MARKAS';
    }
    return `GELOMBANG ${this.stats.wave}/${this.stats.maxWaves}`;
  }

  drawBar(graphics, x, y, width, height, value, max, color, label) {
    const ratio = Phaser.Math.Clamp(value / max, 0, 1);
    graphics.clear();
    graphics.fillStyle(0x17232c, 0.95);
    graphics.fillRoundedRect(x, y, width, height, 4);
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(x + 3, y + 3, Math.max(0, (width - 6) * ratio), height - 6, 3);
    graphics.lineStyle(2, 0xffe0a3, 0.82);
    graphics.strokeRoundedRect(x, y, width, height, 4);
    if (!graphics.labelText) {
      graphics.labelText = this.add.text(x, y - 17, '', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '11px',
        color: '#fff5c7',
        stroke: '#20313b',
        strokeThickness: 3,
      }).setScrollFactor(0).setDepth(10001);
    }
    graphics.labelText.setPosition(x, y - 17).setText(`${label} ${value}/${max}`);
  }

  syncGuardHp(guard) {
    if (!guard.hpBar || !guard.hpBarBack) {
      return;
    }
    const ratio = Phaser.Math.Clamp(guard.ai.health / guard.ai.maxHealth, 0, 1);
    const y = guard.y - 42;
    guard.hpBarBack.setPosition(guard.x, y).setDepth(guard.y + 1);
    guard.hpBar.setPosition(guard.x - (30 * (1 - ratio)) / 2, y)
      .setDisplaySize(30 * ratio, 4)
      .setDepth(guard.y + 2);
  }

  syncEnemyHp(enemy) {
    if (!enemy.hpBar || !enemy.hpBarBack) {
      return;
    }
    const ratio = Phaser.Math.Clamp(enemy.ai.health / enemy.ai.maxHealth, 0, 1);
    const y = enemy.y - (enemy.ai.kind === 'boss' ? 58 : 42);
    enemy.hpBarBack.setPosition(enemy.x, y).setDepth(enemy.y + 1);
    enemy.hpBar.setPosition(enemy.x - (40 * (1 - ratio)) / 2, y)
      .setDisplaySize(40 * ratio, 5)
      .setDepth(enemy.y + 2);
  }

  syncCastleWorldHpBar() {
    if (!this.castleWorldHpBar || !this.castleWorldHpBarBack) return;
    const ratio = Phaser.Math.Clamp(this.stats.castleHp / this.stats.castleMaxHp, 0, 1);
    const fullWidth = 96;
    const barWidth = Math.max(0, fullWidth * ratio);
    this.castleWorldHpBar.setDisplaySize(barWidth, 8);
    this.castleWorldHpBar.setPosition(
      this.castleAttackPoint.x - (fullWidth - barWidth) / 2,
      this.castleWorldHpBar.y
    );
    // Color shift: blue → yellow → red based on HP ratio
    if (ratio > 0.6) {
      this.castleWorldHpBar.setFillStyle(0x64b5f6);
    } else if (ratio > 0.3) {
      this.castleWorldHpBar.setFillStyle(0xffc107);
    } else {
      this.castleWorldHpBar.setFillStyle(0xe74f4f);
    }
    // Update label
    if (this.castleWorldHpLabel) {
      this.castleWorldHpLabel.setText(`KASTIL ${this.stats.castleHp}/${this.stats.castleMaxHp}`);
    }
  }

  teleportEnemyTowardTarget(enemy, target) {
    // Find a safe reachable tile that's between enemy and target
    const enemyTile = this.worldToTile(enemy.x, enemy.y);
    const targetTile = this.worldToTile(target.x, target.y);
    
    // Try midpoint first, then closer to target
    const candidates = [
      { x: Math.round((enemyTile.x + targetTile.x) / 2), y: Math.round((enemyTile.y + targetTile.y) / 2) },
      { x: Math.round(enemyTile.x + (targetTile.x - enemyTile.x) * 0.7), y: Math.round(enemyTile.y + (targetTile.y - enemyTile.y) * 0.7) },
      { x: targetTile.x + 2, y: targetTile.y + 2 },
      { x: targetTile.x - 2, y: targetTile.y + 2 },
      { x: targetTile.x, y: targetTile.y + 3 },
    ];
    
    for (const candidate of candidates) {
      const safeTile = this.findSafeTile(candidate.x, candidate.y, 8, { reachableOnly: true });
      if (safeTile && this.isSafeTile(safeTile.x, safeTile.y)) {
        const worldPos = this.tileToWorld(safeTile.x, safeTile.y);
        enemy.body.reset(worldPos.x, worldPos.y);
        enemy.ai.lastSafePosition.set(worldPos.x, worldPos.y);
        enemy.ai.path = [];
        enemy.ai.pathTargetKey = null;
        this.spawnImpact(worldPos.x, worldPos.y, 0.25);
        return;
      }
    }
    
    // Absolute fallback: just kill the stuck enemy
    this.forceKillStuckEnemy(enemy);
  }

  forceKillStuckEnemy(enemy) {
    if (!enemy?.active) return;
    // Give partial rewards
    this.stats.gold += Math.ceil(enemy.ai.rewardGold / 2);
    this.stats.wood += Math.ceil(enemy.ai.rewardWood / 2);
    this.stats.kills += 1;
    
    const boom = this.add.sprite(enemy.x, enemy.y, 'explosion')
      .setScale(0.3)
      .setDepth(enemy.y + 40)
      .play('explode');
    boom.once('animationcomplete', () => boom.destroy());
    
    enemy.hpBar?.destroy();
    enemy.hpBarBack?.destroy();
    enemy.destroy();
  }

  forceKillAllStuckWaveEnemies() {
    const stuckEnemies = [];
    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active || !enemy.ai.waveEnemy) return;
      // Check if enemy velocity is near zero (stuck)
      const speed = Math.abs(enemy.body.velocity.x) + Math.abs(enemy.body.velocity.y);
      if (speed < 5) {
        stuckEnemies.push(enemy);
      }
    });
    
    stuckEnemies.forEach((enemy) => {
      this.forceKillStuckEnemy(enemy);
    });
    
    if (stuckEnemies.length > 0) {
      this.spawnFloatingText(this.player.x, this.player.y - 60, `${stuckEnemies.length} musuh macet dihapus!`, '#ffaa00');
    }
  }

  spawnImpact(x, y, scale = 0.42) {
    const fx = this.add.sprite(x, y, 'explosion')
      .setScale(scale)
      .setDepth(y + 40)
      .play('explode');
    fx.once('animationcomplete', () => fx.destroy());
  }

  spawnCollectFx(x, y) {
    const fx = this.add.sprite(x, y, 'dust')
      .setScale(0.58)
      .setDepth(y + 30)
      .play('dust-puff');
    fx.once('animationcomplete', () => fx.destroy());
  }

  spawnFloatingText(x, y, text, color = '#fff1a8') {
    const label = this.add.text(x, y, text, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '15px',
      color,
      stroke: '#17242c',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(y + 220);

    this.tweens.add({
      targets: label,
      y: y - 28,
      alpha: 0,
      duration: 760,
      ease: 'Sine.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  endGame(result, reason = '') {
    if (this.gameEnded) {
      return;
    }
    this.gameEnded = true;
    this.player.setVelocity(0, 0);
    this.enemies.children.iterate((enemy) => enemy?.active && enemy.setVelocity(0, 0));
    this.time.delayedCall(result === 'win' ? 650 : 450, () => {
      this.scene.start('EndScene', {
        result,
        reason,
        stats: { ...this.stats },
      });
    });
  }

  getActorHitRect(actor, padding = 0) {
    if (actor.body) {
      return new Phaser.Geom.Rectangle(
        actor.body.x - padding,
        actor.body.y - padding,
        actor.body.width + padding * 2,
        actor.body.height + padding * 2,
      );
    }
    const bounds = actor.getBounds();
    return new Phaser.Geom.Rectangle(
      bounds.x - padding,
      bounds.y - padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2,
    );
  }

  getActorRunAnim(actor) {
    if (actor.ai?.kind) {
      return this.getEnemyAnim(actor.ai.kind, 'run');
    }
    return 'blue-run';
  }

  getActorIdleAnim(actor) {
    if (actor.ai?.kind) {
      return this.getEnemyAnim(actor.ai.kind, 'idle');
    }
    return 'blue-idle';
  }

  getEnemyAnim(kind, state) {
    if (kind === 'boss') {
      return `black-lancer-${state === 'attack' ? 'attack' : state}`;
    }
    if (kind === 'archer') {
      return state === 'attack' ? 'red-archer-shoot' : `red-archer-${state}`;
    }
    return `red-warrior-${state}`;
  }

  keepActorInsideWalkableArea(actor, lastSafePosition) {
    if (!actor?.body || !lastSafePosition) {
      return;
    }
    if (this.isBodyOnSafeTiles(actor.body)) {
      lastSafePosition.set(actor.x, actor.y);
      return;
    }
    actor.body.reset(lastSafePosition.x, lastSafePosition.y);
    actor.setVelocity(0, 0);
  }

  isBodyOnSafeTiles(body) {
    const centerX = body.x + body.width / 2;
    const footY = body.y + body.height - Math.min(6, body.height * 0.12);
    return this.isWorldPointSafe(centerX, footY);
  }

  isWorldPointSafe(worldX, worldY) {
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);
    return this.isSafeTile(tileX, tileY);
  }

  createLoopingSplash(tileX, tileY, delay) {
    const pos = this.tileToWorld(tileX, tileY);
    const splash = this.add.sprite(pos.x, pos.y, 'water-splash')
      .setScale(0.36)
      .setDepth(pos.y - 20)
      .setVisible(false);

    const play = () => {
      splash.setVisible(true).play('water-splash');
      splash.once('animationcomplete', () => splash.setVisible(false));
    };

    this.time.delayedCall(delay, () => {
      play();
      this.time.addEvent({ delay: 3400, callback: play, loop: true });
    });
  }

  addStaticBox(group, tileX, tileY, width, height, offsetX = 0, offsetY = 0, visible = false) {
    const x = tileX * TILE_SIZE + TILE_SIZE / 2 + offsetX;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2 + offsetY;
    const box = this.add.rectangle(x, y, width, height, 0xff0000, visible ? 0.35 : 0).setVisible(visible);
    this.physics.add.existing(box, true);
    group.add(box);
    return box;
  }

  findPointWorld(name, radius = 5, reachableOnly = true) {
    const object = this.map.getObjectLayer('GameObjects')?.objects.find((entry) => entry.name === name);
    if (object) {
      const tile = this.worldToTile(object.x, object.y);
      if (reachableOnly) {
        return this.findSafeWorld(tile.x, tile.y, radius, { reachableOnly: Boolean(this.reachableTiles) });
      }
      return { x: object.x, y: object.y };
    }
    const tile = OBJECT_FALLBACKS[name] || OBJECT_FALLBACKS.player_spawn;
    return reachableOnly ? this.findSafeWorld(tile[0], tile[1], radius) : this.tileToWorld(tile[0], tile[1]);
  }

  tileToWorld(tileX, tileY) {
    return {
      x: tileX * TILE_SIZE + TILE_SIZE / 2,
      y: tileY * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  worldToTile(worldX, worldY) {
    return {
      x: Math.floor(worldX / TILE_SIZE),
      y: Math.floor(worldY / TILE_SIZE),
    };
  }

  buildReachableTilesFrom(worldX, worldY) {
    const start = this.worldToTile(worldX, worldY);
    const safeStart = this.findSafeTile(start.x, start.y, 8, { reachableOnly: false });
    this.reachableTiles = new Set();
    if (!this.isSafeTile(safeStart.x, safeStart.y)) {
      return;
    }

    const queue = [safeStart];
    this.reachableTiles.add(this.tileKey(safeStart.x, safeStart.y));
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      NAV_DIRECTIONS.forEach(([dx, dy]) => {
        const nextX = current.x + dx;
        const nextY = current.y + dy;
        const key = this.tileKey(nextX, nextY);
        if (!this.isSafeTile(nextX, nextY) || this.reachableTiles.has(key)) {
          return;
        }
        this.reachableTiles.add(key);
        queue.push({ x: nextX, y: nextY });
      });
    }
  }

  isReachableTile(tileX, tileY) {
    return !this.reachableTiles || this.reachableTiles.has(this.tileKey(tileX, tileY));
  }

  findSafeWorld(tileX, tileY, radius = 5, options = {}) {
    const tile = this.findSafeTile(tileX, tileY, radius, {
      reachableOnly: options.reachableOnly ?? Boolean(this.reachableTiles),
    });
    return this.tileToWorld(tile.x, tile.y);
  }

  findSafeTile(tileX, tileY, radius = 5, options = {}) {
    const reachableOnly = Boolean(options.reachableOnly);
    const preferredX = Phaser.Math.Clamp(tileX, 0, this.map.width - 1);
    const preferredY = Phaser.Math.Clamp(tileY, 0, this.map.height - 1);
    const isCandidate = (x, y) => this.isSafeTile(x, y) && (!reachableOnly || this.isReachableTile(x, y));

    if (isCandidate(preferredX, preferredY)) {
      return { x: preferredX, y: preferredY };
    }

    for (let r = 1; r <= radius; r += 1) {
      let best = null;
      let bestScore = Infinity;
      for (let y = preferredY - r; y <= preferredY + r; y += 1) {
        for (let x = preferredX - r; x <= preferredX + r; x += 1) {
          if (!isCandidate(x, y)) {
            continue;
          }
          const score = ((x - preferredX) ** 2) + ((y - preferredY) ** 2);
          if (score < bestScore) {
            best = { x, y };
            bestScore = score;
          }
        }
      }
      if (best) {
        return best;
      }
    }

    let globalBest = null;
    let globalBestScore = Infinity;
    for (let y = 0; y < this.map.height; y += 1) {
      for (let x = 0; x < this.map.width; x += 1) {
        if (!isCandidate(x, y)) {
          continue;
        }
        const score = ((x - preferredX) ** 2) + ((y - preferredY) ** 2);
        if (score < globalBestScore) {
          globalBest = { x, y };
          globalBestScore = score;
        }
      }
    }
    return globalBest || { x: preferredX, y: preferredY };
  }

  findPathTiles(startTile, goalTile) {
    if (!this.isSafeTile(startTile.x, startTile.y) || !this.isSafeTile(goalTile.x, goalTile.y)) {
      return [];
    }

    const startKey = this.tileKey(startTile.x, startTile.y);
    const goalKey = this.tileKey(goalTile.x, goalTile.y);
    if (startKey === goalKey) {
      return [];
    }

    const queue = [startTile];
    const cameFrom = new Map([[startKey, null]]);

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      const neighbors = NAV_DIRECTIONS
        .map(([dx, dy]) => ({ x: current.x + dx, y: current.y + dy }))
        .filter((tile) => this.isSafeTile(tile.x, tile.y) && this.isReachableTile(tile.x, tile.y))
        .sort((a, b) => {
          const distanceA = ((a.x - goalTile.x) ** 2) + ((a.y - goalTile.y) ** 2);
          const distanceB = ((b.x - goalTile.x) ** 2) + ((b.y - goalTile.y) ** 2);
          return distanceA - distanceB;
        });

      for (const next of neighbors) {
        const key = this.tileKey(next.x, next.y);
        if (cameFrom.has(key)) {
          continue;
        }
        cameFrom.set(key, this.tileKey(current.x, current.y));
        if (key === goalKey) {
          return this.reconstructPath(cameFrom, startKey, goalKey);
        }
        queue.push(next);
      }
    }

    return [];
  }

  reconstructPath(cameFrom, startKey, goalKey) {
    const path = [];
    let currentKey = goalKey;
    while (currentKey && currentKey !== startKey) {
      const [x, y] = currentKey.split(',').map(Number);
      path.push({ x, y });
      currentKey = cameFrom.get(currentKey);
    }
    return path.reverse();
  }

  hasLineOfSight(source, target) {
    const distance = Phaser.Math.Distance.Between(source.x, source.y, target.x, target.y);
    const steps = Math.max(1, Math.ceil(distance / (TILE_SIZE / 2)));
    for (let index = 1; index < steps; index += 1) {
      const t = index / steps;
      const x = Phaser.Math.Linear(source.x, target.x, t);
      const y = Phaser.Math.Linear(source.y, target.y, t);
      if (!this.isWorldPointSafe(x, y)) {
        return false;
      }
    }
    return true;
  }

  isSafeTile(tileX, tileY) {
    if (tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) {
      return false;
    }
    return this.isBaseWalkableTile(tileX, tileY) && !this.solidTiles.has(this.tileKey(tileX, tileY));
  }

  isBaseWalkableTile(tileX, tileY) {
    // Sesuai permintaan Anda, SAYA TELAH MENGHAPUS SEMUA LOGIKA BARIER DI SINI!
    // Sekarang semua tile di map bisa dilewati 100% tanpa halangan.
    // Kita akan membangun ulang logika bariernya dari nol setelah Anda memberikan instruksi (briefing).
    return true;
  }

  isLogicWalkableTile(tileX, tileY) {
    return Boolean(this.layers[LOGIC_WALKABLE_LAYER]?.getTileAt(tileX, tileY));
  }

  isLogicBlockedTile(tileX, tileY) {
    return Boolean(this.layers[LOGIC_BLOCKER_LAYER]?.getTileAt(tileX, tileY));
  }

  isWalkableGroundGid(gid) {
    return gid > 0 && gid < 176 && !BLOCKED_GROUND_GIDS.has(gid);
  }

  isBridgeGid(gid) {
    return (gid >= BRIDGE_RANGE[0] && gid <= BRIDGE_RANGE[1]) || (gid >= 273 && gid <= 284) || (gid >= 360 && gid <= 368);
  }

  hasBridgeAt(tileX, tileY) {
    return BRIDGE_LAYERS.some((layerName) => {
      const tile = this.layers[layerName]?.getTileAt(tileX, tileY);
      return Boolean(tile && this.isBridgeGid(tile.index));
    });
  }

  tileKey(tileX, tileY) {
    return `${tileX},${tileY}`;
  }

  // === QUEST SYSTEM METHODS ===

  playDialogChain(chain, onComplete) {
    this.dialogChain = chain;
    this.dialogChainIndex = 0;
    this.dialogOnComplete = onComplete || null;
    this.showChainStep(0);
  }

  showChainStep(index) {
    if (!this.dialogChain || index >= this.dialogChain.length) {
      // Chain finished
      const cb = this.dialogOnComplete;
      this.closeDialog();
      if (cb) {
        cb();
      }
      return;
    }
    const step = this.dialogChain[index];
    this.dialogChainIndex = index;
    
    // Find NPC data for avatar
    const npcData = NPCS.find(n => n.id === step.speaker);
    const avatarKey = npcData ? npcData.avatar : 'avatar-01';
    const speakerName = npcData ? npcData.name : step.speaker;
    
    // Store responses for this step
    this.currentDialogResponses = step.responses || null;
    
    this.showDialog(speakerName, step.text, null, avatarKey);
  }

  advanceDialogChain() {
    if (this.dialogChain) {
      this.showChainStep(this.dialogChainIndex + 1);
    } else {
      this.closeDialog();
    }
  }

  showDialogActions() {
    if (!this.dialogChain) return;
    const step = this.dialogChain[this.dialogChainIndex];
    if (step && step.responses && step.responses.length >= 2) {
      // Show response buttons
      this.dialogResponsesVisible = true;
      this.dialogResponse1Text.setText(step.responses[0]);
      this.dialogResponse2Text.setText(step.responses[1]);
      [this.dialogResponse1Bg, this.dialogResponse1Text, this.dialogResponse2Bg, this.dialogResponse2Text].forEach(el => {
        el.setVisible(true).setAlpha(1);
      });
      this.dialogContinue.setVisible(false);
    } else {
      // Show continue button
      this.dialogResponsesVisible = false;
      this.dialogContinue.setVisible(true).setAlpha(1);
    }
  }

  handleDialogResponse(responseIndex) {
    this.sfx.click();
    this.hideDialogResponses();
    this.dialogResponsesVisible = false;
    // Advance to next step in chain
    this.advanceDialogChain();
  }

  hideDialogResponses() {
    [this.dialogResponse1Bg, this.dialogResponse1Text, this.dialogResponse2Bg, this.dialogResponse2Text, this.dialogContinue].forEach(el => {
      if (el) el.setVisible(false).setAlpha(0);
    });
    this.dialogResponsesVisible = false;
  }

  completeSubQuest() {
    const chapter = CHAPTER_QUESTS[this.questState.currentChapter - 1];
    if (!chapter) return;
    
    const completedQuest = chapter.subQuests[this.questState.subQuestProgress];
    this.questState.subQuestProgress += 1;
    
    // Show completion floating text
    this.spawnFloatingText(this.player.x, this.player.y - 70, `[SELESAI] ${completedQuest.title}`, '#ffd700');
    
    // Check if all sub-quests are done
    if (this.questState.subQuestProgress >= chapter.subQuests.length) {
      this.questState.mainQuestReady = true;
      this.spawnFloatingText(this.player.x, this.player.y - 90, '[ MISI UTAMA TERBUKA ]', '#ff8800');
    }
    
    this.updateQuestTracker();
    this.updateQuestMarkers();
  }

  updateQuestTracker() {
    const chapter = CHAPTER_QUESTS[this.questState.currentChapter - 1];
    if (!chapter) return;
    
    this.questChapterText.setText(chapter.title);
    
    const lockIcon = this.questState.mainQuestReady ? '[*]' : '[Terkunci]';
    this.questMainText.setText(`${lockIcon} ${chapter.mainQuest.title}`);
    this.questMainText.setColor(this.questState.mainQuestReady ? '#2d6a1e' : '#8b4513');
    
    // Sub-quest list
    let currentY = 72;
    for (let i = 0; i < 3; i++) {
      if (i < chapter.subQuests.length) {
        const sq = chapter.subQuests[i];
        const done = i < this.questState.subQuestProgress;
        const active = i === this.questState.subQuestProgress && !this.questState.mainQuestReady;
        const icon = done ? '[X]' : (active ? ' >' : '[ ]');
        this.questSubTexts[i].setText(`${icon} ${sq.title}`);
        this.questSubTexts[i].setColor(done ? '#4a7c59' : (active ? '#1a5276' : '#888888'));
        this.questSubTexts[i].setPosition(756, currentY);
        this.questSubTexts[i].setVisible(true);
        currentY += this.questSubTexts[i].height + 6;
      } else {
        this.questSubTexts[i].setVisible(false);
      }
    }
    
    // Navigation hint
    currentY += 4;
    this.questNavText.setPosition(756, currentY);
    if (this.questState.mainQuestReady) {
      const triggerNpc = NPCS.find(n => n.id === chapter.mainQuest.triggerNpc);
      this.questNavText.setText(`Lokasi: ${triggerNpc ? triggerNpc.name : 'Tetua Desa'}`);
    } else {
      const activeQuest = chapter.subQuests[this.questState.subQuestProgress];
      this.questNavText.setText(activeQuest ? `Lokasi: ${activeQuest.hint}` : '');
    }
    
    // Update panel height
    this.questPanelHeight = Math.max(145, currentY - 20 + this.questNavText.height + 14);
  }

  updateQuestMarkers() {
    const chapter = CHAPTER_QUESTS[this.questState.currentChapter - 1];
    
    this.npcs.forEach((npc) => {
      // Hide all markers first
      npc.questMarker.setVisible(false);
      
      if (this.stats.phase !== 'quest' || !chapter) return;
      
      if (this.questState.mainQuestReady) {
        // Show marker on main quest trigger NPC
        if (npc.npcData.id === chapter.mainQuest.triggerNpc) {
          npc.questMarker.setVisible(true);
          npc.questMarker.setText('*');
        }
      } else {
        // Show marker on active sub-quest NPC
        const activeQuest = chapter.subQuests[this.questState.subQuestProgress];
        if (activeQuest && npc.npcData.id === activeQuest.npc) {
          npc.questMarker.setVisible(true);
          npc.questMarker.setText('!');
        }
      }
    });
  }
}
