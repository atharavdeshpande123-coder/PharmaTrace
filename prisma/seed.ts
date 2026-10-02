/**
 * PharmaTrace seed script.
 *
 * Run via:   bun run prisma/seed.ts
 * Or hit:    POST /api/seed
 *
 * Creates demo accounts, 10+ drug batches (incl. expired + flagged),
 * 20+ blockchain transactions, multiple supply-chain events, and
 * verification records. Idempotent: it wipes existing demo data first.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { ensureGenesisBlock, createTransaction } from '../src/lib/blockchain/service'
import {
  generateUniqueDrugIdentifiers,
  generateQrToken,
} from '../src/lib/auth/qr'

const db = new PrismaClient()

const DEMO_PASSWORD = 'demo1234'
const DEMO_USERS = [
  { email: 'admin@pharmatrace.demo', name: 'Dr. Admin', role: 'ADMIN', organization: 'PharmaTrace Network Authority', location: 'Geneva, Switzerland', color: '#22d3ee' },
  { email: 'manufacturer@pharmatrace.demo', name: 'Mfg. Aria Chen', role: 'MANUFACTURER', organization: 'NovaCure Pharmaceuticals', location: 'Mumbai, India', color: '#a78bfa' },
  { email: 'manufacturer2@pharmatrace.demo', name: 'Mfg. Rohan Kapoor', role: 'MANUFACTURER', organization: 'MediCore Labs', location: 'Bangalore, India', color: '#f472b6' },
  { email: 'manufacturer3@pharmatrace.demo', name: 'Mfg. Lena Fischer', role: 'MANUFACTURER', organization: 'AstraNova Healthcare', location: 'Hyderabad, India', color: '#34d399' },
  { email: 'distributor@pharmatrace.demo', name: 'Dist. Vikram Shah', role: 'DISTRIBUTOR', organization: 'XYZ Distribution', location: 'Pune, India', color: '#fbbf24' },
  { email: 'distributor2@pharmatrace.demo', name: 'Dist. Mei Tanaka', role: 'DISTRIBUTOR', organization: 'PacificMed Logistics', location: 'Singapore', color: '#60a5fa' },
  { email: 'wholesaler@pharmatrace.demo', name: 'Whl. Daniel Park', role: 'WHOLESALER', organization: 'MediSupply Hub', location: 'Delhi, India', color: '#c084fc' },
  { email: 'pharmacy@pharmatrace.demo', name: 'Phm. Sofia Rossi', role: 'PHARMACY', organization: 'HealthPlus Pharmacy', location: 'Pune, India', color: '#fb7185' },
  { email: 'pharmacy2@pharmatrace.demo', name: 'Phm. Omar Haddad', role: 'PHARMACY', organization: 'CarePoint Pharmacy', location: 'Dubai, UAE', color: '#4ade80' },
  { email: 'customer@pharmatrace.demo', name: 'Customer (Demo)', role: 'CUSTOMER', organization: null, location: 'Public Verifier', color: '#94a3b8' },
]

const DRUG_TEMPLATES = [
  { drugName: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Analgesic', dosage: 'Tablet', storage: 'Store below 25°C', manufacturerIdx: 1, mfgLocation: 'Mumbai, India' },
  { drugName: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Antibiotic', dosage: 'Capsule', storage: 'Store below 25°C', manufacturerIdx: 1, mfgLocation: 'Mumbai, India' },
  { drugName: 'Azithromycin 250mg', genericName: 'Azithromycin', category: 'Antibiotic', dosage: 'Tablet', storage: 'Store below 25°C', manufacturerIdx: 2, mfgLocation: 'Bangalore, India' },
  { drugName: 'Vitamin D3 60000 IU', genericName: 'Cholecalciferol', category: 'Vitamin', dosage: 'Capsule', storage: 'Store below 25°C', manufacturerIdx: 2, mfgLocation: 'Bangalore, India' },
  { drugName: 'Ibuprofen 400mg', genericName: 'Ibuprofen', category: 'NSAID', dosage: 'Tablet', storage: 'Store below 25°C', manufacturerIdx: 3, mfgLocation: 'Hyderabad, India' },
  { drugName: 'Metformin 500mg', genericName: 'Metformin', category: 'Antidiabetic', dosage: 'Tablet', storage: 'Store below 25°C', manufacturerIdx: 3, mfgLocation: 'Hyderabad, India' },
  { drugName: 'Atorvastatin 10mg', genericName: 'Atorvastatin', category: 'Statin', dosage: 'Tablet', storage: 'Store below 25°C', manufacturerIdx: 1, mfgLocation: 'Mumbai, India' },
  { drugName: 'Cetirizine 10mg', genericName: 'Cetirizine', category: 'Antihistamine', dosage: 'Tablet', storage: 'Store below 25°C', manufacturerIdx: 2, mfgLocation: 'Bangalore, India' },
  { drugName: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'PPI', dosage: 'Capsule', storage: 'Store below 25°C', manufacturerIdx: 3, mfgLocation: 'Hyderabad, India' },
  { drugName: 'Ranitidine 150mg', genericName: 'Ranitidine', category: 'H2 Blocker', dosage: 'Tablet', storage: 'Store below 25°C', manufacturerIdx: 1, mfgLocation: 'Mumbai, India' },
  { drugName: 'Aspirin 75mg', genericName: 'Aspirin', category: 'Antiplatelet', dosage: 'Tablet', storage: 'Store below 25°C', manufacturerIdx: 2, mfgLocation: 'Bangalore, India' },
  { drugName: 'Pantoprazole 40mg', genericName: 'Pantoprazole', category: 'PPI', dosage: 'Tablet', storage: 'Store below 25°C', manufacturerIdx: 3, mfgLocation: 'Hyderabad, India' },
]

async function main() {
  console.log('🌱 Seeding PharmaTrace demo data…')

  // Wipe (order matters because of FK constraints)
  await db.notification.deleteMany()
  await db.verificationRecord.deleteMany()
  await db.supplyChainEvent.deleteMany()
  await db.transaction.deleteMany()
  await db.drug.deleteMany()
  await db.blockchainBlock.deleteMany()
  await db.user.deleteMany()

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)
  const users = await Promise.all(
    DEMO_USERS.map((u) =>
      db.user.create({
        data: {
          email: u.email,
          name: u.name,
          passwordHash,
          role: u.role,
          organization: u.organization,
          location: u.location,
          avatarColor: u.color,
        },
      }),
    ),
  )
  console.log(`  ✓ Created ${users.length} demo users`)

  await ensureGenesisBlock()
  const admin = users[0]
  const manufacturer = users[1]
  const distributor = users[4]
  const wholesaler = users[6]
  const pharmacy = users[7]

  // Register all drug batches
  const drugs = []
  for (let i = 0; i < DRUG_TEMPLATES.length; i++) {
    const tpl = DRUG_TEMPLATES[i]
    const mfgUser = users[tpl.manufacturerIdx]
    const ids = await generateUniqueDrugIdentifiers()
    const now = new Date()
    // vary the dates
    const monthsAgo = i % 5
    const mfgDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo - 1, 10 + (i % 10))
    const expDate = new Date(now.getFullYear() + 1, now.getMonth() + monthsAgo - 1, 10 + (i % 10))
    const drug = await db.drug.create({
      data: {
        drugId: ids.drugId,
        drugName: tpl.drugName,
        genericName: tpl.genericName,
        manufacturerName: mfgUser.organization!,
        manufacturerId: mfgUser.id,
        batchNumber: `BAT-${ids.drugId.slice(-8).replace(/-/g, '')}`,
        serialNumber: `SN-${(i + 1).toString().padStart(4, '0')}-${ids.drugId.slice(-4)}`,
        manufacturingDate: mfgDate,
        expiryDate: expDate,
        quantity: 1000 + (i % 5) * 500,
        drugCategory: tpl.category,
        dosageForm: tpl.dosage,
        storageRequirement: tpl.storage,
        manufacturingLocation: tpl.mfgLocation,
        description: `${tpl.drugName} — ${tpl.category}. Manufactured at ${tpl.mfgLocation}.`,
        status: 'REGISTERED',
        currentOwnerId: mfgUser.id,
        currentLocation: mfgUser.location,
        qrToken: ids.qrToken,
      },
    })
    const tx = await createTransaction({
      type: 'DRUG_REGISTERED',
      drugId: drug.id,
      userId: mfgUser.id,
      data: {
        drugId: drug.drugId,
        batchNumber: drug.batchNumber,
        serialNumber: drug.serialNumber,
        manufacturer: mfgUser.organization,
        quantity: drug.quantity,
      },
    })
    await db.supplyChainEvent.create({
      data: {
        drugId: drug.id,
        eventType: 'REGISTERED',
        fromUserId: mfgUser.id,
        toUserId: mfgUser.id,
        location: mfgUser.location ?? null,
        quantity: drug.quantity,
        notes: 'Drug batch registered by manufacturer',
        transactionId: tx.transactionHash,
        blockNumber: tx.blockNumber,
      },
    })
    await db.drug.update({ where: { id: drug.id }, data: { registrationBlockNumber: tx.blockNumber } })
    await db.notification.create({
      data: {
        userId: mfgUser.id,
        type: 'DRUG_REGISTERED',
        title: 'Drug batch registered',
        message: `${drug.drugName} (${drug.batchNumber}) registered on chain.`,
      },
    })
    drugs.push(drug)
  }
  console.log(`  ✓ Registered ${drugs.length} drug batches`)

  // Move several batches through the supply chain: Manufacturer -> Distributor -> Pharmacy
  const transferPlan = drugs.slice(0, 8)
  for (let i = 0; i < transferPlan.length; i++) {
    const drug = transferPlan[i]
    const mfg = await db.user.findUnique({ where: { id: drug.currentOwnerId } })
    if (!mfg) continue
    // 1) Manufacturer -> Distributor
    const txT1 = await createTransaction({
      type: 'DRUG_TRANSFERRED',
      drugId: drug.id,
      fromId: mfg.id,
      toId: distributor.id,
      userId: mfg.id,
      data: {
        drugId: drug.drugId,
        batchNumber: drug.batchNumber,
        from: mfg.organization,
        to: distributor.organization,
        destination: distributor.location,
        quantity: drug.quantity,
      },
    })
    await db.drug.update({
      where: { id: drug.id },
      data: { currentOwnerId: distributor.id, currentLocation: distributor.location, status: 'IN_TRANSIT' },
    })
    await db.supplyChainEvent.create({
      data: {
        drugId: drug.id,
        eventType: 'TRANSFERRED',
        fromUserId: mfg.id,
        toUserId: distributor.id,
        location: distributor.location ?? null,
        quantity: drug.quantity,
        notes: 'Transferred from manufacturer to distributor',
        transactionId: txT1.transactionHash,
        blockNumber: txT1.blockNumber,
      },
    })
    // 2) Distributor receives
    const txR1 = await createTransaction({
      type: 'DRUG_RECEIVED',
      drugId: drug.id,
      toId: distributor.id,
      userId: distributor.id,
      data: { drugId: drug.drugId, batchNumber: drug.batchNumber, receivedBy: distributor.organization, location: distributor.location },
    })
    await db.drug.update({ where: { id: drug.id }, data: { status: 'DELIVERED' } })
    await db.supplyChainEvent.create({
      data: {
        drugId: drug.id,
        eventType: 'RECEIVED',
        fromUserId: distributor.id,
        toUserId: distributor.id,
        location: distributor.location ?? null,
        notes: 'Received by distributor',
        transactionId: txR1.transactionHash,
        blockNumber: txR1.blockNumber,
      },
    })

    if (i < 6) {
      // 3) Distributor -> Pharmacy (some go through wholesaler)
      const intermediary = i % 2 === 0 ? wholesaler : pharmacy
      const txT2 = await createTransaction({
        type: 'DRUG_TRANSFERRED',
        drugId: drug.id,
        fromId: distributor.id,
        toId: intermediary.id,
        userId: distributor.id,
        data: {
          drugId: drug.drugId,
          batchNumber: drug.batchNumber,
          from: distributor.organization,
          to: intermediary.organization,
          destination: intermediary.location,
          quantity: drug.quantity,
        },
      })
      await db.drug.update({
        where: { id: drug.id },
        data: { currentOwnerId: intermediary.id, currentLocation: intermediary.location, status: 'IN_TRANSIT' },
      })
      await db.supplyChainEvent.create({
        data: {
          drugId: drug.id,
          eventType: 'TRANSFERRED',
          fromUserId: distributor.id,
          toUserId: intermediary.id,
          location: intermediary.location ?? null,
          quantity: drug.quantity,
          notes: 'Transferred to downstream party',
          transactionId: txT2.transactionHash,
          blockNumber: txT2.blockNumber,
        },
      })
      const txR2 = await createTransaction({
        type: 'DRUG_RECEIVED',
        drugId: drug.id,
        toId: intermediary.id,
        userId: intermediary.id,
        data: { drugId: drug.drugId, batchNumber: drug.batchNumber, receivedBy: intermediary.organization },
      })
      await db.drug.update({ where: { id: drug.id }, data: { status: 'DELIVERED' } })
      await db.supplyChainEvent.create({
        data: {
          drugId: drug.id,
          eventType: 'RECEIVED',
          fromUserId: intermediary.id,
          toUserId: intermediary.id,
          location: intermediary.location ?? null,
          notes: 'Received by downstream party',
          transactionId: txR2.transactionHash,
          blockNumber: txR2.blockNumber,
        },
      })
    }
  }
  console.log('  ✓ Created supply-chain movements')

  // Make one drug flagged by admin
  if (drugs[8]) {
    const tx = await createTransaction({
      type: 'DRUG_FLAGGED',
      drugId: drugs[8].id,
      userId: admin.id,
      data: { drugId: drugs[8].drugId, batchNumber: drugs[8].batchNumber, reason: 'Batch reported with inconsistent QR code during spot check' },
    })
    await db.drug.update({ where: { id: drugs[8].id }, data: { status: 'FLAGGED' } })
    await db.supplyChainEvent.create({
      data: {
        drugId: drugs[8].id,
        eventType: 'FLAGGED',
        fromUserId: admin.id,
        toUserId: admin.id,
        notes: 'Batch reported with inconsistent QR code during spot check',
        transactionId: tx.transactionHash,
        blockNumber: tx.blockNumber,
      },
    })
    await db.notification.create({
      data: {
        userId: admin.id,
        type: 'SUSPICIOUS_DRUG',
        title: 'Suspicious drug flagged',
        message: `${drugs[8].drugName} (${drugs[8].batchNumber}) was flagged during spot check.`,
      },
    })
    console.log('  ✓ Flagged one suspicious batch')
  }

  // Make one drug explicitly expired
  if (drugs[9]) {
    const past = new Date()
    past.setFullYear(past.getFullYear() - 1)
    await db.drug.update({
      where: { id: drugs[9].id },
      data: { expiryDate: past },
    })
    console.log('  ✓ Marked one batch as expired')
  }

  // Create a few verification records
  for (let i = 0; i < 12; i++) {
    const drug = drugs[i % drugs.length]
    if (!drug) continue
    const isFlagged = drug.status === 'FLAGGED'
    const expired = new Date() > drug.expiryDate
    const result = isFlagged ? 'FLAGGED' : expired ? 'EXPIRED' : i % 5 === 0 ? 'NOT_FOUND' : 'AUTHENTIC'
    const method = i % 3 === 0 ? 'QR_SCAN' : i % 3 === 1 ? 'MANUAL_ENTRY' : 'IMAGE_UPLOAD'
    const tx = await createTransaction({
      type: 'DRUG_VERIFIED',
      drugId: result === 'NOT_FOUND' ? null : drug.id,
      userId: users[9].id,
      data: { query: drug.drugId, result, method, drugId: drug.drugId, batchNumber: drug.batchNumber },
    })
    await db.verificationRecord.create({
      data: {
        drugId: result === 'NOT_FOUND' ? null : drug.id,
        query: result === 'NOT_FOUND' ? 'PHARMA-FAKE-0000' : drug.drugId,
        verificationMethod: method,
        result,
        reason: result === 'AUTHENTIC' ? 'Blockchain record verified' : result === 'NOT_FOUND' ? 'No matching record' : result === 'FLAGGED' ? 'Batch flagged' : 'Past expiry date',
        transactionId: tx.transactionHash,
        blockNumber: tx.blockNumber,
        verifierId: users[9].id,
      },
    })
  }
  console.log('  ✓ Created verification history')

  // Notifications for downstream parties
  await db.notification.createMany({
    data: [
      { userId: distributor.id, type: 'DRUG_TRANSFERRED', title: 'Incoming batches', message: '3 drug batches transferred to you.' },
      { userId: pharmacy.id, type: 'DRUG_RECEIVED', title: 'Batch received', message: 'Paracetamol 500mg received at HealthPlus Pharmacy.' },
      { userId: admin.id, type: 'DRUG_EXPIRED', title: 'Expired batch detected', message: 'Ranitidine 150mg batch has passed expiry.' },
    ],
  })

  console.log('\n✅ Seed complete.')
  console.log('   Demo credentials:')
  console.log(`     email: admin@pharmatrace.demo   password: ${DEMO_PASSWORD}`)
  console.log(`     email: manufacturer@pharmatrace.demo  password: ${DEMO_PASSWORD}`)
  console.log(`     email: distributor@pharmatrace.demo  password: ${DEMO_PASSWORD}`)
  console.log(`     email: pharmacy@pharmatrace.demo  password: ${DEMO_PASSWORD}`)
  console.log(`     email: customer@pharmatrace.demo  password: ${DEMO_PASSWORD}`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
