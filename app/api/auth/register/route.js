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
      // Recruiter specific fields
      recruiterType,
      department,
      // Employer specific fields
      companyName,
      companySize,
      industry,
      urgency,
      budgetRange,
      companyLocation
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
        const recruiterProfile = await tx.recruiter.create({
          data: {
            userId: user.id,
            recruiterType: recruiterType || 'TA',
            department: department || null,
            isActive: true,
          },
        });

        return {
          ...user,
          recruiterProfile: {
            recruiterType: recruiterProfile.recruiterType,
            department: recruiterProfile.department,
          }
        };
      }

      return user;
    });

    console.log('User created successfully:', result);

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: result 
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