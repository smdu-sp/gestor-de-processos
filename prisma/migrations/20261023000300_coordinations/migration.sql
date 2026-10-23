-- CreateTable
CREATE TABLE `Coordination` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Coordination_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Unit` ADD COLUMN `coordinationId` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `unitId` VARCHAR(191) NULL;

-- Dados: as unidades existentes passam a ser divisões da coordenadoria SERVIN.
-- A antiga unidade "SERVIN" vira o gabinete da coordenadoria (SERVIN-G).
INSERT INTO `Coordination` (`id`, `code`, `name`)
SELECT 'coord-servin', 'SERVIN', 'Coordenadoria de Serviços e Uso Institucional'
FROM DUAL WHERE EXISTS (SELECT 1 FROM `Unit`);
UPDATE `Unit` SET `code` = 'SERVIN-G', `name` = 'Gabinete da Coordenadoria' WHERE `code` = 'SERVIN';
UPDATE `Unit` SET `coordinationId` = 'coord-servin';
-- Servidor com uma única unidade de acesso fica lotado nela.
UPDATE `User` u
JOIN (SELECT `userId`, MIN(`unitId`) AS `unitId` FROM `Membership` GROUP BY `userId` HAVING COUNT(*) = 1) m
  ON m.`userId` = u.`id`
SET u.`unitId` = m.`unitId`;

ALTER TABLE `Unit` MODIFY `coordinationId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Unit` ADD CONSTRAINT `Unit_coordinationId_fkey` FOREIGN KEY (`coordinationId`) REFERENCES `Coordination`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
