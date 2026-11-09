-- CreateTable
CREATE TABLE `academic_project` (
    `id` VARCHAR(191) NOT NULL,
    `projectType` ENUM('PROJECT', 'THESIS') NOT NULL DEFAULT 'PROJECT',
    `titleTh` VARCHAR(500) NOT NULL,
    `titleEn` VARCHAR(500) NULL,
    `abstractTh` TEXT NULL,
    `academicProgramId` VARCHAR(255) NOT NULL,
    `academicTermId` VARCHAR(255) NOT NULL,
    `createdByUserId` VARCHAR(255) NOT NULL,
    `reviewStatus` ENUM('DRAFT', 'SUBMITTED', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `submittedAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `academic_project_academicProgramId_idx`(`academicProgramId`),
    INDEX `academic_project_academicTermId_idx`(`academicTermId`),
    INDEX `academic_project_createdByUserId_idx`(`createdByUserId`),
    INDEX `academic_project_reviewStatus_idx`(`reviewStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_member` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(255) NOT NULL,
    `studentProfileId` VARCHAR(255) NOT NULL,
    `memberRole` ENUM('LEADER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `membershipStatus` ENUM('INVITED', 'ACCEPTED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'INVITED',
    `invitedByUserId` VARCHAR(255) NOT NULL,
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `project_member_projectId_idx`(`projectId`),
    INDEX `project_member_studentProfileId_idx`(`studentProfileId`),
    INDEX `project_member_membershipStatus_idx`(`membershipStatus`),
    UNIQUE INDEX `project_member_projectId_studentProfileId_key`(`projectId`, `studentProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `advisor_request` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(255) NOT NULL,
    `facultyProfileId` VARCHAR(255) NOT NULL,
    `requestedByUserId` VARCHAR(255) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `responseReason` TEXT NULL,
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `advisor_request_projectId_idx`(`projectId`),
    INDEX `advisor_request_facultyProfileId_idx`(`facultyProfileId`),
    INDEX `advisor_request_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_review` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(255) NOT NULL,
    `reviewedByUserId` VARCHAR(255) NOT NULL,
    `decision` ENUM('DRAFT', 'SUBMITTED', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL,
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `project_review_projectId_idx`(`projectId`),
    INDEX `project_review_reviewedByUserId_idx`(`reviewedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_activity` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(255) NOT NULL,
    `actorUserId` VARCHAR(255) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `details` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `project_activity_projectId_idx`(`projectId`),
    INDEX `project_activity_actorUserId_idx`(`actorUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `academic_project` ADD CONSTRAINT `academic_project_academicProgramId_fkey` FOREIGN KEY (`academicProgramId`) REFERENCES `academic_program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_project` ADD CONSTRAINT `academic_project_academicTermId_fkey` FOREIGN KEY (`academicTermId`) REFERENCES `academic_term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_project` ADD CONSTRAINT `academic_project_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_member` ADD CONSTRAINT `project_member_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `academic_project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_member` ADD CONSTRAINT `project_member_studentProfileId_fkey` FOREIGN KEY (`studentProfileId`) REFERENCES `student_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_member` ADD CONSTRAINT `project_member_invitedByUserId_fkey` FOREIGN KEY (`invitedByUserId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `advisor_request` ADD CONSTRAINT `advisor_request_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `academic_project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `advisor_request` ADD CONSTRAINT `advisor_request_facultyProfileId_fkey` FOREIGN KEY (`facultyProfileId`) REFERENCES `faculty_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `advisor_request` ADD CONSTRAINT `advisor_request_requestedByUserId_fkey` FOREIGN KEY (`requestedByUserId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_review` ADD CONSTRAINT `project_review_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `academic_project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_review` ADD CONSTRAINT `project_review_reviewedByUserId_fkey` FOREIGN KEY (`reviewedByUserId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_activity` ADD CONSTRAINT `project_activity_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `academic_project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_activity` ADD CONSTRAINT `project_activity_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
