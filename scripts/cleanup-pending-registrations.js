#!/usr/bin/env node

/**
 * Cleanup script for expired pending registrations
 * Run this as a cron job (e.g., every hour) to remove expired pending registrations
 * 
 * Usage:
 *   node scripts/cleanup-pending-registrations.js
 * 
 * Or add to cron:
 *   0 * * * * cd /path/to/matrimonial-app && node scripts/cleanup-pending-registrations.js
 */

import { execute } from '../lib/db.js';

async function cleanupExpiredPendingRegistrations() {
  try {
    console.log('[Cleanup] Starting cleanup of expired pending registrations...');
    
    const result = await execute(
      'DELETE FROM pending_registration WHERE otpExpiresAt < NOW()'
    );
    
    console.log(`[Cleanup] Removed ${result.affectedRows} expired pending registration(s)`);
    
    process.exit(0);
  } catch (err) {
    console.error('[Cleanup] Error:', err);
    process.exit(1);
  }
}

cleanupExpiredPendingRegistrations();
