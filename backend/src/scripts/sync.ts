#!/usr/bin/env ts-node
/**
 * CLI script to sync all Polymarket data
 *
 * Usage:
 *   npx ts-node src/scripts/sync.ts --full     # Full sync (first time)
 *   npx ts-node src/scripts/sync.ts --prices   # Just update prices
 *   npx ts-node src/scripts/sync.ts --stats    # Show current stats
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { BulkSyncService } from '../services/BulkSyncService';
import { IncrementalSyncService } from '../services/IncrementalSyncService';
import { config } from '../config';

const prisma = new PrismaClient();
const redis = new Redis(config.redisUrl);

async function showStats() {
  console.log('\n📊 Database Statistics\n');

  const categories = await prisma.category.findMany({
    orderBy: { marketCount: 'desc' },
  });

  console.log('Categories:');
  for (const cat of categories) {
    console.log(`  ${cat.icon} ${cat.name}: ${cat.marketCount} markets`);
  }

  const totalMarkets = await prisma.market.count();
  const activeMarkets = await prisma.market.count({ where: { active: true } });
  const resolvedMarkets = await prisma.market.count({ where: { resolved: true } });
  const totalEvents = await prisma.event.count();

  console.log('\nMarkets:');
  console.log(`  Total: ${totalMarkets}`);
  console.log(`  Active: ${activeMarkets}`);
  console.log(`  Resolved: ${resolvedMarkets}`);
  console.log(`  Events: ${totalEvents}`);

  // Top markets by volume
  const topMarkets = await prisma.market.findMany({
    where: { active: true },
    orderBy: { totalVolume: 'desc' },
    take: 5,
    select: { question: true, totalVolume: true, yesPrice: true },
  });

  console.log('\nTop Markets by Volume:');
  for (const m of topMarkets) {
    const vol = Number(m.totalVolume).toLocaleString();
    const price = (Number(m.yesPrice) * 100).toFixed(0);
    console.log(`  [${price}¢] $${vol} - ${m.question.substring(0, 50)}...`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--stats';

  try {
    switch (command) {
      case '--full':
        console.log('🚀 Starting full Polymarket sync...\n');
        const bulkSync = new BulkSyncService(prisma, redis);

        bulkSync.on('progress', (stats) => {
          process.stdout.write(
            `\r  Events: ${stats.eventsSynced}/${stats.eventsTotal} | ` +
            `Markets: ${stats.marketsSynced}/${stats.marketsTotal} | ` +
            `Errors: ${stats.errors}`
          );
        });

        const stats = await bulkSync.fullSync();
        console.log('\n');
        await showStats();
        break;

      case '--prices':
        console.log('💰 Updating prices...\n');
        const incrementalSync = new IncrementalSyncService(prisma, redis);
        await incrementalSync.syncPrices();
        console.log('Done!');
        break;

      case '--new':
        console.log('🔍 Checking for new markets...\n');
        const incSync = new IncrementalSyncService(prisma, redis);
        await incSync.checkForNewMarkets();
        await incSync.checkResolutions();
        console.log('Done!');
        break;

      case '--stats':
        await showStats();
        break;

      default:
        console.log(`
Polymarket Sync CLI

Commands:
  --full     Full sync of all events and markets (run first time)
  --prices   Quick update of just prices
  --new      Check for new markets and resolutions
  --stats    Show database statistics

Example:
  npx ts-node src/scripts/sync.ts --full
        `);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

main();
