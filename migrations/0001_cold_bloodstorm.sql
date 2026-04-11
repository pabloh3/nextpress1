ALTER TABLE "blogs" ADD COLUMN "page_id" uuid;--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
