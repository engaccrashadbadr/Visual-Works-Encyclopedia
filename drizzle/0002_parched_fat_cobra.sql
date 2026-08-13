CREATE TABLE `entityRelations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromEntityId` int NOT NULL,
	`toEntityId` int NOT NULL,
	`relationType` enum('co_appearance','family','ally','rival','mentor','team') NOT NULL,
	`label` varchar(255),
	CONSTRAINT `entityRelations_id` PRIMARY KEY(`id`),
	CONSTRAINT `entity_rel_unique_idx` UNIQUE(`fromEntityId`,`toEntityId`,`relationType`)
);
--> statement-breakpoint
ALTER TABLE `entities` ADD `externalId` varchar(128);--> statement-breakpoint
ALTER TABLE `entities` ADD `source` varchar(32);--> statement-breakpoint
ALTER TABLE `entities` ADD CONSTRAINT `entities_external_idx` UNIQUE(`source`,`externalId`);--> statement-breakpoint
CREATE INDEX `entity_rel_from_idx` ON `entityRelations` (`fromEntityId`);--> statement-breakpoint
CREATE INDEX `entity_rel_to_idx` ON `entityRelations` (`toEntityId`);