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
      // Recruiter specific fields
      recruiterType,
      selectedAdmin, // New field
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
        const finalRecruiterType = recruiterType || 'TA'
        const isAdminRole = finalRecruiterType === 'ADMIN'
        const hasSelectedAdmin = selectedAdmin && selectedAdmin.trim() !== ''
        
        // Determine if approval is needed:
        // - Admin recruiters don't need approval
        // - If no admin selected and not explicitly admin, make them admin (no approval needed)
        // - Only need approval if they selected a specific admin
        const needsApproval = !isAdminRole && hasSelectedAdmin
        
        const recruiterProfile = await tx.recruiter.create({
          data: {
            userId: user.id,
            recruiterType: finalRecruiterType,
            department: department || null,
            isActive: !needsApproval, // Active immediately if no approval needed
            adminId: hasSelectedAdmin ? selectedAdmin : null
          },
        });

        // Only notify admins if approval is needed
        if (needsApproval && hasSelectedAdmin) {
          // Notify the specific selected admin
          await tx.notification.create({
            data: {
              title: 'New Recruiter Approval Request',
              message: `${name} has registered as a ${finalRecruiterType} and selected you as their admin. Please review their request.`,
              type: 'APPROVAL_REQUEST',
              receiverId: selectedAdmin
            }
          });
        } else if (!isAdminRole && !hasSelectedAdmin) {
          // This shouldn't happen with the new logic, but handle it gracefully
          // Make them admin since no admin was selected
          await tx.recruiter.update({
            where: { id: recruiterProfile.id },
            data: { 
              recruiterType: 'ADMIN',
              isActive: true 
            }
          });
        }

        return {
          ...user,
          recruiterProfile: {
            recruiterType: needsApproval ? finalRecruiterType : (finalRecruiterType === 'ADMIN' ? 'ADMIN' : finalRecruiterType),
            department: recruiterProfile.department,
            isActive: recruiterProfile.isActive,
            needsApproval
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
        // Add a flag to indicate if recruiter needs approval
        needsApproval: role === 'RECRUITER' && result.recruiterProfile?.needsApproval
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