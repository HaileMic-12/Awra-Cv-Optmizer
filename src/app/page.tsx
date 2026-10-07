import Link from "next/link";
import type { ReactNode } from "react";

function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 10H16M11 5L16 10L11 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 10.5L8 14.5L16 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileTextIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M14 3H6.8C5.806 3 5 3.806 5 4.8V19.2C5 20.194 5.806 21 6.8 21H17.2C18.194 21 19 20.194 19 19.2V8L14 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M14 3V8H19M8.5 12H15.5M8.5 15.5H15.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ScanIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 3H5.5C4.672 3 4 3.672 4 4.5V6M17 3H18.5C19.328 3 20 3.672 20 4.5V6M7 21H5.5C4.672 21 4 20.328 4 19.5V18M17 21H18.5C19.328 21 20 20.328 20 19.5V18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M7 12H17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9 8.5H15M9 15.5H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 15L19.2 17.3L21.5 18L19.2 18.7L18.5 21L17.8 18.7L15.5 18L17.8 17.3L18.5 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 3L19 6V11.5C19 16.2 16.2 19.6 12 21C7.8 19.6 5 16.2 5 11.5V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12L10.8 14.3L15.8 9.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TargetIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function GiftIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 10H20V20H4V10Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M3 7H21V10H3V7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 7V20M12 7H8.5C7.119 7 6 5.881 6 4.5C6 3.672 6.672 3 7.5 3C9.985 3 12 7 12 7ZM12 7H15.5C16.881 7 18 5.881 18 4.5C18 3.672 17.328 3 16.5 3C14.015 3 12 7 12 7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="6.5"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4.5 17C4.9 13.9 6.8 12 10 12C13.2 12 15.1 13.9 15.5 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  label,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  label?: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-900 transition group-hover:bg-slate-900 group-hover:text-white">
          {icon}
        </div>

        {label && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            {label}
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-slate-950">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function MiniFeature({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  credits,
  description,
  features,
  featured = false,
  cta,
}: {
  name: string;
  price: string;
  credits: string;
  description: string;
  features: string[];
  featured?: boolean;
  cta: string;
}) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-3xl border p-7 transition duration-300 ${
        featured
          ? "border-slate-900 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
          : "border-slate-200 bg-white text-slate-950 shadow-[0_12px_40px_rgba(15,23,42,0.05)] hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_50px_rgba(15,23,42,0.09)]"
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full border border-slate-900 bg-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-900 shadow-sm">
            Most popular
          </span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-3">
          <h3
            className={`text-lg font-semibold tracking-tight ${
              featured ? "text-white" : "text-slate-950"
            }`}
          >
            {name}
          </h3>

          {featured && (
            <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
              Best value
            </span>
          )}
        </div>

        <p
          className={`mt-2 min-h-[48px] text-sm leading-6 ${
            featured ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {description}
        </p>

        <div
          className={`mt-6 border-t pt-6 ${
            featured ? "border-white/10" : "border-slate-100"
          }`}
        >
          <div className="flex items-end gap-2">
            <span
              className={`text-4xl font-bold tracking-tight ${
                featured ? "text-white" : "text-slate-950"
              }`}
            >
              {price}
            </span>

            <span
              className={`mb-1.5 text-sm ${
                featured ? "text-slate-400" : "text-slate-500"
              }`}
            >
              ETB
            </span>
          </div>

          <div
            className={`mt-3 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
              featured
                ? "bg-white/10 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {credits} credits
          </div>
        </div>
      </div>

      <div
        className={`my-7 h-px ${
          featured ? "bg-white/10" : "bg-slate-100"
        }`}
      />

      <div className="flex-1">
        <p
          className={`mb-4 text-xs font-semibold uppercase tracking-[0.14em] ${
            featured ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Includes
        </p>

        <ul className="space-y-3.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  featured
                    ? "bg-white/10 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <CheckIcon className="h-3.5 w-3.5" />
              </span>

              <span
                className={`text-sm leading-5 ${
                  featured ? "text-slate-200" : "text-slate-700"
                }`}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/signup"
        className={`mt-8 flex h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold transition ${
          featured
            ? "bg-white text-slate-950 hover:bg-slate-100"
            : "border border-slate-200 bg-slate-950 text-white hover:bg-slate-800"
        }`}
      >
        {cta}
        <ArrowRightIcon className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white shadow-sm">
              A
            </div>

            <span className="text-lg font-bold tracking-tight text-slate-950">
              Awra
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              How it works
            </a>

            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Features
            </a>

            <a
              href="#pricing"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/chat"
              className="hidden items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 sm:flex"
            >
              <UserIcon />
              Log in
            </Link>

            <Link
              href="/signup"
              className="hidden rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:inline-flex"
            >
              Get started
            </Link>

            <button
              type="button"
              aria-label="Open navigation menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:hidden"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100">
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,23,42,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.055) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 80%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, transparent 80%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                Make your CV work harder for you.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Stop rewriting your CV for every single application. Find out exactly what your resume is missing, and let Awra generate a tailored CV and cover letter so you never have to start from a blank page again.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_8px_25px_rgba(15,23,42,0.15)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Check my CV
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  See how it works
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4 text-slate-700" />
                  Secure account
                </span>

                <span className="inline-flex items-center gap-2">
                  <ScanIcon className="h-4 w-4 text-slate-700" />
                  Free CV scan
                </span>

                <span className="inline-flex items-center gap-2">
                  <TargetIcon className="h-4 w-4 text-slate-700" />
                  Job matching
                </span>
              </div>
            </div>

            {/* Product preview */}
            <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:ml-auto">
              <div className="absolute -inset-5 rounded-[2rem] bg-slate-100/70 blur-2xl" />

              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
                <div className="flex h-12 items-center justify-between border-b border-slate-100 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-bold text-white">
                      A
                    </div>

                    <span className="text-xs font-semibold text-slate-800">
                      CV Analysis
                    </span>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                    Good match
                  </span>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-[0.85fr_1.15fr]">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                        <FileTextIcon className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          My CV.pdf
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Updated today
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="h-2 rounded-full bg-slate-200" />
                      <div className="h-2 w-4/5 rounded-full bg-slate-200" />
                      <div className="h-2 w-3/5 rounded-full bg-slate-200" />
                      <div className="mt-4 h-2 rounded-full bg-slate-200" />
                      <div className="h-2 w-5/6 rounded-full bg-slate-200" />
                      <div className="h-2 w-2/3 rounded-full bg-slate-200" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Overall match
                        </p>

                        <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                          82
                          <span className="text-lg text-slate-400">/100</span>
                        </p>
                      </div>

                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-slate-900 bg-white text-sm font-bold text-slate-900">
                        82%
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div>
                        <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                          <span className="text-slate-600">Keywords</span>
                          <span className="text-slate-900">88%</span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full w-[88%] rounded-full bg-slate-900" />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                          <span className="text-slate-600">Experience</span>
                          <span className="text-slate-900">81%</span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full w-[81%] rounded-full bg-slate-900" />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                          <span className="text-slate-600">Skills</span>
                          <span className="text-slate-900">76%</span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full w-[76%] rounded-full bg-slate-900" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex gap-2.5">
                        <SparkIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />

                        <div>
                          <p className="text-[11px] font-semibold text-slate-900">
                            One thing to improve
                          </p>

                          <p className="mt-1 text-[10px] leading-4 text-slate-500">
                            Add measurable results to your recent experience.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                  <p className="text-[10px] font-medium text-slate-500">
                    Analysis combines structured CV checks with job-specific
                    matching.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="border-b border-slate-100 bg-slate-50/60">
        {/* <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Simple tools for better applications
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              telebirr
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              CBE Mobile
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              Pay when you need it
            </div>
          </div>
        </div> */}
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
              From CV to application in a few steps.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Upload your CV, insert the job description, and let Awra show you
              where your application can be stronger then turn those
              insights into an optimized CV ready for the role.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Upload your CV",
                description:
                  "Start with the CV you already have. Awra reads the structure, skills, experience, and important details.",
              },
              {
                number: "02",
                title: "Add the job",
                description:
                  "Paste a job description to see how closely your current CV lines up with what the employer is looking for.",
              },
              {
                number: "03",
                title: "Optimize & apply",
                description:
                  "Use the recommendations to improve your CV, or Awra will generate to you an optimized version tailored to the job so you have a stronger application ready to use.",
              },
            ].map((step) => ( 
              <div
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.035)]"
              >
                <span className="text-xs font-bold tracking-[0.14em] text-slate-400">
                  {step.number}
                </span>

                <h3 className="mt-6 text-lg font-semibold tracking-tight text-slate-950">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-20 border-y border-slate-100 bg-slate-50/60"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Features
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                Everything you need before you hit apply.
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Focus on the parts that actually affect your application
                instead of guessing what an employer or ATS might notice. Awra
                can also turn those insights into an optimized CV tailored to
                the job you are targeting.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<ScanIcon />}
              title="Hybrid ATS Scoring"
              description="See a structured match score based on your CV and the job requirements, with clear areas to improve."
              label="Free"
            />

            <FeatureCard
              icon={<SparkIcon />}
              title="Instant Cover Letters"
              description="Generate a focused cover letter based on your experience and the position you are applying for."
              label="1 credit"
            />

            <FeatureCard
              icon={<FileTextIcon />}
              title="Clean ATS Blueprints"
              description="Get guidance for creating a cleaner, more readable CV structure designed for modern application systems."
              label="2 credits"
            />
          </div>

          <div className="mt-12 grid gap-8 border-t border-slate-200 pt-10 md:grid-cols-3">
            <MiniFeature
              icon={<TargetIcon />}
              title="Job-specific feedback"
              description="Recommendations are connected to the job you are actually targeting, so you know what to change and why."
            />

            <MiniFeature
              icon={<FileTextIcon />}
              title="Optimized CV"
              description="Go beyond recommendations. Awra can generate an optimized version of your CV using the job requirements and your existing experience."
            />

            <MiniFeature
              icon={<GiftIcon />}
              title="Start with a free scan"
              description="See your CV's baseline first, then choose whether you want to optimize it and use more application tools."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Pricing
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">
              Choose the amount of help you need.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Credits keep things simple. Use them for the tools you need and
              come back when you need more.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-3 lg:items-stretch">
            <PricingCard
              name="Starter"
              price="49"
              credits="10"
              description="A practical starting point for a few applications."
              features={[
                "2 full application packages",
                "10 cover letters",
                "5 CV rewrites",
                "ATS & job matching tools",
                "Credits stay available until used",
              ]}
              cta="Choose Starter"
            />

            <PricingCard
              name="Standard"
              price="99"
              credits="25"
              description="More room to improve and tailor your applications."
              features={[
                "6 full application packages",
                "25 cover letters",
                "12 CV rewrites",
                "ATS & job matching tools",
                "Best balance for active job seekers",
              ]}
              featured
              cta="Get started"
            />

            <PricingCard
              name="Pro"
              price="199"
              credits="60"
              description="For a serious job search with multiple applications."
              features={[
                "15 full application packages",
                "60 cover letters",
                "30 CV rewrites",
                "ATS & job matching tools",
                "Maximum value per credit",
              ]}
              cta="Choose Pro"
            />
          </div>

          <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Payment
                </p>

                <p className="mt-1.5 text-sm font-semibold text-slate-900">
                  Local payment options
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Pay using supported Ethiopian payment methods.
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Credits
                </p>

                <p className="mt-1.5 text-sm font-semibold text-slate-900">
                  Use them when you need them
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Your credits can be used across the available tools.
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Start
                </p>

                <p className="mt-1.5 text-sm font-semibold text-slate-900">
                  Try the free scan first
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  See what your CV needs before buying credits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-slate-100 bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Ready when you are
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
                Give your next application a better starting point.
              </h2>

              <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
                Scan your CV, understand where you stand, and make your next
                application more targeted.
              </p>
            </div>

            <Link
              href="/signup"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Start with a free scan
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-white/10 px-5 py-7 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-950">
              A
            </div>

            <span className="text-sm font-bold text-white">Awra</span>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Awra. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            {/* <Link
              href="/privacy"
              className="text-xs font-medium text-slate-500 transition hover:text-white"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="text-xs font-medium text-slate-500 transition hover:text-white"
            >
              Terms
            </Link> */}
          </div>
        </div>
      </footer>
    </main>
  );
}