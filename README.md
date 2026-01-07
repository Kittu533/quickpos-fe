# QuickPOS Frontend

Aplikasi Point of Sale (POS) modern berbasis web yang dibangun dengan Next.js 16 dan React 19.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand
- **Form Handling:** React Hook Form + Zod
- **UI Components:** Radix UI
- **Charts:** ApexCharts
- **HTTP Client:** Axios
- **Icons:** Lucide React

## Fitur

- 🔐 Autentikasi & manajemen user
- 🛒 Point of Sale (kasir)
- 📦 Manajemen produk
- 👥 Manajemen pelanggan
- 💳 Integrasi pembayaran (Midtrans)
- 📊 Dashboard & laporan
- ⏰ Manajemen shift kasir
- 📈 Riwayat transaksi

## Struktur Project

```
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Route group untuk halaman dashboard
│   │   ├── customers/      # Manajemen pelanggan
│   │   ├── dashboard/      # Halaman dashboard
│   │   ├── pos/            # Point of Sale
│   │   ├── products/       # Manajemen produk
│   │   ├── reports/        # Laporan
│   │   ├── shifts/         # Manajemen shift
│   │   ├── transactions/   # Riwayat transaksi
│   │   └── users/          # Manajemen user
│   ├── login/              # Halaman login
│   └── payment/            # Halaman pembayaran
├── components/             # Komponen React
│   ├── layout/             # Komponen layout (Sidebar, Header)
│   ├── ui/                 # Komponen UI reusable
│   ├── charts/             # Komponen chart
│   └── payment/            # Komponen pembayaran
├── lib/                    # Utility & API
├── stores/                 # Zustand stores
└── public/                 # Asset statis
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm / bun

### Instalasi

```bash
# Clone repository
git clone <repository-url>
cd quickpos-fe

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env sesuai konfigurasi
```

### Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Build Production

```bash
npm run build
npm start
```

## Environment Variables

Buat file `.env` dengan konfigurasi berikut:

```env
NEXT_PUBLIC_API_URL=<backend-api-url>
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=<midtrans-client-key>
```

## Scripts

- `npm run dev` - Jalankan development server
- `npm run build` - Build untuk production
- `npm run start` - Jalankan production server
- `npm run lint` - Jalankan ESLint
