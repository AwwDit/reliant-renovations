"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container error-page">
      <p className="eyebrow">Something went wrong</p>
      <h1>Let’s try that again.</h1>
      <p>We couldn’t load this page. Please try again in a moment.</p>
      <div className="button-row">
        <button className="button" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="text-link">
          Back to home
        </Link>
      </div>
    </main>
  );
}
