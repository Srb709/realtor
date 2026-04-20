"use client";

import { FormEvent, useState } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function LeadForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      timeline: String(formData.get("timeline") || ""),
      message: String(formData.get("message") || "")
    };

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = (await response.json()) as { message?: string };

    if (response.ok) {
      event.currentTarget.reset();
      setStatus("success");
      setMessage("Thanks — we got your message and will reply soon.");
      return;
    }

    setStatus("error");
    setMessage(result.message || "Something went wrong. Please try again.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
          Full name
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-600 focus:ring"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-600 focus:ring"
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
          Phone (optional)
        </label>
        <input
          id="phone"
          name="phone"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-600 focus:ring"
        />
      </div>

      <div>
        <label htmlFor="timeline" className="mb-1 block text-sm font-medium text-slate-700">
          Buying timeline
        </label>
        <select
          id="timeline"
          name="timeline"
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-600 focus:ring"
          defaultValue=""
        >
          <option value="" disabled>
            Choose one
          </option>
          <option value="0-3 months">0–3 months</option>
          <option value="3-6 months">3–6 months</option>
          <option value="6+ months">6+ months</option>
          <option value="just exploring">Just exploring</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-slate-700">
          What do you need help with?
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-600 focus:ring"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Sending..." : "Send"}
      </button>

      {message && (
        <p className={status === "error" ? "text-sm text-red-700" : "text-sm text-green-700"}>{message}</p>
      )}
    </form>
  );
}
