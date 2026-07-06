import fs from 'fs';
import path from 'path';
import prisma from '../prisma';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DB_FILE_PATH = path.join(process.cwd(), 'prisma', 'dev.db');
const RETENTION_LIMIT = 7;

const isPostgres = process.env.DATABASE_URL?.startsWith('postgres://') || process.env.DATABASE_URL?.startsWith('postgresql://');

export interface BackupItem {
  filename: string;
  size: number;
  createdAt: string;
}

// Ensure backups directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Creates a database backup.
 * Tries raw SQL VACUUM INTO, falling back to a direct file copy.
 */
export async function createBackup(): Promise<string> {
  if (isPostgres) {
    throw new Error('Database backups are managed by your PostgreSQL hosting provider in production environments.');
  }
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${timestamp}.db`;
  const absoluteBackupPath = path.join(BACKUP_DIR, filename);

  try {
    // Try clean SQLite VACUUM INTO
    // Escape backslashes for SQLite path string compatibility
    const sqliteSafePath = absoluteBackupPath.replace(/\\/g, '/');
    await prisma.$executeRawUnsafe(`VACUUM INTO '${sqliteSafePath}'`);
    console.log(`[Backup Service] SQLite VACUUM INTO successful: ${filename}`);
  } catch (err) {
    console.warn('[Backup Service] VACUUM INTO failed, falling back to fs.copyFileSync:', err);
    // Fallback: copy file
    fs.copyFileSync(DB_FILE_PATH, absoluteBackupPath);
  }

  // Enforce backup retention limits
  try {
    await deleteOldBackups();
  } catch (purgeErr) {
    console.error('[Backup Service] Failed to enforce retention limits:', purgeErr);
  }

  return filename;
}

/**
 * Lists all database backup files.
 */
export function listBackups(): BackupItem[] {
  if (isPostgres) {
    throw new Error('Database snapshots list is disabled. Backups are managed by your PostgreSQL hosting provider.');
  }
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR);

  const backups: BackupItem[] = files
    .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
    .map(f => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        filename: f,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
      };
    });

  // Sort descending (newest first)
  return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Restores the database from a backup file.
 */
export async function restoreBackup(filename: string): Promise<boolean> {
  if (isPostgres) {
    throw new Error('Database restoration is managed by your PostgreSQL hosting provider in production environments.');
  }
  ensureBackupDir();
  const backupPath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup file not found.');
  }

  // Clean SQLite connection pool before overwrite to release file locks
  await prisma.$disconnect();

  try {
    fs.copyFileSync(backupPath, DB_FILE_PATH);
    console.log(`[Backup Service] Database successfully restored from: ${filename}`);
    return true;
  } catch (err) {
    console.error('[Backup Service] Failed to restore SQLite database file:', err);
    throw new Error('Failed to overwrite active database file. Database may be busy.');
  } finally {
    // Reconnect to DB
    await prisma.$connect();
  }
}

/**
 * Purges backup files exceeding the retention limit.
 */
export async function deleteOldBackups() {
  if (isPostgres) return;
  ensureBackupDir();
  const backups = listBackups();

  if (backups.length > RETENTION_LIMIT) {
    const filesToPurge = backups.slice(RETENTION_LIMIT);
    for (const item of filesToPurge) {
      const filePath = path.join(BACKUP_DIR, item.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Backup Service] Purged outdated backup: ${item.filename}`);
      }
    }
  }
}
