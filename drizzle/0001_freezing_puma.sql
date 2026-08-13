CREATE TABLE `entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('character','unit','weapon','vehicle','creature') NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`imageUrl` varchar(1024),
	`description` text,
	`descriptionAr` text,
	`abilities` text,
	`relationships` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `entities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `franchises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`universeId` int,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`description` text,
	`coverImageUrl` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `franchises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `syncRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(32) NOT NULL,
	`status` enum('running','success','failed') NOT NULL,
	`itemsProcessed` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`finishedAt` timestamp,
	CONSTRAINT `syncRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `universes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `universes_id` PRIMARY KEY(`id`),
	CONSTRAINT `universes_name_idx` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `workEntities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workId` int NOT NULL,
	`entityId` int NOT NULL,
	`role` varchar(128),
	`isMain` int NOT NULL DEFAULT 0,
	CONSTRAINT `workEntities_id` PRIMARY KEY(`id`),
	CONSTRAINT `work_entity_unique_idx` UNIQUE(`workId`,`entityId`)
);
--> statement-breakpoint
CREATE TABLE `workRelations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromWorkId` int NOT NULL,
	`toWorkId` int NOT NULL,
	`relationType` enum('sequel','side_story','remake','reboot','prequel','spin_off') NOT NULL,
	`chronologicalOrder` int,
	`releaseOrder` int,
	CONSTRAINT `workRelations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `works` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(128),
	`source` varchar(32),
	`franchiseId` int,
	`universeId` int,
	`title` varchar(500) NOT NULL,
	`titleAr` varchar(500),
	`type` enum('anime','film','series','ova','animation') NOT NULL,
	`releaseYear` int,
	`releaseDate` timestamp,
	`studio` varchar(255),
	`director` varchar(255),
	`ageRating` varchar(32),
	`score` decimal(4,2),
	`summary` text,
	`summaryAr` text,
	`episodeCount` int,
	`durationMinutes` int,
	`coverImageUrl` varchar(1024),
	`bannerImageUrl` varchar(1024),
	`canonLabel` varchar(128),
	`popularity` int NOT NULL DEFAULT 0,
	`isFeatured` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `works_id` PRIMARY KEY(`id`),
	CONSTRAINT `works_external_idx` UNIQUE(`source`,`externalId`)
);
--> statement-breakpoint
CREATE INDEX `entities_kind_idx` ON `entities` (`kind`);--> statement-breakpoint
CREATE INDEX `entities_name_idx` ON `entities` (`name`,`nameAr`);--> statement-breakpoint
CREATE INDEX `franchises_universe_idx` ON `franchises` (`universeId`);--> statement-breakpoint
CREATE INDEX `work_entities_work_idx` ON `workEntities` (`workId`);--> statement-breakpoint
CREATE INDEX `work_entities_entity_idx` ON `workEntities` (`entityId`);--> statement-breakpoint
CREATE INDEX `work_rel_from_idx` ON `workRelations` (`fromWorkId`);--> statement-breakpoint
CREATE INDEX `work_rel_to_idx` ON `workRelations` (`toWorkId`);--> statement-breakpoint
CREATE INDEX `works_search_idx` ON `works` (`title`,`titleAr`);--> statement-breakpoint
CREATE INDEX `works_filters_idx` ON `works` (`type`,`releaseYear`,`studio`);