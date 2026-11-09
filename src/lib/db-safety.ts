/**
 * Critical Safety Guard for Database Operations in Tests
 *
 * Ensures tests CAN NEVER run against:
 * 1. Development database (thesis_slot_dev)
 * 2. External project databases (timetable_db, timetable_e2e, etc.)
 * 3. Unapproved or missing database connection
 */
export function assertTestDatabase(): void {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "[DatabaseSafetyError] DATABASE_URL is not set. Tests must define an explicit connection to thesis_slot_test."
    );
  }

  // Must contain thesis_slot_test in database path
  const isTestDb =
    url.endsWith("/thesis_slot_test") || url.includes("/thesis_slot_test?");

  if (!isTestDb) {
    throw new Error(
      `[DatabaseSafetyError] DANGER: Attempted to run test against a non-test database! URL does not target 'thesis_slot_test'. Current target is strictly forbidden.`
    );
  }

  // Explicit check against forbidden databases
  if (
    url.includes("thesis_slot_dev") ||
    url.includes("timetable_db") ||
    url.includes("timetable_e2e")
  ) {
    throw new Error(
      "[DatabaseSafetyError] VIOLATION: Target URL targets a protected database! Execution aborted."
    );
  }
}
