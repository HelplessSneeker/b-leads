DROP TABLE `replies`;--> statement-breakpoint
CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`type` text NOT NULL,
	`subject` text,
	`body` text NOT NULL,
	`occurred_at` integer DEFAULT (unixepoch()) NOT NULL,
	`llm_classification` text,
	`llm_draft` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activities_lead_id_idx` ON `activities` (`lead_id`);
