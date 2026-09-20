import { matchError } from '../lib/matching';
import { logResolution } from '../lib/capture';
import { getStats } from '../lib/stats';
import { isConfigured, verifyConnection } from '../lib/neo4j';

async function testMcpLoop() {
  console.log('--- Testing Errata MCP & Capture Loop ---');

  const configured = isConfigured();
  console.log(`Neo4j Configured: ${configured}`);
  if (configured) {
    const status = await verifyConnection();
    console.log(`Neo4j Online Status: ${status.connected ? 'CONNECTED (' + status.latencyMs + 'ms)' : 'DISCONNECTED: ' + status.error}`);
  }

  const testErrorMsg = 'Error: listen EADDRINUSE: address already in use :::4000';

  console.log('\n1. Checking error for the first time...');
  const firstCheck = await matchError({
    error_message: testErrorMsg,
    technology: ['node', 'express'],
  });
  console.log('First check match:', firstCheck.match);

  console.log('\n2. Logging resolution...');
  const logResult = await logResolution({
    error_message: testErrorMsg,
    root_cause: 'Port 4000 already occupied by another test daemon.',
    fix: 'Killed process using port 4000 and restarted.',
    explanation: 'Demonstrating the Errata capture loop.',
    technology: ['node', 'express'],
    concepts: ['ports', 'process-lifecycle'],
    user_solved_unaided: false,
  });
  console.log('Log result notice:', logResult.notice);
  console.log('Generated doc path:', logResult.doc_path);

  console.log('\n3. Checking error a second time (should match!)...');
  const secondCheck = await matchError({
    error_message: 'Error: listen EADDRINUSE: address already in use :::8080',
    technology: ['node', 'express'],
  });
  console.log('Second check match:', secondCheck.match);
  console.log('Occurrence count:', secondCheck.occurrence_count);
  console.log('Interrupt prompt:', secondCheck.interrupt_prompt);

  console.log('\n4. Fetching Errata stats...');
  const stats = await getStats();
  console.log('Total classes:', stats.totalErrorClasses);
  console.log('Total occurrences:', stats.totalOccurrences);
  console.log('Top recurring:', stats.topRecurring.map((t) => `${t.title} (${t.occurrences}x)`));

  console.log('\n--- Capture Loop Test Succeeded! ---');
}

testMcpLoop().catch((err) => {
  console.error('Test loop failed:', err);
  process.exit(1);
});
