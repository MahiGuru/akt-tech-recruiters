import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { isPremium } = req.query;
    try {
      const jobs = await prisma.job.findMany({
        where: isPremium ? {} : { compensation: { not: 'Premium' } },
      });
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}