-- CreateEnum
CREATE TYPE "GenderIdentity" AS ENUM ('female', 'male', 'nonbinary', 'custom');

-- CreateEnum
CREATE TYPE "TargetSource" AS ENUM ('user', 'model_inferred');

-- CreateEnum
CREATE TYPE "EndedReason" AS ENUM ('user_end', 'auto_alert', 'timeout');

-- CreateEnum
CREATE TYPE "CareEventType" AS ENUM ('water', 'snack', 'meal');

-- CreateEnum
CREATE TYPE "DrinkCategory" AS ENUM ('beer', 'wine', 'cocktail', 'shot', 'other');

-- CreateEnum
CREATE TYPE "ServingSizeType" AS ENUM ('shot', 'single', 'double', 'pint', 'half_pint', 'pitcher', 'bottle', 'can', 'tall', 'short', 'wine_glass', 'champagne_flute', 'martini', 'highball', 'rocks', 'standard');

-- CreateEnum
CREATE TYPE "UnitSystem" AS ENUM ('metric', 'imperial');

-- CreateEnum
CREATE TYPE "RecommendedAction" AS ENUM ('keep', 'slow', 'stop', 'hydrate', 'abort');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "geoLocation" TEXT,
    "profileImageUrl" TEXT,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION,
    "totalBodyWaterL" DOUBLE PRECISION,
    "age" INTEGER NOT NULL,
    "genderIdentity" "GenderIdentity" NOT NULL,
    "genderCustomLabel" TEXT,
    "menstruation" BOOLEAN NOT NULL,
    "cycleDay" INTEGER,
    "medications" BOOLEAN NOT NULL,
    "medicationDetails" TEXT,
    "conditions" BOOLEAN NOT NULL,
    "conditionDetails" TEXT,
    "metabolismScore" INTEGER NOT NULL,
    "toleranceScore" INTEGER NOT NULL,
    "pinkdrunkTargetUser" INTEGER NOT NULL DEFAULT 5,
    "pinkdrunkTargetConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrinkingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "targetLevel" INTEGER NOT NULL DEFAULT 5,
    "targetSource" "TargetSource" NOT NULL DEFAULT 'user',
    "endedReason" "EndedReason",
    "reportedLevel" DOUBLE PRECISION,
    "reportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrinkingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drink" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "category" "DrinkCategory" NOT NULL,
    "label" TEXT,
    "brandId" TEXT,
    "presetId" TEXT,
    "mixedDrinkId" TEXT,
    "abvPercent" DOUBLE PRECISION NOT NULL,
    "volumeMl" DOUBLE PRECISION NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingestionMins" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "Drink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "CareEventType" NOT NULL,
    "volumeMl" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrinkBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "DrinkCategory" NOT NULL,
    "abvPercent" DOUBLE PRECISION NOT NULL,
    "standardVolumeMl" DOUBLE PRECISION,
    "country" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrinkBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandServingSize" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "sizeType" "ServingSizeType" NOT NULL,
    "volumeMl" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BrandServingSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrinkPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "DrinkCategory" NOT NULL,
    "abvPercent" DOUBLE PRECISION NOT NULL,
    "volumeMl" DOUBLE PRECISION NOT NULL,
    "servingSize" "ServingSizeType" NOT NULL DEFAULT 'standard',
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrinkPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MixedDrink" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "DrinkCategory" NOT NULL DEFAULT 'cocktail',
    "abvPercent" DOUBLE PRECISION NOT NULL,
    "volumeMl" DOUBLE PRECISION NOT NULL,
    "servingSize" "ServingSizeType" NOT NULL DEFAULT 'single',
    "ingredients" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MixedDrink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "presetId" TEXT,
    "mixedDrinkId" TEXT,
    "customName" TEXT,
    "customAbv" DOUBLE PRECISION,
    "customVolumeMl" DOUBLE PRECISION,
    "customCategory" "DrinkCategory",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "units" "UnitSystem" NOT NULL DEFAULT 'metric',
    "defaultVolume" DOUBLE PRECISION,
    "showAbvSuggestions" BOOLEAN NOT NULL DEFAULT true,
    "enableNotifications" BOOLEAN NOT NULL DEFAULT true,
    "notificationThreshold" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "producedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "levelEstimate" DOUBLE PRECISION NOT NULL,
    "drinksToTarget" DOUBLE PRECISION NOT NULL,
    "recommendedAction" "RecommendedAction" NOT NULL,
    "confidenceLow" DOUBLE PRECISION,
    "confidenceHigh" DOUBLE PRECISION,
    "nextDrinkEtaMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpairmentThreshold" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "grams" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImpairmentThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DrinkBrand_name_key" ON "DrinkBrand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BrandServingSize_brandId_sizeType_key" ON "BrandServingSize"("brandId", "sizeType");

-- CreateIndex
CREATE UNIQUE INDEX "DrinkPreset_name_key" ON "DrinkPreset"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MixedDrink_name_key" ON "MixedDrink"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ImpairmentThreshold_userId_level_key" ON "ImpairmentThreshold"("userId", "level");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrinkingSession" ADD CONSTRAINT "DrinkingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drink" ADD CONSTRAINT "Drink_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DrinkingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drink" ADD CONSTRAINT "Drink_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "DrinkBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drink" ADD CONSTRAINT "Drink_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "DrinkPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drink" ADD CONSTRAINT "Drink_mixedDrinkId_fkey" FOREIGN KEY ("mixedDrinkId") REFERENCES "MixedDrink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareEvent" ADD CONSTRAINT "CareEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DrinkingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandServingSize" ADD CONSTRAINT "BrandServingSize_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "DrinkBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "DrinkPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_mixedDrinkId_fkey" FOREIGN KEY ("mixedDrinkId") REFERENCES "MixedDrink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DrinkingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpairmentThreshold" ADD CONSTRAINT "ImpairmentThreshold_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

