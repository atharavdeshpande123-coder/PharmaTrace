# PharmaTrace

**Blockchain-Based Pharmaceutical Drug Authentication and Supply Chain Tracking System**

> Trust Every Dose. Verify pharmaceutical authenticity and trace every drug batch through a transparent blockchain-powered supply chain.

PharmaTrace is a complete, runnable, demonstrable academic mini-project that combines a futuristic Web3 pharmaceutical platform with a real educational blockchain ledger (SHA-256 hash-linked blocks persisted to SQLite). It is built so a college student can run it on a normal laptop with a single command, while keeping the architecture ready for a real Hyperledger Fabric integration.

---

## ✨ Features

- 🔐 **JWT + bcrypt authentication** with 6 roles (Manufacturer, Distributor, Wholesaler, Pharmacy, Admin, Customer)
- 💊 **Drug batch registration** with unique QR token generation + downloadable QR code (PNG data URL)
- 📷 **QR scanning** via browser camera (jsQR) + manual entry + image upload — never mandatory
- ✅ **Verification flow** with 7-step animated blockchain query → AUTHENTIC / NOT FOUND / FLAGGED / EXPIRED result panels
- 🚚 **Supply-chain tracking** with animated timeline (Manufacturer → Distributor → Wholesaler → Pharmacy → Customer)
- 📦 **Transfer / receive / dispense** flows enforced by a smart-contract layer (only current owner can transfer, expired/flagged batches blocked)
- 🔗 **Blockchain explorer** — inspect every block (hash, previous hash, nonce, merkle root, transactions) + "Verify Chain Integrity" button that recomputes every hash
- 📊 **Analytics dashboard** with 5 Recharts visualizations (verifications over time, supply-chain activity, by-result pie, by-status bar, by-type horizontal bar)
- 🔔 **Notification system** with unread badge + dropdown
- 🌑 **Dark futuristic Web3 theme** — glassmorphism cards, glowing borders, animated particles, grid pattern, scan-line animation, ping rings, shimmer skeletons
- 📱 **Responsive** — desktop nav, mobile bottom tab bar, mobile-friendly verify page
- ♿ **Accessible** — semantic HTML, ARIA, keyboard navigation, focus states, color + text status indicators

---

## 🧱 Technology Stack

| Layer | Technology |
|------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons + Framer Motion |
| Database | Prisma ORM + SQLite |
| Auth | JWT (jsonwebtoken) + bcryptjs, httpOnly cookie |
| Blockchain | Custom local SHA-256 hash-linked ledger (ready for Hyperledger Fabric) |
| QR | qrcode (server PNG generation) + jsqr (client camera/image decoding) |
| Charts | Recharts |
| State | Zustand (client) |

---

## 🚀 Quick Start

```bash
# install dependencies
bun install

# set up the database (schema already defined in prisma/schema.prisma)
bun run db:push

# seed realistic demo data (10 users, 12 drug batches, 53+ transactions)
bun run prisma/seed.ts

# start the dev server (http://localhost:3000)
bun run dev
```

Open the **Preview Panel** to view the app (or click "Open in New Tab").

---

## 🔑 Demo Credentials

All demo accounts use the password **`demo1234`**.

| Role | Email |
|------|-------|
| Admin | `admin@pharmatrace.demo` |
| Manufacturer | `manufacturer@pharmatrace.demo` |
| Distributor | `distributor@pharmatrace.demo` |
| Pharmacy | `pharmacy@pharmatrace.demo` |
| Customer | `customer@pharmatrace.demo` |

Additional seeded accounts: `manufacturer2@`, `manufacturer3@`, `distributor2@`, `wholesaler@`, `pharmacy2@`.

---

## 🗺️ Application Map

The app is rendered as a single Next.js page (`/`) with client-side view switching. Navigation is provided by the top navbar (desktop) and a bottom tab bar (mobile).

| View | What it shows |
|------|---------------|
| **Landing** | Hero, animated supply-chain flow, 4 live stats, feature cards, "Why blockchain" explainer, architecture diagram, CTA |
| **Dashboard** | Blockchain status strip (CONNECTED / VERIFIED / last block), 6 stat cards (+ 4 admin cards), recent transactions/verifications/drugs tables |
| **Verify Drug** | Camera scan / manual entry / image upload → 7-step animation → AUTHENTIC/NOT_FOUND/FLAGGED/EXPIRED result with checks list + drug details |
| **Register Drug** | Full drug-batch form → success screen with QR code (download/print/copy) |
| **Supply Chain** | Flow legend + searchable list of batches with their current stage |
| **Blockchain** | Chain visualization (12 latest blocks), full block list with hash/nonce/merkle, Verify Integrity button |
| **Block Detail** | Single block: number, timestamp, hash, previous hash, nonce, merkle root, embedded transactions |
| **Transactions** | Paginated, searchable, filterable transaction table (by type) |
| **Analytics** | 5 charts: verification activity (Area), supply-chain activity (Line), verifications by result (Pie), drugs by status (Bar), events by type (horizontal Bar) |
| **Drugs** | Searchable card grid of all batches |
| **Drug Detail** | Tabs: Supply Chain Journey timeline, Blockchain Transactions, Verification History, Audit Metadata + QR card + Transfer/Flag actions |
| **Admin** | User management table, role counts, Reseed Demo Data button |
| **About** | Problem/Solution, architecture diagram, research-paper alignment table, academic disclaimer, future scope |
| **Profile** | Account details, role capabilities, quick actions |

---

## 🏗️ Architecture

```
User (browser)
   ↓
Frontend (Next.js App Router, single SPA page)
   ↓
Backend REST API (/api/*)
   ↓
Auth Middleware (JWT + bcrypt + role guards)
   ↓
BlockchainService (src/lib/blockchain/service.ts)
   ├─ createTransaction / createBlock / verifyChainIntegrity
   ↓
SmartContractService (src/lib/blockchain/contracts.ts)
   ├─ registerDrug / transferDrug / receiveDrug / verifyDrug / flagDrug / dispenseDrug
   ↓
BlockchainAdapter (LocalBlockchainAdapter — real SHA-256 hash-linked chain)
   └─ FabricBlockchainAdapter (extension point for production)
   ↓
Prisma + SQLite (Drug, SupplyChainEvent, Transaction, BlockchainBlock, VerificationRecord, Notification, User)
```

### How the blockchain works

- A **genesis block** (block #0) is auto-created on first request.
- Every state-changing operation (register, transfer, receive, verify, flag, dispense) creates a **transaction** and immediately seals it into a new **block**.
- Each block's hash = `SHA256(index | timestamp | merkleRoot | previousHash | nonce)`.
- A simple **proof-of-work** (difficulty 2, hash must start with `00`) is mined for every block.
- The `merkleRoot` summarizes all transactions in the block.
- **Verify Chain Integrity** recomputes every block hash from genesis onward and compares with the stored values — any tampering is detected instantly.

### How QR verification works

- On drug registration, the system generates a unique `drugId` (e.g. `PHARMA-7B25-FD39-C7C3-B9A3`) and a signed `qrToken` = `<drugId>:<HMAC-SHA256(drugId)>`.
- The QR code (PNG data URL) contains **only the qrToken** — no medical data is exposed.
- Scanning the QR (or entering the token/drugId/batch manually) hits `POST /api/verify`, which looks up the drug across `drugId` / `batchNumber` / `serialNumber` / `qrToken` and returns the verification result + checks list.

### How supply-chain tracking works

- Each transfer creates a `DRUG_TRANSFERRED` transaction + a `SupplyChainEvent` row + a new block.
- The receiver acknowledges via `DRUG_RECEIVED`, which creates another transaction + event + block.
- The drug's `currentOwnerId` and `currentLocation` are updated.
- The Supply Chain Journey timeline on the drug detail page renders all events in chronological order.

### How smart-contract logic works

Implemented in `src/lib/blockchain/contracts.ts`, mirroring Hyperledger Fabric chaincode:
- `registerDrug()` — creates the asset, emits DRUG_REGISTERED tx.
- `transferDrug()` — enforces: drug exists, caller is current owner, drug not flagged/dispensed/expired.
- `receiveDrug()` — only the assigned recipient can acknowledge.
- `verifyDrug()` — read-only, never mutates the drug record; emits DRUG_VERIFIED tx for audit.
- `flagDrug()` — admin-only; marks status FLAGGED and blocks future transfers.
- `dispenseDrug()` — pharmacy-only; marks status DISPENSED.

---

## 🗄️ Database Schema

| Model | Key fields |
|-------|-----------|
| `User` | id, email, name, passwordHash, role, organization, location, avatarColor |
| `Drug` | id, drugId (public), drugName, manufacturerName, manufacturerId, batchNumber (unique), serialNumber (unique), manufacturingDate, expiryDate, quantity, status, currentOwnerId, currentLocation, qrToken (unique), registrationBlockNumber |
| `SupplyChainEvent` | drugId, eventType, fromUserId, toUserId, location, quantity, notes, transactionId, blockNumber |
| `Transaction` | transactionHash (unique), drugId, type, fromId, toId, data (JSON), blockNumber |
| `BlockchainBlock` | blockNumber (PK), timestamp, previousHash, hash, nonce, merkleRoot |
| `VerificationRecord` | drugId, query, verificationMethod, result, reason, transactionId, blockNumber, verifierId |
| `Notification` | userId, type, title, message, read |

---

## 📡 API Reference

### Auth
- `POST /api/auth/register` — create account → returns user + sets cookie
- `POST /api/auth/login` — login → returns user + sets cookie
- `GET  /api/auth/me` — current user (null if logged out)
- `POST /api/auth/logout` — clear cookie

### Drugs
- `GET  /api/drugs` — list (search, status filter, role-scoped)
- `POST /api/drugs` — register new batch (manufacturer/admin only)
- `GET  /api/drugs/:id` — full detail (accepts id, drugId, batchNumber, or qrToken)
- `GET  /api/drugs/:id/qr` — QR PNG data URL (public)
- `POST /api/drugs/:id/transfer` — transfer ownership (current owner/admin)
- `POST /api/drugs/:id/receive` — acknowledge receipt (assigned recipient)
- `POST /api/drugs/:id/dispense` — mark dispensed (pharmacy/admin)
- `POST /api/drugs/:id/qr` — flag drug (admin only, body: `{ reason }`)
- `GET  /api/drugs/:id/history` — events + transactions + verifications

### Verification
- `POST /api/verify` — body `{ query, method }` → result + drug + checks
- `GET  /api/verify/:drugId` — public verification (no login)

### Supply Chain
- `GET  /api/supply-chain/:drugId` — timeline of events
- `POST /api/supply-chain/transfer` — alias for transfer

### Blockchain
- `GET  /api/blockchain/blocks` — list blocks (latest first)
- `GET  /api/blockchain/blocks/:number` — single block with transactions
- `GET  /api/blockchain/transactions` — list (search, type filter)
- `GET  /api/blockchain/verify-integrity` — recompute every hash
- `GET  /api/blockchain/stats` — dashboard status strip

### Analytics
- `GET  /api/analytics/dashboard` — all stats + recent activity
- `GET  /api/analytics/verifications` — timeseries + breakdowns
- `GET  /api/analytics/supply-chain` — timeseries + by type/status

### Users / Notifications / Stats / Seed
- `GET  /api/users` / `GET /api/users/:id` — admin only
- `GET  /api/notifications` / `POST /api/notifications` — current user, mark read
- `GET  /api/stats` — public landing-page stats
- `POST /api/seed` — admin reseed endpoint

---

## 🎓 College Demonstration Flow

1. **Login as Manufacturer** (`manufacturer@pharmatrace.demo` / `demo1234`)
2. **Register a new drug batch** → see success screen with QR code, block number, transaction hash
3. **Logout, login as Distributor** (`distributor@pharmatrace.demo`)
4. **Transfer the batch to a Pharmacy** → new block created
5. **Login as Pharmacy** (`pharmacy@pharmatrace.demo`)
6. **Receive the batch**
7. **Open Verify Drug** → enter the drug ID → watch the 7-step animation → see "AUTHENTIC DRUG"
8. **Open Supply Chain** → see the full journey timeline
9. **Open Blockchain Explorer** → click the latest block → see the transaction
10. **Click "Verify Chain Integrity"** → "Blockchain Integrity Verified"
11. **Open Analytics** → show the charts
12. **Open Admin** (`admin@pharmatrace.demo`) → show user management
13. **Try an invalid drug ID** → "DRUG NOT VERIFIED"
14. **Try the expired Ranitidine batch** → "EXPIRED DRUG"
15. **Try the flagged Omeprazole batch** → "VERIFICATION FAILED / FLAGGED"

---

## ⚙️ Environment Variables

Create `.env` (already provided in this project):

```env
DATABASE_URL=file:/home/z/my-project/db/custom.db
JWT_SECRET=pharmatrace_demo_jwt_secret_change_in_production_2026
BLOCKCHAIN_MODE=local
NODE_ENV=development
```

---

## 🧪 Scripts

```bash
bun run dev        # start dev server on port 3000
bun run lint       # eslint
bun run db:push    # push schema to sqlite
bun run db:generate # regenerate prisma client
bun run prisma/seed.ts  # reseed demo data
```

---

## 📁 Project Structure

```
my-project/
├── prisma/
│   ├── schema.prisma        # all models
│   └── seed.ts              # demo data seeder
├── src/
│   ├── app/
│   │   ├── page.tsx         # single SPA entry (renders <AppShell/>)
│   │   ├── layout.tsx       # dark theme + metadata + Toaster
│   │   ├── globals.css      # dark Web3 theme + animations
│   │   └── api/             # REST routes (auth, drugs, verify, blockchain, analytics, users, notifications, stats, seed)
│   ├── lib/
│   │   ├── db.ts            # Prisma client
│   │   ├── api.ts           # ok/fail/withHandler helpers + status metadata
│   │   ├── auth/
│   │   │   ├── server.ts    # JWT + bcrypt + cookie + requireUser/requireRole
│   │   │   └── qr.ts        # HMAC-signed QR tokens + unique drug-id gen
│   │   ├── blockchain/
│   │   │   ├── crypto.ts    # SHA-256, merkle root, proof-of-work
│   │   │   ├── service.ts   # genesis, createBlock, verifyChainIntegrity
│   │   │   └── contracts.ts # registerDrug / transferDrug / verifyDrug / ...
│   │   └── client/
│   │       ├── api.ts       # typed fetch helpers
│   │       └── format.ts    # date / hash / clipboard helpers
│   ├── store/
│   │   ├── router.ts        # Zustand SPA router (16 views)
│   │   └── auth.ts          # current user + fetchMe + logout
│   └── components/
│       ├── ui/              # shadcn/ui primitives (already installed)
│       └── pharmatrace/
│           ├── AppShell.tsx
│           ├── Navbar.tsx / Footer.tsx / NotificationBell.tsx
│           ├── Brand.tsx / AnimatedBackground.tsx
│           ├── GlassCard.tsx / StatCard.tsx / Badges.tsx / States.tsx
│           └── views/       # 16 view components
└── .env
```

---

## ⚠️ Known Limitations

- The blockchain is a **local educational ledger** persisted to SQLite, not a deployed Hyperledger Fabric network. The adapter interface (`BlockchainAdapter`) is structured so a `FabricBlockchainAdapter` can be added later without changing the API layer.
- Camera-based QR scanning requires browser permission; in sandboxed previews camera access may be blocked. **Manual entry** is always available as a fallback.
- No automated tests are included (per project instructions).
- This is an **academic prototype** — not a production pharmaceutical regulatory system. Blockchain alone does not guarantee pharmaceutical authenticity; authenticity depends on trustworthy data entered by authorized participants.

---

## 🔮 Future Scope

- Hyperledger Fabric deployment (real permissioned chain)
- IoT sensor integration + cold-chain temperature monitoring
- Real pharmaceutical database APIs (e.g. GS1 / national drug registries)
- Mobile application + NFC tag scanning
- Advanced anomaly detection (ML-based)
- Regulatory body integration
- Multi-organization permissioned blockchain

---

## 📚 Research Paper Alignment

This implementation aligns conceptually with *"Blockchain-Based Approach for Pharmaceutical Drug Authentication"*. The paper's four core modules are all implemented:

| Paper concept | PharmaTrace implementation |
|---|---|
| User Account Management | Auth + 6 roles + JWT + bcrypt |
| Code Submission & Input Validation | Drug registration form + server-side Zod-style validation |
| Backend & Blockchain Integration | REST API → BlockchainService → LocalBlockchainAdapter |
| Smart Contracts & Validation | `contracts.ts` (registerDrug / transferDrug / verifyDrug / flagDrug / ...) |

Prototype extensions beyond the paper (clearly labelled as such): analytics dashboard, blockchain explorer, notification system, transfer/receive/dispense flows.

---

© 2026 PharmaTrace — Academic Mini-Project. Built with Next.js, Prisma, and a local educational blockchain.
