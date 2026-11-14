import { FastifyInstance } from 'fastify';
import { query, getClient } from '../../db/index.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { authenticate, authorizeRole } from '../../middleware/auth.js';
import { DEMO_QUERIES } from './queries-catalog.js';

export async function dbmsRoutes(fastify: FastifyInstance) {
  // Ensure only authenticated admin can access the DBMS Explorer Lab
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', authorizeRole(['admin']));

  // --------------------------------------------------------------------------
  // Overview metrics (Header Cards)
  // --------------------------------------------------------------------------
  fastify.get('/overview', async (request, reply) => {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS total_tables,
        (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') AS total_views,
        (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'p') AS total_procedures,
        (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f') AS total_functions,
        (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') AS total_triggers,
        (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') AS total_indexes,
        2 AS total_cursor_demos,
        ${DEMO_QUERIES.length} AS total_sql_queries
    `);

    return sendSuccess(reply, stats.rows[0], 'DBMS Lab overview metrics loaded');
  });

  // --------------------------------------------------------------------------
  // Section 1: Schema Explorer (Tables, Columns, Constraints, Foreign Keys)
  // --------------------------------------------------------------------------
  fastify.get('/schema', async (request, reply) => {
    // 1. Get all public tables with row counts and disk sizes
    const tablesRes = await query(`
      SELECT 
        t.table_name,
        pg_size_pretty(pg_total_relation_size('"' || t.table_schema || '"."' || t.table_name || '"')) AS total_size,
        pg_size_pretty(pg_relation_size('"' || t.table_schema || '"."' || t.table_name || '"')) AS table_size,
        pg_size_pretty(pg_indexes_size('"' || t.table_schema || '"."' || t.table_name || '"')) AS index_size,
        COALESCE(s.n_live_tup, 0) AS estimated_rows
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name ASC;
    `);

    // 2. Get column metadata
    const columnsRes = await query(`
      SELECT 
        table_name,
        column_name,
        ordinal_position,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position ASC;
    `);

    // 3. Get foreign keys and constraints
    const constraintsRes = await query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name;
    `);

    return sendSuccess(
      reply,
      {
        tables: tablesRes.rows,
        columns: columnsRes.rows,
        constraints: constraintsRes.rows,
      },
      'Database schema introspection loaded'
    );
  });

  // --------------------------------------------------------------------------
  // Section 2: SQL Query Library (40 Categorized Academic Queries)
  // --------------------------------------------------------------------------
  fastify.get('/queries', async (request, reply) => {
    return sendSuccess(reply, DEMO_QUERIES, 'Demonstration SQL query catalog loaded');
  });

  // Execute a selected demonstration query safely
  fastify.post('/queries/:id/execute', async (request, reply) => {
    const { id } = request.params as { id: string };
    const queryId = parseInt(id, 10);
    const demo = DEMO_QUERIES.find((q) => q.id === queryId);

    if (!demo) {
      return sendError(reply, 'Query not found in catalog', 404);
    }

    try {
      const start = Date.now();
      const res = await query(demo.sql);
      const executionTimeMs = Date.now() - start;

      return sendSuccess(
        reply,
        {
          id: demo.id,
          title: demo.title,
          concept: demo.concept,
          rows: res.rows || [],
          rowCount: res.rowCount || (res.rows ? res.rows.length : 0),
          fields: res.fields ? res.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })) : [],
          executionTimeMs,
        },
        'Query executed against live PostgreSQL engine'
      );
    } catch (err: any) {
      return sendError(reply, err.message, 400);
    }
  });

  // --------------------------------------------------------------------------
  // Section 3: Stored Procedures Introspection
  // --------------------------------------------------------------------------
  fastify.get('/procedures', async (request, reply) => {
    const res = await query(`
      SELECT 
        p.proname AS procedure_name,
        pg_get_function_arguments(p.oid) AS arguments,
        pg_get_functiondef(p.oid) AS definition,
        d.description
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      LEFT JOIN pg_description d ON d.objoid = p.oid
      WHERE n.nspname = 'public' 
        AND p.prokind = 'p'
      ORDER BY p.proname ASC;
    `);

    return sendSuccess(reply, res.rows, 'Stored procedures introspected from PostgreSQL pg_proc catalog');
  });

  // --------------------------------------------------------------------------
  // Section 4: User-Defined Functions Introspection
  // --------------------------------------------------------------------------
  fastify.get('/functions', async (request, reply) => {
    const res = await query(`
      SELECT 
        p.proname AS function_name,
        pg_get_function_result(p.oid) AS return_type,
        pg_get_function_arguments(p.oid) AS arguments,
        pg_get_functiondef(p.oid) AS definition,
        d.description
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      LEFT JOIN pg_description d ON d.objoid = p.oid
      WHERE n.nspname = 'public' 
        AND p.prokind = 'f'
        AND p.proname NOT LIKE 'trigger_%'
      ORDER BY p.proname ASC;
    `);

    return sendSuccess(reply, res.rows, 'User-defined functions introspected from PostgreSQL catalog');
  });

  // --------------------------------------------------------------------------
  // Section 5: Triggers Introspection
  // --------------------------------------------------------------------------
  fastify.get('/triggers', async (request, reply) => {
    const res = await query(`
      SELECT 
        trg.tgname AS trigger_name,
        tbl.relname AS table_name,
        CASE 
          WHEN (trg.tgtype & 2) != 0 THEN 'BEFORE'
          WHEN (trg.tgtype & 64) != 0 THEN 'INSTEAD OF'
          ELSE 'AFTER'
        END AS action_timing,
        ARRAY_TO_STRING(ARRAY[
          CASE WHEN (trg.tgtype & 4) != 0 THEN 'INSERT' ELSE NULL END,
          CASE WHEN (trg.tgtype & 8) != 0 THEN 'DELETE' ELSE NULL END,
          CASE WHEN (trg.tgtype & 16) != 0 THEN 'UPDATE' ELSE NULL END
        ], ' OR ') AS event_manipulation,
        p.proname AS function_name,
        pg_get_functiondef(p.oid) AS function_definition
      FROM pg_trigger trg
      JOIN pg_class tbl ON trg.tgrelid = tbl.oid
      JOIN pg_proc p ON trg.tgfoid = p.oid
      JOIN pg_namespace n ON tbl.relnamespace = n.oid
      WHERE n.nspname = 'public'
        AND NOT trg.tgisinternal
      ORDER BY tbl.relname, trg.tgname;
    `);

    return sendSuccess(reply, res.rows, 'Triggers introspected from PostgreSQL pg_trigger catalog');
  });

  // --------------------------------------------------------------------------
  // Section 6: Cursor Demonstrations (Execute PL/pgSQL Cursors)
  // --------------------------------------------------------------------------
  fastify.get('/cursors', async (request, reply) => {
    // 1. Execute Cursor 1: cursor_customer_service_summary
    const cursor1Res = await query('SELECT * FROM cursor_customer_service_summary();');

    // 2. Execute Cursor 2: cursor_audit_pending_invoices
    const cursor2Res = await query('SELECT * FROM cursor_audit_pending_invoices(0);');

    // 3. Introspect cursor function source code
    const defRes = await query(`
      SELECT proname, pg_get_functiondef(oid) AS source_code
      FROM pg_proc
      WHERE proname IN ('cursor_customer_service_summary', 'cursor_audit_pending_invoices');
    `);

    return sendSuccess(
      reply,
      {
        cursorSummary: {
          title: 'Explicit Cursor 1: Completed Bookings & Customer Milestone Aggregator',
          concept: 'Traditional Explicit Cursor (DECLARE cur CURSOR, OPEN, FETCH INTO record, EXIT WHEN NOT FOUND, CLOSE)',
          rows: cursor1Res.rows,
          sourceCode: defRes.rows.find((r) => r.proname === 'cursor_customer_service_summary')?.source_code,
        },
        cursorAging: {
          title: 'Parameterized Cursor 2: Overdue Invoices & Interest Audit Ledger',
          concept: 'Parameterized Cursor with Overdue Interest Calculation & Urgency Tiers',
          rows: cursor2Res.rows,
          sourceCode: defRes.rows.find((r) => r.proname === 'cursor_audit_pending_invoices')?.source_code,
        },
      },
      'Cursor demonstrations executed successfully'
    );
  });

  // --------------------------------------------------------------------------
  // Section 7: Views Introspection & Sample Data
  // --------------------------------------------------------------------------
  fastify.get('/views', async (request, reply) => {
    const viewsDef = await query(`
      SELECT 
        table_name AS view_name,
        view_definition
      FROM information_schema.views
      WHERE table_schema = 'public'
      ORDER BY table_name ASC;
    `);

    const viewDetails = await Promise.all(
      viewsDef.rows.map(async (v) => {
        try {
          const sample = await query(`SELECT * FROM "${v.view_name}" LIMIT 5;`);
          return {
            ...v,
            sampleRows: sample.rows,
            rowCount: sample.rowCount,
          };
        } catch {
          return {
            ...v,
            sampleRows: [],
            rowCount: 0,
          };
        }
      })
    );

    return sendSuccess(reply, viewDetails, 'Views introspected with sample outputs');
  });

  // --------------------------------------------------------------------------
  // Section 8: Index Explorer (B-Tree, Partial, Composite, Size, Scans)
  // --------------------------------------------------------------------------
  fastify.get('/indexes', async (request, reply) => {
    const res = await query(`
      SELECT 
        i.indexname AS index_name,
        i.tablename AS table_name,
        i.indexdef AS index_definition,
        s.idx_scan AS scan_count,
        s.idx_tup_read AS tuples_read,
        s.idx_tup_fetch AS tuples_fetched,
        pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size
      FROM pg_indexes i
      LEFT JOIN pg_stat_user_indexes s ON s.indexrelname = i.indexname AND s.schemaname = i.schemaname
      WHERE i.schemaname = 'public'
      ORDER BY s.idx_scan DESC, i.tablename ASC;
    `);

    // EXPLAIN ANALYZE demonstration
    const explainRes = await query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT sb.booking_number, sb.status, u.full_name
      FROM service_bookings sb
      JOIN customers c ON c.id = sb.customer_id
      JOIN users u ON u.id = c.user_id
      WHERE sb.status = 'completed';
    `);

    return sendSuccess(
      reply,
      {
        indexes: res.rows,
        explainAnalyzeSample: explainRes.rows[0],
      },
      'Index explorer metadata loaded'
    );
  });

  // --------------------------------------------------------------------------
  // Section 9: Live Transaction & ACID Simulation (COMMIT, ROLLBACK, SAVEPOINT)
  // --------------------------------------------------------------------------
  fastify.post('/transactions/simulate', async (request, reply) => {
    const client = await getClient();
    const traceLog: { step: number; action: string; status: string; detail: string }[] = [];

    try {
      // Step 1: BEGIN TRANSACTION
      traceLog.push({ step: 1, action: 'BEGIN TRANSACTION', status: 'SUCCESS', detail: 'Started new ACID transaction block in PostgreSQL.' });
      await client.query('BEGIN');

      // Step 2: Valid UPDATE on User phone
      traceLog.push({ step: 2, action: 'UPDATE users phone', status: 'SUCCESS', detail: 'Updated Priya Singh phone to +91 99999 88888.' });
      await client.query("UPDATE users SET phone = '+91 99999 88888' WHERE email = 'customer@example.com'");

      // Step 3: SAVEPOINT creation
      traceLog.push({ step: 3, action: 'SAVEPOINT sp_checkpoint_1', status: 'SUCCESS', detail: 'Created sub-transaction savepoint sp_checkpoint_1.' });
      await client.query('SAVEPOINT sp_checkpoint_1');

      // Step 4: Invalid operation triggering CHECK constraint violation
      let errorEncountered = false;
      try {
        traceLog.push({
          step: 4,
          action: 'VIOLATE CHECK CONSTRAINT',
          status: 'ATTEMPTING',
          detail: 'Executing UPDATE with negative total_estimated_cost (-999.00). Expecting check constraint violation.',
        });
        await client.query('UPDATE service_bookings SET total_estimated_cost = -999.00 WHERE id = 1');
      } catch (checkErr: any) {
        errorEncountered = true;
        traceLog.push({
          step: 4,
          action: 'CHECK CONSTRAINT VIOLATION CAUGHT',
          status: 'EXPECTED_ERROR',
          detail: `PostgreSQL rejected DML: ${checkErr.message}`,
        });
      }

      // Step 5: Partial rollback to SAVEPOINT
      if (errorEncountered) {
        traceLog.push({
          step: 5,
          action: 'ROLLBACK TO SAVEPOINT sp_checkpoint_1',
          status: 'SUCCESS',
          detail: 'Cleanly rolled back erroneous DML to savepoint without aborting entire transaction.',
        });
        await client.query('ROLLBACK TO SAVEPOINT sp_checkpoint_1');
      }

      // Step 6: Valid INSERT into audit_logs
      traceLog.push({
        step: 6,
        action: 'INSERT AUDIT LOG',
        status: 'SUCCESS',
        detail: 'Logged successful transaction demonstration entry into audit_logs table.',
      });
      await client.query(`
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data)
        VALUES ('transaction_simulation', 1, 'INSERT', NULL, '{"simulation": "savepoint_and_acid_verified"}'::jsonb)
      `);

      // Step 7: COMMIT TRANSACTION
      traceLog.push({
        step: 7,
        action: 'COMMIT',
        status: 'SUCCESS',
        detail: 'Committed entire transaction durably to disk. Atomicity, Consistency, Isolation, Durability verified.',
      });
      await client.query('COMMIT');

      return sendSuccess(reply, { traceLog, success: true }, 'ACID transaction simulation executed');
    } catch (fatalErr: any) {
      await client.query('ROLLBACK');
      traceLog.push({ step: 99, action: 'FULL ROLLBACK', status: 'ERROR', detail: fatalErr.message });
      return sendError(reply, 'Transaction failed', 500, { traceLog, error: fatalErr.message });
    } finally {
      client.release();
    }
  });

  // --------------------------------------------------------------------------
  // Section 10: PostgreSQL Engine Diagnostics & System Catalogs
  // --------------------------------------------------------------------------
  fastify.get('/statistics', async (request, reply) => {
    // Database size, buffer hits, version
    const dbStats = await query(`
      SELECT 
        current_database() AS database_name,
        version() AS postgres_version,
        pg_size_pretty(pg_database_size(current_database())) AS database_total_size,
        (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()) AS active_connections
    `);

    // Table disk footprints
    const tableFootprint = await query(`
      SELECT 
        relname AS table_name,
        n_live_tup AS live_tuples,
        n_dead_tup AS dead_tuples,
        pg_size_pretty(pg_total_relation_size(relid)) AS total_disk_size,
        pg_size_pretty(pg_relation_size(relid)) AS data_size,
        pg_size_pretty(pg_indexes_size(relid)) AS index_size
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(relid) DESC;
    `);

    return sendSuccess(
      reply,
      {
        general: dbStats.rows[0],
        tables: tableFootprint.rows,
      },
      'Database statistics loaded'
    );
  });
}

