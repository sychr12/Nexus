# Database migrations

The database schema is managed by Flyway. Hibernate only validates that the
entities match the migrated schema and must not create or update tables.

## Rules

- Never edit a migration that has already been applied to a shared database.
- Add changes as a new sequential file in `src/main/resources/db/migration`.
- Use names such as `V2__add_cpf_search_hash.sql`.
- Back up the production database before the first Flyway deployment and before
  every migration that changes existing data.
- Run `mvnw.cmd clean test` before deployment. Tests migrate an empty H2 database
  and then validate every JPA entity against it.

## Existing databases

Development and production use `baseline-on-migrate=true` with baseline version
`0`. On the first startup, Flyway registers the existing schema and applies V1.
V1 only creates missing tables and indexes; it does not drop data.

After every deployment, confirm that `flyway_schema_history` contains the
expected successful version before allowing user traffic.
