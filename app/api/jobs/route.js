import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const employerId = searchParams.get('employerId');

        const where = employerId ? { employerId } : { isActive: true };

        const jobs = await prisma.job.findMany({
            where,
            include: {
                employer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                applications: {
                    select: {
                        id: true,
                        status: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            title,
            company,
            location,
            type,
            salary,
            description,
            requirements,
            benefits,
            employerId,
        } = body;

        const job = await prisma.job.create({
            data: {
                title,
                company,
                location,
                type,
                salary,
                description,
                requirements: requirements || [],
                benefits: benefits || [],
                employerId,
            },
            include: {
                employer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(job, { status: 201 });
    } catch (error) {
        console.error('Error creating job:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
