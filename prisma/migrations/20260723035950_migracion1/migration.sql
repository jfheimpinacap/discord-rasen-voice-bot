-- CreateTable
CREATE TABLE "GuildConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "publicCategoryId" TEXT,
    "privateCategoryId" TEXT,
    "publicGeneratorChannelId" TEXT,
    "privateGeneratorChannelId" TEXT,
    "emptyChannelDeleteDelaySeconds" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TemporaryVoiceChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "ownerId" TEXT,
    "channelType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GuildConfiguration_guildId_key" ON "GuildConfiguration"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "TemporaryVoiceChannel_channelId_key" ON "TemporaryVoiceChannel"("channelId");

-- CreateIndex
CREATE INDEX "TemporaryVoiceChannel_guildId_idx" ON "TemporaryVoiceChannel"("guildId");
