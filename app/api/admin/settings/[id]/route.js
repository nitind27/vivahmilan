import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { updateAdminById, getAdminById } from '@/lib/adminAccounts.js';

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const target = await getAdminById(id);
  if (!target) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const result = await updateAdminById(id, session.user.id, {
      name: body.name,
      email: body.email,
      password: body.password,
      isActive: body.isActive,
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: body.isActive === false
        ? 'Admin deactivated'
        : body.isActive === true
          ? 'Admin reactivated'
          : body.password
            ? 'Password reset successfully'
            : 'Admin updated',
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Update failed' }, { status: 400 });
  }
}
