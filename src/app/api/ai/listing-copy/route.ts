import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateListingCopy,type ListingInput } from '@/lib/ai';
import { runAutomation } from '@/lib/automation';

export async function POST(request:Request){
  const user=await getSession();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});

  const input=await request.json() as ListingInput;
  const result=generateListingCopy(input);

  await runAutomation({type:'AI_CONTENT_GENERATED',title:'AI description generated',
    detail:`Generated a ${input.tone??'warm'} description.`,userId:user.id});

  return NextResponse.json(result);
}
