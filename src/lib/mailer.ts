import 'server-only';
import nodemailer from 'nodemailer';

export type MailInput={to:string;subject:string;text:string};

export async function sendMail(input:MailInput){
  const {SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASSWORD,MAIL_FROM}=process.env;

  if(!SMTP_HOST||!SMTP_USER||!SMTP_PASSWORD){
    return {delivered:false,channel:'INBOX',reason:'SMTP not configured'};
  }

  try{
    const transporter=nodemailer.createTransport({
      host:SMTP_HOST,
      port:Number(SMTP_PORT||587),
      secure:String(SMTP_PORT||587)==='465',
      auth:{user:SMTP_USER,pass:SMTP_PASSWORD}
    });

    await transporter.sendMail({
      from:MAIL_FROM??SMTP_USER,
      to:input.to,
      subject:input.subject,
      text:input.text
    });

    return {delivered:true,channel:'EMAIL'};
  }catch(error){
    console.error('Mail error',error);
    return {delivered:false,channel:'INBOX',reason:'SMTP delivery failed'};
  }
}
