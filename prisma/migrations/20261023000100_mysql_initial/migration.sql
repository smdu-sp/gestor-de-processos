-- CreateTable
CREATE TABLE `Unit` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Unit_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `rf` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'CONSULTA',
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `User_rf_key`(`rf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Membership` (
    `userId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`userId`, `unitId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `tokenHash` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`tokenHash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Process` (
    `id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `biId` VARCHAR(191) NULL,
    `protocol` VARCHAR(191) NULL,
    `system` VARCHAR(191) NOT NULL DEFAULT 'SEI',
    `subject` TEXT NOT NULL,
    `sourceStatus` VARCHAR(191) NULL,
    `sourceUnit` VARCHAR(191) NULL,
    `sourceUpdatedAt` DATETIME(3) NULL,
    `biSyncedAt` DATETIME(3) NULL,
    `seiStatus` VARCHAR(191) NULL,
    `seiSyncedAt` DATETIME(3) NULL,
    `sourceMissing` BOOLEAN NOT NULL DEFAULT false,
    `unitId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Aguardando distribuição',
    `instance` VARCHAR(191) NOT NULL DEFAULT 'Inicial',
    `decision` VARCHAR(191) NULL,
    `priority` BOOLEAN NOT NULL DEFAULT false,
    `priorityReason` TEXT NULL,
    `notes` TEXT NULL,
    `closedAt` DATETIME(3) NULL,
    `lastOperationalAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `version` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Process_number_key`(`number`),
    UNIQUE INDEX `Process_biId_key`(`biId`),
    INDEX `Process_unitId_closedAt_lastOperationalAt_idx`(`unitId`, `closedAt`, `lastOperationalAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Property` (
    `id` VARCHAR(191) NOT NULL,
    `processId` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `origin` VARCHAR(191) NOT NULL DEFAULT 'LOCAL',

    UNIQUE INDEX `Property_processId_identifier_origin_key`(`processId`, `identifier`, `origin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Party` (
    `id` VARCHAR(191) NOT NULL,
    `processId` VARCHAR(191) NOT NULL,
    `name` TEXT NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `origin` VARCHAR(191) NOT NULL DEFAULT 'LOCAL',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assignment` (
    `id` VARCHAR(191) NOT NULL,
    `processId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,

    INDEX `Assignment_processId_endedAt_idx`(`processId`, `endedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Activity` (
    `id` VARCHAR(191) NOT NULL,
    `processId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `type` TEXT NOT NULL,
    `description` TEXT NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `endedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Activity_unitId_userId_endedAt_idx`(`unitId`, `userId`, `endedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `History` (
    `id` VARCHAR(191) NOT NULL,
    `processId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `origin` VARCHAR(191) NOT NULL DEFAULT 'LOCAL',
    `externalKey` VARCHAR(191) NULL,
    `author` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `History_externalKey_key`(`externalKey`),
    INDEX `History_processId_occurredAt_idx`(`processId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Group` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Group_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessGroup` (
    `processId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`processId`, `groupId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Letter` (
    `id` VARCHAR(191) NOT NULL,
    `processId` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `recipient` TEXT NOT NULL,
    `sentAt` DATETIME(3) NULL,
    `repliedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Letter_number_key`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhysicalLocation` (
    `id` VARCHAR(191) NOT NULL,
    `processId` VARCHAR(191) NOT NULL,
    `location` TEXT NOT NULL,
    `volumes` INTEGER NOT NULL,
    `boxes` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SyncRun` (
    `id` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'RUNNING',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `processed` INTEGER NOT NULL DEFAULT 0,
    `message` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SyncLock` (
    `id` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Membership` ADD CONSTRAINT `Membership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Membership` ADD CONSTRAINT `Membership_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Process` ADD CONSTRAINT `Process_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `Process`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Party` ADD CONSTRAINT `Party_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `Process`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `Process`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `Process`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `History` ADD CONSTRAINT `History_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `Process`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessGroup` ADD CONSTRAINT `ProcessGroup_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `Process`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessGroup` ADD CONSTRAINT `ProcessGroup_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Letter` ADD CONSTRAINT `Letter_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `Process`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhysicalLocation` ADD CONSTRAINT `PhysicalLocation_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `Process`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

