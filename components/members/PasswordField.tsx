"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({ name, label, autoComplete, minLength = 1, hint }: { name: string; label: string; autoComplete: "new-password" | "current-password"; minLength?: number; hint?: string }) {
  const [visible, setVisible] = useState(false);
  return <div className="member-field">
    <label htmlFor={name}>{label}</label>
    <div className="member-password">
      <input id={name} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required minLength={minLength} maxLength={128} aria-describedby={hint ? `${name}-hint` : undefined} />
      <button type="button" onClick={() => setVisible(!visible)} aria-label={`${label}: ${visible ? "gizle" : "göster"}`} aria-pressed={visible}>{visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}</button>
    </div>
    {hint && <small id={`${name}-hint`}>{hint}</small>}
  </div>;
}
