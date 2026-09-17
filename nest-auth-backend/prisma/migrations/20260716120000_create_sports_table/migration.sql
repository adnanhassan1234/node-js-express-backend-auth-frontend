-- CreateTable
CREATE TABLE "sports" (
    "id" SERIAL NOT NULL,
    "playerName" TEXT NOT NULL,
    "jerseyNumber" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "team" TEXT,
    "position" TEXT,
    "country" TEXT,
    "age" INTEGER NOT NULL,
    "gender" TEXT,
    "ranking" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sports_jerseyNumber_key" ON "sports"("jerseyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sports_email_key" ON "sports"("email");
