import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateListingCopy,type ListingInput } from '@/lib/ai';
import { runAutomation } from '@/lib/automation';
import { readJsonBody } from '@/lib/request';
import { z } from 'zod';

export async function POST(request:Request){
  const user=await getSession();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});

  const parsed=z.object({
    title:z.string().trim().max(150).optional(),
    propertyType:z.string().trim().max(80).optional(),
    listingType:z.enum(['RENT','SALE']).optional(),
    city:z.string().trim().max(100).optional(),
    neighborhood:z.string().trim().max(100).optional(),
    bedrooms:z.coerce.number().int().min(0).max(100).optional(),
    bathrooms:z.coerce.number().int().min(0).max(100).optional(),
    areaSqm:z.coerce.number().int().min(0).max(100000).optional(),
    amenities:z.string().trim().max(1000).optional(),
    tone:z.enum(['warm','premium','family','investor']).optional()
  }).safeParse(await readJsonBody(request));
  if(!parsed.success)return NextResponse.json({error:'Invalid listing details.'},{status:400});

  const input:ListingInput=parsed.data;
  const result=generateListingCopy(input);

  await runAutomation({type:'AI_CONTENT_GENERATED',title:'AI description generated',
    detail:`Generated a ${input.tone??'warm'} description.`,userId:user.id});

  return NextResponse.json(result);
}
