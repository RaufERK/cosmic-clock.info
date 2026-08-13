-- CreateTable
CREATE TABLE "StatEvent" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatEvent_kind_createdAt_idx" ON "StatEvent"("kind", "createdAt");
