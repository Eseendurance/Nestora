import 'server-only';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';

type AutomationType =
  | 'CONTACT_FORM'
  | 'CONTACT_REPLY'
  | 'INQUIRY_CREATED'
  | 'APPOINTMENT_REQUESTED'
  | 'APPOINTMENT_UPDATED'
  | 'LISTING_PUBLISHED'
  | 'AI_CONTENT_GENERATED'
  | 'AI_CHAT';

type Input={
  type:AutomationType; title:string; detail:string; userId?:string;
  emailTo?:string; emailSubject?:string;
};

export async function runAutomation(input:Input){
  const mail=input.emailTo
    ? await sendMail({to:input.emailTo,subject:input.emailSubject??input.title,text:input.detail})
    : {delivered:false,channel:'INBOX'};

  return prisma.automationEvent.create({
    data:{
      type:input.type,title:input.title,detail:input.detail,userId:input.userId,
      emailTo:input.emailTo,channel:mail.channel,
      status:mail.delivered?'SENT':mail.channel
    }
  });
}
