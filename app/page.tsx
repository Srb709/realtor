import LeadForm from "@/components/LeadForm";

const processSteps = [
  "Talk through your budget and monthly payment.",
  "Get connected with a lender for pre-approval.",
  "Search homes that match your goals.",
  "Make an offer and negotiate terms.",
  "Complete inspection, appraisal, and closing."
];

const grantIdeas = [
  "PHFA programs for down payment and closing cost support.",
  "County and city grant programs.",
  "Employer and community assistance programs.",
  "First-time buyer mortgage options with lower down payment."
];

const checklist = [
  "Photo ID and basic personal info.",
  "Recent pay stubs and W-2s.",
  "Last two months of bank statements.",
  "List of monthly debts.",
  "Questions about neighborhoods and commute."
];

const faqs = [
  {
    question: "How much money do I need up front?",
    answer: "It depends on your loan and program, but many buyers start with less than they expect."
  },
  {
    question: "Can I buy if my credit is not perfect?",
    answer: "Yes. Many buyers qualify with average credit and a clear plan."
  },
  {
    question: "How long does buying take?",
    answer: "Most people take 30 to 60 days once they are under contract."
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 md:px-6">
      <section className="section-card bg-blue-900 text-white ring-blue-800">
        <p className="mb-2 inline-block rounded-full bg-blue-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          Pennsylvania First-Time Homebuyer Help
        </p>
        <h1 className="text-3xl font-bold md:text-4xl">Buy your first home with a clear, simple plan.</h1>
        <p className="mt-3 max-w-2xl text-blue-100">
          We help first-time buyers across Pennsylvania understand steps, grants, and what to do next.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="section-card">
          <h2 className="text-xl font-semibold">Simple process</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
            {processSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="section-card">
          <h2 className="text-xl font-semibold">Grant and assistance options</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            {grantIdeas.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="section-card">
          <h2 className="text-xl font-semibold">First call checklist</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="section-card">
          <h2 className="text-xl font-semibold">Frequently asked questions</h2>
          <div className="mt-3 space-y-3 text-slate-700">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-semibold">{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-card">
        <h2 className="text-xl font-semibold">Why people trust us</h2>
        <p className="mt-3 text-slate-700">
          We explain things in plain English. No pressure. No confusing jargon. Just honest guidance based on your
          goals.
        </p>
      </section>

      <section className="section-card">
        <h2 className="text-xl font-semibold">What buyers say</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <blockquote className="rounded-xl bg-slate-100 p-4 text-slate-700">
            “They made every step simple. We felt confident from day one.”
          </blockquote>
          <blockquote className="rounded-xl bg-slate-100 p-4 text-slate-700">
            “We thought buying was out of reach, but they showed us programs we could use.”
          </blockquote>
        </div>
      </section>

      <section className="section-card" id="contact">
        <h2 className="text-xl font-semibold">Talk with a local expert</h2>
        <p className="mt-2 text-slate-700">Share a few details and we will reach out.</p>
        <div className="mt-4 max-w-xl">
          <LeadForm />
        </div>
      </section>
    </main>
  );
}
