import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    
    const {
      name,
      phone,
      location,
      experience,
      skills,
      bio
    } = body

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        location: location || null,
        experience: experience ? parseInt(experience) : null,
        skills: skills || [],
        bio: bio || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        location: true,
        experience: true,
        skills: true,
        resumeUrl: true,
        bio: true,
        createdAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { message: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        location: true,
        experience: true,
        skills: true,
        resumeUrl: true,
        bio: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { message: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}