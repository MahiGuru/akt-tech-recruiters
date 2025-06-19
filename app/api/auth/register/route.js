// app/api/auth/register/route.js (Updated version)
import { NextResponse } from 'next/server';
import { prisma } from '../../../(client)/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      role, 
      phone, 
      location,
      // Recruiter specific fields (simplified - all recruiter registrations are admin)
      recruiterType,
      selectedAdmin, // This should always be null for new registrations
      department,
      // Employer specific fields
      companyName,
      companySize,
      industry
    } = body;

    console.log('Registration request:', { name, email, role, recruiterType });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in a transaction to handle recruiter profile creation
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          phone: phone || null,
          location: location || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          location: true,
          createdAt: true,
        },
      });

      // Create recruiter profile if role is RECRUITER
      if (role === 'RECRUITER') {
        // All recruiters who register are automatically admins
        const recruiterProfile = await tx.recruiter.create({
          data: {
            userId: user.id,
            recruiterType: 'ADMIN', // Always admin for new registrations
            department: department || null,
            isActive: true, // Admin recruiters are immediately active
            adminId: null // No admin needed since they are the admin
          },
        });

        console.log('Recruiter profile created:', recruiterProfile);

        return {
          ...user,
          recruiterProfile: {
            recruiterType: 'ADMIN',
            department: recruiterProfile.department,
            isActive: true,
            needsApproval: false // No approval needed for admin recruiters
          }
        };
      }

      return user;
    });

    console.log('User created successfully:', result);

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: result,
        // Recruiters who register never need approval since they become admins
        needsApproval: false
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 },
    );
  }
}