export type ListingInput={title?:string;propertyType?:string;listingType?:string;city?:string;
neighborhood?:string;bedrooms?:number;bathrooms?:number;areaSqm?:number;amenities?:string;tone?:string};

const clean=(v:unknown)=>String(v??'').replace(/\s+/g,' ').trim();

export function generateListingCopy(i:ListingInput){
  const type=clean(i.propertyType).toLowerCase()||'home';
  const city=clean(i.city)||'the city';
  const area=clean(i.neighborhood)||'a convenient neighbourhood';
  const beds=Number(i.bedrooms||1), baths=Number(i.bathrooms||1), size=Number(i.areaSqm||0);
  const tone=clean(i.tone).toLowerCase()||'warm';
  const amenities=clean(i.amenities).split(',').map(x=>x.trim()).filter(Boolean);

  const openers={
    warm:`Set in ${area}, this inviting ${beds}-bedroom ${type} offers calm, comfortable living.`,
    premium:`In a desirable part of ${city}, this refined ${beds}-bedroom ${type} balances light, space and convenience.`,
    family:`Designed for everyday life, this spacious ${beds}-bedroom ${type} gives families room to settle and grow.`,
    investor:`This ${beds}-bedroom ${type} in ${area} offers practical rental potential and long-term value.`
  };
  const opener=openers[tone as keyof typeof openers]??openers.warm;
  const sizeLine=size?`Spanning approximately ${size} m², the layout is practical and efficient.`:'The layout makes daily living simple and comfortable.';
  const amenityLine=amenities.length?`Highlights include ${amenities.join(', ')}.`:'';
  const closing={warm:'It feels welcoming from the first visit and easy to live in from day one.',
    premium:'Arrange a viewing to appreciate its finish and sense of space.',
    family:'With flexible living space and good light, it suits family life.',
    investor:'Its location and layout make it worth serious consideration.'}[tone as keyof typeof openers]??'Book a viewing to see whether it feels like home.';

  return {description:[opener,sizeLine,amenityLine,closing].filter(Boolean).join(' '),
    seoTitle:`${beds}-Bedroom ${type} in ${area}, ${city}`,
    highlights:[`${beds} bd`,`${baths} ba`,size?`${size} m²`:'Practical layout',...amenities.slice(0,4)]};
}

export function calculateMatchScore(l:{price:number;bedrooms:number;city:string;neighborhood:string},
p:{budget?:number;bedrooms?:number;city?:string;neighborhood?:string}){
  let s=60;
  if(p.budget&&l.price<=p.budget)s+=20;
  if(p.budget&&l.price>p.budget)s-=15;
  if(p.bedrooms&&l.bedrooms>=p.bedrooms)s+=10;
  if(p.city&&l.city.toLowerCase()===p.city.toLowerCase())s+=7;
  if(p.neighborhood&&l.neighborhood.toLowerCase()===p.neighborhood.toLowerCase())s+=3;
  return Math.max(0,Math.min(100,s));
}

export function slugify(v:string){
  return v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,70);
}

export function localAssistant(message:string,context:{name:string;unread:number;appointments:number;saved:number}){
  const q=message.toLowerCase();

  if(q.includes('book')||q.includes('appointment')||q.includes('viewing'))
    return `You can book a viewing from any property page. Choose a date and time, submit the request, and the property owner will confirm or decline it. You currently have ${context.appointments} appointment(s).`;

  if(q.includes('budget')||q.includes('afford'))
    return 'Use the affordability checker on a property page. Nestora applies a conservative guideline of keeping housing below 30% of monthly income.';

  if(q.includes('save')||q.includes('favourite'))
    return `You have ${context.saved} saved home(s). Open any property and select “Save home” to add it to your shortlist.`;

  if(q.includes('inbox')||q.includes('message')||q.includes('notification'))
    return `Your inbox contains ${context.unread} unread notification(s). It keeps contact replies, enquiry updates and appointment decisions in one place.`;

  if(q.includes('listing')||q.includes('sell')||q.includes('rent out'))
    return 'Go to Dashboard → Create listing. Add the essentials, generate an AI description, then publish. Your listing becomes searchable immediately.';

  return `Hi ${context.name}, I can help with property search, affordability, bookings, listings and your inbox. You have ${context.unread} unread notification(s), ${context.appointments} appointment(s) and ${context.saved} saved home(s).`;
}
