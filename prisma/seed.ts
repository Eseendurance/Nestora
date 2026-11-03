import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nestora.example' },
    update: {},
    create: { fullName:'Nestora Admin', email:'admin@nestora.example',
      passwordHash: await bcrypt.hash('Admin12345!',12), role:'ADMIN' }
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@nestora.example' },
    update: {},
    create: { fullName:'Amaka Johnson', email:'agent@nestora.example',
      passwordHash: await bcrypt.hash('Agent12345!',12), role:'AGENT' }
  });

  const exists = await prisma.listing.findFirst({ where:{ slug:'sunlit-3-bedroom-apartment-lekki' }});
  if (!exists) {
    await prisma.listing.create({ data:{
      userId:agent.id, title:'Sunlit 3-Bedroom Apartment in Lekki',
      slug:'sunlit-3-bedroom-apartment-lekki', propertyType:'Apartment',
      listingType:'RENT', price:4500000, bedrooms:3, bathrooms:3, areaSqm:145,
      city:'Lagos', neighborhood:'Lekki', address:'Admiralty Way, Lekki Phase 1',
      latitude:6.4459, longitude:3.4739,
      description:'Set in Lekki, this inviting 3-bedroom apartment offers calm, comfortable living with practical space, secure parking and a private balcony.',
      amenities:'24-hour power, Secure parking, Balcony, Gym',
      imageUrl:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c', featured:true }});
  }

  await prisma.automationEvent.create({ data:{
    type:'CONTACT_FORM', title:'Welcome to Nestora',
    detail:'Your built-in inbox is ready. Property alerts, enquiries and appointment updates will appear here.',
    userId:admin.id }});
}

main().catch(console.error).finally(() => prisma.$disconnect());
