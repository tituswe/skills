# Data

Does the change keep stored data and its callers safe through the deploy?

## Migrations

- Old code runs on the new schema, and new code on the old: deploys are not instant.
- Renames and drops go expand, migrate, contract. A dropped or renamed column is no longer read.
- Locks on large tables are short. Timeouts are set where the database supports them.
- Backfills are separate, batched and idempotent.
- New constraints and `NOT NULL` hold for every existing row.
- It is reversible, or says it is not. Destructive steps follow a backup.
- The schema source and the migrations agree, when the repo keeps both.

## APIs and shared types

- Fields are added, not removed or renamed. Inputs stay optional. Types, defaults and behaviour hold, or callers get a migration path.
