CREATE TABLE `auth_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_tokens_token_hash_unique` ON `auth_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `auth_tokens_email_idx` ON `auth_tokens` (`email`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_login_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);