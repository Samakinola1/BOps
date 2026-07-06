import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { hasPermission } from './permissions';

export { hasPermission };

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-key-987654321!';
const TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  businessId: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenCookie = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('auth-token='));
      
    if (!tokenCookie) return null;
    
    const token = tokenCookie.split('=')[1];
    const decoded = verifyToken(token);
    if (!decoded) return null;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        business: true,
        businessUser: {
          include: {
            role: true
          }
        }
      },
    });
    
    if (!user) return null;

    // Check if the user has a businessId but no BusinessUser record.
    // Dynamic seed fallback to keep pre-existing seeded users working
    if (user.businessId && !user.businessUser) {
      try {
        const newBusUser = await prisma.businessUser.create({
          data: {
            businessId: user.businessId,
            userId: user.id,
            roleName: 'Owner'
          },
          include: {
            role: true
          }
        });
        user.businessUser = newBusUser;
      } catch (err) {
        console.error('Failed to auto-seed BusinessUser for owner:', err);
      }
    }
    
    // Omit password hash before returning
    const { passwordHash, ...safeUser } = user;
    return safeUser as any;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

