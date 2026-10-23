-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rf" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CONSULTA',
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Membership" (
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "unitId"),
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Membership_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "tokenHash" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Process" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "biId" TEXT,
    "protocol" TEXT,
    "system" TEXT NOT NULL DEFAULT 'SEI',
    "subject" TEXT NOT NULL,
    "sourceStatus" TEXT,
    "sourceUnit" TEXT,
    "sourceUpdatedAt" DATETIME,
    "biSyncedAt" DATETIME,
    "seiStatus" TEXT,
    "seiSyncedAt" DATETIME,
    "sourceMissing" BOOLEAN NOT NULL DEFAULT false,
    "unitId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aguardando distribuição',
    "instance" TEXT NOT NULL DEFAULT 'Inicial',
    "decision" TEXT,
    "priority" BOOLEAN NOT NULL DEFAULT false,
    "priorityReason" TEXT,
    "notes" TEXT,
    "closedAt" DATETIME,
    "lastOperationalAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Process_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'LOCAL',
    CONSTRAINT "Property_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'LOCAL',
    CONSTRAINT "Party_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "Assignment_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Activity_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'LOCAL',
    "externalKey" TEXT,
    "author" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "History_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ProcessGroup" (
    "processId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    PRIMARY KEY ("processId", "groupId"),
    CONSTRAINT "ProcessGroup_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProcessGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Letter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "sentAt" DATETIME,
    "repliedAt" DATETIME,
    "closedAt" DATETIME,
    CONSTRAINT "Letter_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhysicalLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "volumes" INTEGER NOT NULL,
    "boxes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhysicalLocation_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT
);

-- CreateTable
CREATE TABLE "SyncLock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_rf_key" ON "User"("rf");

-- CreateIndex
CREATE UNIQUE INDEX "Process_number_key" ON "Process"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Process_biId_key" ON "Process"("biId");

-- CreateIndex
CREATE INDEX "Process_unitId_closedAt_lastOperationalAt_idx" ON "Process"("unitId", "closedAt", "lastOperationalAt");

-- CreateIndex
CREATE UNIQUE INDEX "Property_processId_identifier_origin_key" ON "Property"("processId", "identifier", "origin");

-- CreateIndex
CREATE INDEX "Assignment_processId_endedAt_idx" ON "Assignment"("processId", "endedAt");

-- CreateIndex
CREATE INDEX "Activity_unitId_userId_endedAt_idx" ON "Activity"("unitId", "userId", "endedAt");

-- CreateIndex
CREATE UNIQUE INDEX "History_externalKey_key" ON "History"("externalKey");

-- CreateIndex
CREATE INDEX "History_processId_occurredAt_idx" ON "History"("processId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Letter_number_key" ON "Letter"("number");
