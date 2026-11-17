import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const COUNTRIES = [
  { code: 'ID', name: 'Indonesia', weight: 65 },
  { code: 'US', name: 'United States', weight: 10 },
  { code: 'SG', name: 'Singapore', weight: 8 },
  { code: 'MY', name: 'Malaysia', weight: 6 },
  { code: 'JP', name: 'Japan', weight: 4 },
  { code: 'GB', name: 'United Kingdom', weight: 3 },
  { code: 'AU', name: 'Australia', weight: 2 },
  { code: 'DE', name: 'Germany', weight: 2 },
];

const PATHS = [
  '/',
  '/monev-survei',
  '/penelitian',
  '/pengabdian',
  '/publikasi',
  '/arsip-dokumen',
  '/kinerja',
  '/layanan',
];

function pickWeightedCountry() {
  const total = COUNTRIES.reduce((acc, c) => acc + c.weight, 0);
  let rand = Math.random() * total;
  for (const c of COUNTRIES) {
    if (rand < c.weight) return c;
    rand -= c.weight;
  }
  return COUNTRIES[0];
}

async function seedVisitors() {
  console.log('Clearing existing visitor logs...');
  await prisma.lppmVisitorLog.deleteMany({});

  console.log('Generating visitor logs for the last 30 days...');
  const logs: Array<{
    ipHash: string;
    countryCode: string;
    countryName: string;
    path: string;
    userAgent: string;
    createdAt: Date;
  }> = [];

  const now = new Date();
  
  // Buat sebaran kunjungan 30 hari ke belakang (misal 40 s/d 120 hit per hari)
  for (let d = 30; d >= 0; d--) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - d);
    
    // Variasi hari kerja vs akhir pekan
    const dayOfWeek = targetDate.getDay();
    const baseHits = (dayOfWeek === 0 || dayOfWeek === 6) ? 35 : 75;
    const hitCount = baseHits + Math.floor(Math.random() * 45);

    for (let i = 0; i < hitCount; i++) {
      const country = pickWeightedCountry();
      const randomPath = PATHS[Math.floor(Math.random() * PATHS.length)];
      
      // Random time on that day
      const hitTime = new Date(targetDate);
      hitTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

      const fakeIp = `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      const ipHash = crypto.createHash('sha256').update(fakeIp).digest('hex').substring(0, 32);

      logs.push({
        ipHash,
        countryCode: country.code,
        countryName: country.name,
        path: randomPath,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        createdAt: hitTime,
      });
    }
  }

  // Insert in chunks
  const chunkSize = 500;
  for (let i = 0; i < logs.length; i += chunkSize) {
    const chunk = logs.slice(i, i + chunkSize);
    await prisma.lppmVisitorLog.createMany({
      data: chunk,
    });
  }

  console.log(`Successfully seeded ${logs.length} visitor hits across 30 days!`);
}

seedVisitors()
  .catch((err) => {
    console.error('Error seeding visitor logs:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
