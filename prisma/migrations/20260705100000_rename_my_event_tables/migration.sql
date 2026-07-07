-- My Event: rename organizer tables to dedicated PostgreSQL tables
ALTER TABLE "Organizer" RENAME TO "MyEventOrganizer";
ALTER TABLE "OrganizerUser" RENAME TO "MyEventUser";

-- Tag My Event sourced events consistently
UPDATE "Event" SET "source" = 'my_event' WHERE "source" = 'organizer';
