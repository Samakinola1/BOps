import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { sendEmail, getEmailLayout } from '@/lib/services/email';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!hasPermission(user, 'manage:team')) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to manage team.' }, { status: 403 });
    }

    // Fetch team members linked to this business
    const team = await prisma.businessUser.findMany({
      where: { businessId: user.businessId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            createdAt: true,
          },
        },
        role: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const mappedTeam = team.map(member => ({
      id: member.id,
      userId: member.user.id,
      email: member.user.email,
      name: member.user.name,
      roleName: member.roleName,
      roleId: member.roleId,
      status: member.user.emailVerified ? 'Active' : 'Pending Invite',
      joinedAt: member.user.createdAt,
    }));

    return NextResponse.json({ team: mappedTeam }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch team API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching team members.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!hasPermission(user, 'manage:team')) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to invite team members.' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, roleName, roleId } = body;

    if (!email || !roleName) {
      return NextResponse.json({ error: 'Email and role selection are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered in system
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'A user with this email address is already registered in the system.' }, { status: 409 });
    }

    // Check custom role validity if roleId is provided
    if (roleId) {
      const customRole = await prisma.customRole.findUnique({
        where: { id: roleId },
      });
      if (!customRole || customRole.businessId !== user.businessId) {
        return NextResponse.json({ error: 'Selected custom role not found.' }, { status: 404 });
      }
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Create user and business relation
    const result = await prisma.$transaction(async (tx) => {
      // Create user record with a placeholder password hash
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: name ? name.trim() : null,
          passwordHash: 'INVITED_USER_TEMP_HASH_' + crypto.randomBytes(8).toString('hex'),
          emailVerified: false,
          verificationToken: inviteToken,
          businessId: user.businessId,
          role: 'USER',
        },
      });

      // Create BusinessUser mapping
      const busUser = await tx.businessUser.create({
        data: {
          businessId: user.businessId!,
          userId: newUser.id,
          roleName: roleName,
          roleId: roleId || null,
        },
      });

      return { newUser, busUser };
    });

    // Send invitation email
    const origin = request.headers.get('origin') || new URL(request.url).origin;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
    const inviteLink = `${appUrl}/auth/accept-invite?token=${inviteToken}`;
    
    const businessName = user.business?.name || 'Ops Suite';
    const htmlContent = `
      <h1 style="margin: 0 0 15px 0; font-size: 22px; font-weight: 800; color: #ffffff; text-align: center;">You've Been Invited!</h1>
      <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.6; color: #a0aec0; text-align: center;">
        You have been invited to join the team workspace at <strong>${businessName}</strong>.
      </p>
      <div style="background-color: #11111a; border: 1px dashed #2e2e3f; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 12px; color: #6f7082; text-transform: uppercase; display: block; margin-bottom: 4px;">ASSIGNED SYSTEM ROLE</span>
        <span style="font-size: 16px; font-weight: 700; color: #45f3ff;">${roleName}</span>
      </div>
      <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a0aec0; text-align: center;">
        Click the button below to accept the invitation, set up your secure password, and log in to your account.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" style="display: inline-block; padding: 14px 28px; background-color: #45f3ff; color: #0b0c10; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
          Accept Invitation
        </a>
      </div>
      <p style="margin: 24px 0 10px 0; font-size: 12px; line-height: 1.5; color: #718096; text-align: center;">
        If the button above does not work, copy and paste this address into your browser:
      </p>
      <p style="margin: 0; font-size: 11px; word-break: break-all; text-align: center;">
        <a href="${inviteLink}" style="color: #45f3ff; text-decoration: none;">${inviteLink}</a>
      </p>
    `;

    await sendEmail({
      to: normalizedEmail,
      subject: `Invitation to join ${businessName}`,
      text: `You have been invited to join ${businessName} on Ops Suite! Accept the invitation and set up your password here: ${inviteLink}`,
      html: getEmailLayout(`Invitation to join ${businessName}`, htmlContent),
    });

    return NextResponse.json({
      message: 'Invitation sent successfully.',
      member: {
        id: result.busUser.id,
        email: result.newUser.email,
        name: result.newUser.name,
        roleName: result.busUser.roleName,
        status: 'Pending Invite',
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Invite team member API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred inviting team member.' },
      { status: 500 }
    );
  }
}
