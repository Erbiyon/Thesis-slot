-- CreateTable
CREATE TABLE `examination_committee_member` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(255) NOT NULL,
    `facultyProfileId` VARCHAR(255) NOT NULL,
    `responsibility` ENUM('CHAIR', 'COMMITTEE', 'ADVISOR', 'CO_ADVISOR', 'EXTERNAL') NOT NULL DEFAULT 'COMMITTEE',
    `invitationStatus` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `assignedByUserId` VARCHAR(255) NOT NULL,
    `respondedAt` DATETIME(3) NULL,
    `responseReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `examination_committee_member_projectId_idx`(`projectId`),
    INDEX `examination_committee_member_facultyProfileId_idx`(`facultyProfileId`),
    INDEX `examination_committee_member_invitationStatus_idx`(`invitationStatus`),
    UNIQUE INDEX `examination_committee_member_projectId_facultyProfileId_key`(`projectId`, `facultyProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faculty_availability` (
    `id` VARCHAR(191) NOT NULL,
    `facultyProfileId` VARCHAR(255) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `availabilityType` ENUM('AVAILABLE', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
    `note` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `faculty_availability_facultyProfileId_idx`(`facultyProfileId`),
    INDEX `faculty_availability_startAt_endAt_idx`(`startAt`, `endAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `examination_booking` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(255) NOT NULL,
    `examinationRoomId` VARCHAR(255) NOT NULL,
    `academicTermId` VARCHAR(255) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'PENDING_REVIEW', 'CONFIRMED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_REVIEW',
    `requestedByUserId` VARCHAR(255) NOT NULL,
    `reviewedByUserId` VARCHAR(255) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewReason` TEXT NULL,
    `confirmedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `examination_booking_projectId_idx`(`projectId`),
    INDEX `examination_booking_examinationRoomId_idx`(`examinationRoomId`),
    INDEX `examination_booking_academicTermId_idx`(`academicTermId`),
    INDEX `examination_booking_startAt_endAt_idx`(`startAt`, `endAt`),
    INDEX `examination_booking_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `examination_booking_history` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(255) NOT NULL,
    `actorUserId` VARCHAR(255) NOT NULL,
    `action` ENUM('SUBMIT_REQUEST', 'CONFIRM_BOOKING', 'REJECT_BOOKING', 'CANCEL_BOOKING', 'RESCHEDULE_BOOKING') NOT NULL,
    `previousStatus` ENUM('DRAFT', 'PENDING_REVIEW', 'CONFIRMED', 'REJECTED', 'CANCELLED') NULL,
    `newStatus` ENUM('DRAFT', 'PENDING_REVIEW', 'CONFIRMED', 'REJECTED', 'CANCELLED') NOT NULL,
    `details` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `examination_booking_history_bookingId_idx`(`bookingId`),
    INDEX `examination_booking_history_actorUserId_idx`(`actorUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scheduling_lock` (
    `id` VARCHAR(191) NOT NULL,
    `lockKey` VARCHAR(191) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `scheduling_lock_lockKey_key`(`lockKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `examination_committee_member` ADD CONSTRAINT `examination_committee_member_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `academic_project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examination_committee_member` ADD CONSTRAINT `examination_committee_member_facultyProfileId_fkey` FOREIGN KEY (`facultyProfileId`) REFERENCES `faculty_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examination_committee_member` ADD CONSTRAINT `examination_committee_member_assignedByUserId_fkey` FOREIGN KEY (`assignedByUserId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faculty_availability` ADD CONSTRAINT `faculty_availability_facultyProfileId_fkey` FOREIGN KEY (`facultyProfileId`) REFERENCES `faculty_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examination_booking` ADD CONSTRAINT `examination_booking_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `academic_project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examination_booking` ADD CONSTRAINT `examination_booking_examinationRoomId_fkey` FOREIGN KEY (`examinationRoomId`) REFERENCES `examination_room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examination_booking` ADD CONSTRAINT `examination_booking_academicTermId_fkey` FOREIGN KEY (`academicTermId`) REFERENCES `academic_term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examination_booking` ADD CONSTRAINT `examination_booking_requestedByUserId_fkey` FOREIGN KEY (`requestedByUserId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examination_booking` ADD CONSTRAINT `examination_booking_reviewedByUserId_fkey` FOREIGN KEY (`reviewedByUserId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examination_booking_history` ADD CONSTRAINT `examination_booking_history_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `examination_booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examination_booking_history` ADD CONSTRAINT `examination_booking_history_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
