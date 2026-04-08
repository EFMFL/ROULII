-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'CASH');

-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'COMMISSION_CAPTURE';

-- CreateEnum
CREATE TYPE "PlatformLedgerType" AS ENUM ('PENALTY_SHARE', 'COMMISSION_SHARE');

-- AlterTable
ALTER TABLE "bookings"
ADD COLUMN "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CARD',
ADD COLUMN "cash_commission_held" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cash_commission_held_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "cash_accepted_at" TIMESTAMP(3),
ADD COLUMN "completed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "platform_ledger_transactions" (
    "id" TEXT NOT NULL,
    "type" "PlatformLedgerType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "booking_id" TEXT,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_ledger_transactions_type_created_at_idx" ON "platform_ledger_transactions"("type", "created_at");

-- CreateIndex
CREATE INDEX "platform_ledger_transactions_booking_id_idx" ON "platform_ledger_transactions"("booking_id");

-- AddForeignKey
ALTER TABLE "platform_ledger_transactions" ADD CONSTRAINT "platform_ledger_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
