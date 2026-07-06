import prisma from '../prisma';

/**
 * Records a business operation in the audit trail log.
 * Fails gracefully to prevent disrupting core operations if logging fails.
 */
export async function logActivity(
  userId: string | null,
  businessId: string,
  action: string,
  details?: any
): Promise<void> {
  try {
    const detailsString = details ? JSON.stringify(details) : null;
    
    await prisma.activityLog.create({
      data: {
        action,
        details: detailsString,
        userId,
        businessId,
      },
    });
    console.log(`[Audit Trail] Logged action "${action}" for business ${businessId}`);
  } catch (err) {
    console.error('[Audit Trail] Logging failed:', err);
  }
}
