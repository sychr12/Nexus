package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Locale;

public class V4__NormalizeCarteiraBinaryColumns extends BaseJavaMigration {

    private static final List<BinaryColumn> BINARY_COLUMNS = List.of(
            new BinaryColumn("carteira_digital", "pdf_conteudo"),
            new BinaryColumn("carteira_fotos", "conteudo"),
            new BinaryColumn("carteiras_digitais", "pdf_conteudo"),
            new BinaryColumn("carteiras_digitais", "foto1"),
            new BinaryColumn("carteiras_digitais", "foto2"),
            new BinaryColumn("carteiras_digitais", "foto3"),
            new BinaryColumn("memorandos", "arquivo_word")
    );

    @Override
    public void migrate(Context context) throws Exception {
        Connection connection = context.getConnection();
        if (!isPostgreSql(connection)) {
            return;
        }

        boolean helperCreated = false;
        try (Statement statement = connection.createStatement()) {
            for (BinaryColumn column : BINARY_COLUMNS) {
                if (!isOidColumn(connection, column)) {
                    continue;
                }

                if (!helperCreated) {
                    createLargeObjectHelper(statement);
                    helperCreated = true;
                }

                statement.execute("""
                        ALTER TABLE %s
                        ALTER COLUMN %s TYPE BYTEA
                        USING sicpr_lo_get_or_null(%s)
                        """.formatted(
                        quoteIdentifier(column.tableName()),
                        quoteIdentifier(column.columnName()),
                        quoteIdentifier(column.columnName())
                ));
            }
        } finally {
            if (helperCreated) {
                try (Statement statement = connection.createStatement()) {
                    statement.execute("DROP FUNCTION IF EXISTS sicpr_lo_get_or_null(oid)");
                }
            }
        }
    }

    private boolean isPostgreSql(Connection connection) throws SQLException {
        return connection.getMetaData()
                .getDatabaseProductName()
                .toLowerCase(Locale.ROOT)
                .contains("postgresql");
    }

    private boolean isOidColumn(Connection connection, BinaryColumn column) throws SQLException {
        String sql = """
                SELECT udt_name
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = ?
                  AND column_name = ?
                """;

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, column.tableName());
            statement.setString(2, column.columnName());

            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() && "oid".equalsIgnoreCase(resultSet.getString("udt_name"));
            }
        }
    }

    private void createLargeObjectHelper(Statement statement) throws SQLException {
        statement.execute("""
                CREATE OR REPLACE FUNCTION sicpr_lo_get_or_null(lo_value oid)
                RETURNS bytea
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    IF lo_value IS NULL THEN
                        RETURN NULL;
                    END IF;

                    RETURN lo_get(lo_value);
                EXCEPTION WHEN OTHERS THEN
                    RETURN NULL;
                END;
                $$;
                """);
    }

    private String quoteIdentifier(String identifier) {
        return "\"" + identifier.replace("\"", "\"\"") + "\"";
    }

    private record BinaryColumn(String tableName, String columnName) {
    }
}
