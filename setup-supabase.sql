-- CreateTable
CREATE TABLE "base_model" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "base_model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "regionHash" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "note" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "deviceType" TEXT NOT NULL DEFAULT 'OTHER',
    "deviceHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "source" TEXT,
    "dataRetention" TIMESTAMP(3) NOT NULL,
    "privacyVersion" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "deviceId" TEXT NOT NULL,
    "duration" INTEGER,
    "pageViews" INTEGER NOT NULL DEFAULT 1,
    "bounced" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "properties" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL,
    "checkInId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "emotionCounts" TEXT NOT NULL,
    "totalCheckins" INTEGER NOT NULL,
    "avgIntensity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_consents" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "preferences" TEXT NOT NULL,

    CONSTRAINT "privacy_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "realtime_stats" (
    "regionHash" TEXT NOT NULL,
    "emotionCounts" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "realtime_stats_pkey" PRIMARY KEY ("regionHash")
);

-- CreateIndex
CREATE INDEX "check_ins_regionHash_createdAt_idx" ON "check_ins"("regionHash", "createdAt");

-- CreateIndex
CREATE INDEX "check_ins_emotion_createdAt_idx" ON "check_ins"("emotion", "createdAt");

-- CreateIndex
CREATE INDEX "check_ins_deviceId_createdAt_idx" ON "check_ins"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "check_ins_processedAt_idx" ON "check_ins"("processedAt");

-- CreateIndex
CREATE INDEX "check_ins_dataRetention_idx" ON "check_ins"("dataRetention");

-- CreateIndex
CREATE INDEX "sessions_deviceId_startedAt_idx" ON "sessions"("deviceId", "startedAt");

-- CreateIndex
CREATE INDEX "sessions_startedAt_idx" ON "sessions"("startedAt");

-- CreateIndex
CREATE INDEX "events_sessionId_createdAt_idx" ON "events"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "events_eventType_createdAt_idx" ON "events"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_periodStart_periodEnd_idx" ON "analytics"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_checkInId_periodStart_periodEnd_key" ON "analytics"("checkInId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "rate_limits_expiresAt_idx" ON "rate_limits"("expiresAt");

-- CreateIndex
CREATE INDEX "privacy_consents_deviceId_consentedAt_idx" ON "privacy_consents"("deviceId", "consentedAt");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_consents_deviceId_version_key" ON "privacy_consents"("deviceId", "version");

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "check_ins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

