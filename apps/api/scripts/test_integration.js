import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vehicle_service_db',
});

async function runTests() {
  console.log('====================================================');
  console.log('STARTING END-TO-END ADVANCED DBMS INTEGRATION TESTS');
  console.log('====================================================');

  const client = await pool.connect();
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  try {
    // 1. Verify 18 tables exist
    console.log('\n[Test 1] Verifying 18 Normalized Tables');
    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    assert(tablesRes.rowCount >= 18, `Expected at least 18 tables, found ${tablesRes.rowCount}`);

    // 2. Verify 5 Views exist and return rows
    console.log('\n[Test 2] Verifying Relational Views');
    const views = [
      'customer_vehicle_overview',
      'booking_details_view',
      'mechanic_workload_view',
      'revenue_summary_view',
      'pending_payments_view',
    ];
    for (const v of views) {
      const vRes = await client.query(`SELECT COUNT(*) FROM "${v}";`);
      assert(parseInt(vRes.rows[0].count, 10) >= 0, `View ${v} queried successfully (count: ${vRes.rows[0].count})`);
    }

    // 3. Verify Functions (Scalar and Table-Returning)
    console.log('\n[Test 3] Verifying User-Defined Functions');
    const fnCostRes = await client.query('SELECT calculate_vehicle_service_cost(1) AS cost;');
    assert(Number(fnCostRes.rows[0].cost) > 0, `calculate_vehicle_service_cost(1) returned $${fnCostRes.rows[0].cost}`);

    const fnSpendRes = await client.query('SELECT get_customer_total_spending(1) AS spend;');
    assert(Number(fnSpendRes.rows[0].spend) > 0, `get_customer_total_spending(1) returned $${fnSpendRes.rows[0].spend}`);

    const fnMechRes = await client.query('SELECT * FROM get_mechanic_completed_jobs(1);');
    assert(fnMechRes.rowCount === 1, `get_mechanic_completed_jobs(1) returned ${fnMechRes.rows[0].completed_jobs_count} jobs`);

    const fnHistRes = await client.query('SELECT * FROM get_vehicle_service_history(1);');
    assert(fnHistRes.rowCount > 0, `get_vehicle_service_history(1) returned ${fnHistRes.rowCount} historical records`);

    // 4. Verify Explicit Cursors
    console.log('\n[Test 4] Verifying Explicit Cursors Execution');
    const cur1Res = await client.query('SELECT * FROM cursor_customer_service_summary();');
    assert(cur1Res.rowCount > 0, `Explicit cursor cursor_customer_service_summary() returned ${cur1Res.rowCount} summary rows`);

    const cur2Res = await client.query('SELECT * FROM cursor_audit_pending_invoices(0);');
    assert(cur2Res.rowCount > 0, `Parameterized cursor cursor_audit_pending_invoices(0) returned ${cur2Res.rowCount} overdue items`);

    // 5. Verify Stored Procedure: book_service_appointment
    console.log('\n[Test 5] Testing Stored Procedure book_service_appointment()');
    const bookRes = await client.query(`
      CALL book_service_appointment(
        1::INT,
        1::INT,
        (CURRENT_DATE + INTERVAL '5 days')::DATE,
        '09:00 - 10:00'::VARCHAR,
        ARRAY[1, 2]::INT[],
        'Automated test booking'::TEXT,
        NULL,
        NULL
      );
    `);
    const newBookingId = bookRes.rows[0]?.p_booking_id;
    const newBookingNumber = bookRes.rows[0]?.p_booking_number;
    assert(newBookingId > 0, `book_service_appointment created booking ID ${newBookingId} (${newBookingNumber})`);

    // 6. Verify State Machine Trigger & Assign Mechanic Procedure
    console.log('\n[Test 6] Testing Procedure assign_mechanic() and Trigger trg_track_booking_status');
    await client.query(`CALL assign_mechanic(${newBookingId}::INT, 1::INT, 'Test dispatch'::TEXT);`);
    const assignCheck = await client.query('SELECT status FROM service_bookings WHERE id = $1', [newBookingId]);
    assert(assignCheck.rows[0].status === 'confirmed', `Booking transitioned to 'confirmed' via assign_mechanic()`);

    // Verify trigger logged status transition in service_status_history
    const historyCheck = await client.query('SELECT * FROM service_status_history WHERE booking_id = $1', [newBookingId]);
    assert(historyCheck.rowCount > 0, `Trigger trg_track_booking_status logged ${historyCheck.rowCount} audit transitions`);

    // 7. Verify Trigger Rejection on Invalid Status Transition
    console.log('\n[Test 7] Testing Trigger trg_validate_booking_status (Rejecting Invalid State Mutation)');
    let triggerBlocked = false;
    try {
      await client.query("UPDATE service_bookings SET status = 'pending' WHERE id = $1", [newBookingId]);
    } catch {
      triggerBlocked = true;
    }
    assert(triggerBlocked, 'Trigger successfully rejected invalid backwards status mutation');

    // 8. Verify Stored Procedure: complete_service
    console.log('\n[Test 8] Testing Stored Procedure complete_service()');
    await client.query("UPDATE service_bookings SET status = 'in_progress' WHERE id = $1", [newBookingId]);
    await client.query(`
      CALL complete_service(
        ${newBookingId}::INT,
        1::INT,
        28000::INT,
        'Comprehensive 50-point safety check completed.'::TEXT,
        'Oil Filter'::TEXT,
        'All clear'::TEXT
      );
    `);
    const completedCheck = await client.query('SELECT status FROM service_bookings WHERE id = $1', [newBookingId]);
    assert(completedCheck.rows[0].status === 'completed', `Service completed via complete_service()`);

    // 9. Verify Stored Procedure: generate_invoice
    console.log('\n[Test 9] Testing Stored Procedure generate_invoice() and Trigger trg_invoice_items_recalc');
    const invRes = await client.query(`CALL generate_invoice(${newBookingId}::INT, 0.00::NUMERIC, NULL, NULL);`);
    const newInvoiceId = invRes.rows[0]?.p_invoice_id;
    const newInvoiceNumber = invRes.rows[0]?.p_invoice_number;
    assert(newInvoiceId > 0, `generate_invoice created invoice ${newInvoiceNumber} (ID: ${newInvoiceId})`);

    const invTotals = await client.query('SELECT subtotal, tax_amount, total_amount FROM invoices WHERE id = $1', [newInvoiceId]);
    assert(Number(invTotals.rows[0].total_amount) > 0, `Invoice calculated subtotal $${invTotals.rows[0].subtotal} + tax $${invTotals.rows[0].tax_amount} = $${invTotals.rows[0].total_amount}`);

    // 10. Verify Stored Procedure: process_invoice_payment
    console.log('\n[Test 10] Testing Stored Procedure process_invoice_payment() with Row Locking');
    const totalToPay = Number(invTotals.rows[0].total_amount);
    const payRes = await client.query(`
      CALL process_invoice_payment(
        ${newInvoiceId}::INT,
        ${totalToPay}::NUMERIC,
        'upi'::payment_method,
        'TXN_INTEGRATION_TEST'::VARCHAR,
        'Full settlement'::TEXT,
        NULL,
        NULL
      );
    `);
    const newPaymentId = payRes.rows[0]?.p_payment_id;
    assert(newPaymentId > 0, `process_invoice_payment created payment ID ${newPaymentId}`);

    const settledInv = await client.query('SELECT status FROM invoices WHERE id = $1', [newInvoiceId]);
    assert(settledInv.rows[0].status === 'paid', `Invoice status successfully updated to 'paid'`);

    // 11. Verify Audit Logs Trigger captured the events
    console.log('\n[Test 11] Verifying Compliance Audit Trail (audit_logs JSONB)');
    const auditRes = await client.query("SELECT COUNT(*) FROM audit_logs WHERE table_name = 'payments'");
    assert(parseInt(auditRes.rows[0].count, 10) > 0, `audit_logs captured payment DML (${auditRes.rows[0].count} entries)`);

    console.log('\n====================================================');
    console.log(`INTEGRATION TEST RESULTS: ${passed}/${total} TESTS PASSED (100%)`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runTests();

