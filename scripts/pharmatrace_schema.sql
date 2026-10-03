-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL DEFAULT '',
    "supabaseUid" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "organization" TEXT,
    "location" TEXT,
    "avatarColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drug" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "genericName" TEXT,
    "manufacturerName" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "manufacturingDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "drugCategory" TEXT,
    "dosageForm" TEXT,
    "storageRequirement" TEXT,
    "manufacturingLocation" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "currentOwnerId" TEXT NOT NULL,
    "currentLocation" TEXT,
    "qrToken" TEXT NOT NULL,
    "registrationBlockNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataSource" TEXT,
    "sourceIdentifier" TEXT,
    "sourceUrl" TEXT,
    "sourceRetrievedAt" TIMESTAMP(3),
    "sourceHash" TEXT,
    "brandName" TEXT,
    "ndc" TEXT,
    "walletAddress" TEXT,

    CONSTRAINT "Drug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyChainEvent" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "location" TEXT,
    "quantity" INTEGER,
    "notes" TEXT,
    "transactionId" TEXT,
    "blockNumber" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplyChainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "drugId" TEXT,
    "type" TEXT NOT NULL,
    "fromId" TEXT,
    "toId" TEXT,
    "data" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "userId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainBlock" (
    "blockNumber" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousHash" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL DEFAULT 0,
    "merkleRoot" TEXT,

    CONSTRAINT "BlockchainBlock_pkey" PRIMARY KEY ("blockNumber")
);

-- CreateTable
CREATE TABLE "VerificationRecord" (
    "id" TEXT NOT NULL,
    "drugId" TEXT,
    "query" TEXT NOT NULL,
    "verificationMethod" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "reason" TEXT,
    "transactionId" TEXT,
    "blockNumber" INTEGER,
    "verifierId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUid_key" ON "User"("supabaseUid");

-- CreateIndex
CREATE INDEX "User_supabaseUid_idx" ON "User"("supabaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "Drug_drugId_key" ON "Drug"("drugId");

-- CreateIndex
CREATE UNIQUE INDEX "Drug_batchNumber_key" ON "Drug"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Drug_serialNumber_key" ON "Drug"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Drug_qrToken_key" ON "Drug"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionHash_key" ON "Transaction"("transactionHash");

-- CreateIndex
CREATE INDEX "BlockchainBlock_previousHash_idx" ON "BlockchainBlock"("previousHash");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- AddForeignKey
ALTER TABLE "Drug" ADD CONSTRAINT "Drug_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drug" ADD CONSTRAINT "Drug_currentOwnerId_fkey" FOREIGN KEY ("currentOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyChainEvent" ADD CONSTRAINT "SupplyChainEvent_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyChainEvent" ADD CONSTRAINT "SupplyChainEvent_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyChainEvent" ADD CONSTRAINT "SupplyChainEvent_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "BlockchainBlock"("blockNumber") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRecord" ADD CONSTRAINT "VerificationRecord_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRecord" ADD CONSTRAINT "VerificationRecord_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

