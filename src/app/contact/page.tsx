import ContactForm from '@/components/contact-form';
export const metadata={title:'Contact'};

export default function ContactPage(){
  return (
    <section className="section">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_.9fr]">
        <div>
          <span className="eyebrow">Contact Crestline</span>
          <h1 className="mt-6 font-display text-4xl font-semibold md:text-6xl">Talk to our advisory and property team</h1>
          <p className="mt-5 max-w-lg text-muted">
            Send a support request, partnership enquiry or platform question. Messages are captured in
            Crestline’s built-in support inbox and answered from your account or the admin workspace.
          </p>
          <div className="card mt-10">
            <p className="font-semibold">Built-in support</p>
            <p className="mt-2 text-muted">No external email service is required. Signed-in users receive replies directly in their Crestline inbox.</p>
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
