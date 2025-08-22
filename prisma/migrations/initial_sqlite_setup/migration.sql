-- CreateTable
CREATE TABLE "base_model" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "regionHash" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "note" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "accuracy" REAL,
    "deviceType" TEXT NOT NULL DEFAULT 'OTHER',
    "deviceHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "source" TEXT,
    "dataRetention" DATETIME NOT NULL,
    "privacyVersion" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT,
    CONSTRAINT "check_ins_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "deviceId" TEXT NOT NULL,
    "duration" INTEGER,
    "pageViews" INTEGER NOT NULL DEFAULT 1,
    "bounced" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "properties" TEXT,
    CONSTRAINT "events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checkInId" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "emotionCounts" TEXT NOT NULL,
    "totalCheckins" INTEGER NOT NULL,
    "avgIntensity" REAL NOT NULL,
    CONSTRAINT "analytics_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "check_ins" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "privacy_consents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "consentedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    "preferences" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "realtime_stats" (
    "regionHash" TEXT NOT NULL PRIMARY KEY,
    "emotionCounts" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL
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
CREATE UNIQUE INDEX "analytics_checkInId_periodStart_periodEnd_key" ON "analytics"("checkInId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "analytics_periodStart_periodEnd_idx" ON "analytics"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "rate_limits_expiresAt_idx" ON "rate_limits"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_consents_deviceId_version_key" ON "privacy_consents"("deviceId", "version");

-- CreateIndex
CREATE INDEX "privacy_consents_deviceId_consentedAt_idx" ON "privacy_consents"("deviceId", "consentedAt");