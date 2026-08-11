/**
 * Shared guard for destructive test scripts.
 * 
 * Every testPhase*.ts and seedPhase9BrowserData.ts must call
 * enforceDestructiveGuard() before connecting to the database.
 * 
 * The script will abort immediately with a clear error if the
 * ALLOW_DESTRUCTIVE_TEST_RUN environment variable is not set to 'true'.
 */

export function enforceDestructiveGuard(): void {
  const envValue = process.env.ALLOW_DESTRUCTIVE_TEST_RUN;

  if (envValue !== 'true') {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║  🛑 DESTRUCTIVE TEST RUN BLOCKED                           ║');
    console.error('║                                                             ║');
    console.error('║  This script calls deleteMany({}) and will WIPE database    ║');
    console.error('║  collections. It requires explicit opt-in.                  ║');
    console.error('║                                                             ║');
    console.error('║  To run: set ALLOW_DESTRUCTIVE_TEST_RUN=true                ║');
    console.error('║                                                             ║');
    console.error('║  Example:                                                   ║');
    console.error('║    ALLOW_DESTRUCTIVE_TEST_RUN=true npx ts-node <script>     ║');
    console.error('║                                                             ║');
    console.error('║  Current value: ' + (envValue === undefined ? '<not set>' : `"${envValue}"`) + '                                       ║'.slice(String(envValue === undefined ? '<not set>' : `"${envValue}"`).length));
    console.error('║  Database was NOT touched. Exiting safely.                  ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error('');
    process.exit(1);
  }

  console.log('✅ ALLOW_DESTRUCTIVE_TEST_RUN=true confirmed. Proceeding with destructive operations...');
}
