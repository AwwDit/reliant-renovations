"use client";
import Script from "next/script";
import { useSyncExternalStore } from "react";
const eventName = "reliant-consent";
const subscribe = (fn: () => void) => {
  window.addEventListener(eventName, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(eventName, fn);
    window.removeEventListener("storage", fn);
  };
};
const getSnapshot = () => {
  try {
    return localStorage.getItem("reliant-analytics-consent") || "unset";
  } catch {
    return "declined";
  }
};
export function Analytics({ id }: { id?: string }) {
  const consent = useSyncExternalStore(subscribe, getSnapshot, () => "pending");
  if (!id || !/^G-[A-Z0-9]+$/.test(id)) return null;
  function choose(value: string) {
    try {
      localStorage.setItem("reliant-analytics-consent", value);
      window.dispatchEvent(new Event(eventName));
    } catch {
      /* Optional analytics stays disabled when browser storage is unavailable. */
    }
  }
  return (
    <>
      {consent === "accepted" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
          >{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}</Script>
        </>
      )}
      {consent === "unset" && (
        <aside className="consent-banner" aria-label="Analytics preference">
          <p>
            Allow optional analytics to help us improve this site?{" "}
            <a href="/privacy">Privacy details</a>
          </p>
          <button
            className="button button-small"
            onClick={() => choose("accepted")}
          >
            Allow
          </button>
          <button
            className="button button-ghost button-small"
            onClick={() => choose("declined")}
          >
            Decline
          </button>
        </aside>
      )}
    </>
  );
}
