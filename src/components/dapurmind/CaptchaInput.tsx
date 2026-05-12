'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* ── Math-based captcha generator ──────────────────────────────── */

interface CaptchaQuestion {
  question: string;
  answer: number;
  display: string;
}

function generateCaptcha(): CaptchaQuestion {
  const ops = [
    (a: number, b: number) => ({ question: `${a} + ${b}`, answer: a + b }),
    (a: number, b: number) => ({ question: `${a} - ${b}`, answer: a - b }),
    (a: number, b: number) => ({ question: `${a} × ${b}`, answer: a * b }),
  ];
  const opIndex = Math.floor(Math.random() * ops.length);
  let a: number, b: number;
  if (opIndex === 0) {
    // addition: 1-50
    a = Math.floor(Math.random() * 50) + 1;
    b = Math.floor(Math.random() * 50) + 1;
  } else if (opIndex === 1) {
    // subtraction: ensure positive result
    a = Math.floor(Math.random() * 50) + 10;
    b = Math.floor(Math.random() * a);
  } else {
    // multiplication: small numbers
    a = Math.floor(Math.random() * 12) + 1;
    b = Math.floor(Math.random() * 12) + 1;
  }
  const result = ops[opIndex](a, b);
  return {
    question: result.question,
    answer: result.answer,
    display: `${result.question} = ?`,
  };
}

/* ── Captcha Input Component ───────────────────────────────────── */

interface CaptchaInputProps {
  value: string;
  onChange: (val: string) => void;
  onVerify: (valid: boolean) => void;
  error?: boolean;
  label?: string;
  placeholder?: string;
}

export function CaptchaInput({
  value,
  onChange,
  onVerify,
  error,
  label,
  placeholder = 'Masukkan jawaban',
}: CaptchaInputProps) {
  const [captcha, setCaptcha] = useState<CaptchaQuestion>(generateCaptcha);
  const [verified, setVerified] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setCaptcha(generateCaptcha());
    onChange('');
    setVerified(null);
    onVerify(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [onChange, onVerify]);

  /* Auto-verify when value changes */
  useEffect(() => {
    if (value.trim() === '') {
      setVerified(null);
      onVerify(false);
      return;
    }
    const num = parseInt(value.trim(), 10);
    const valid = num === captcha.answer;
    setVerified(valid);
    onVerify(valid);
  }, [value, captcha.answer, onVerify]);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          {label}
        </label>
      )}

      {/* Captcha display card */}
      <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/30 p-3">
        {/* Question bubble */}
        <div className="flex h-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-3 shadow-sm">
          <span className="text-sm font-bold text-white select-none tracking-wide">
            {captcha.display}
          </span>
        </div>

        {/* Answer input */}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-11 rounded-xl border-border/50 bg-background pr-8 text-sm"
            autoComplete="off"
            inputMode="numeric"
          />
          {verified === true && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500 text-sm">
              ✓
            </span>
          )}
          {verified === false && value.trim() !== '' && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-500 text-sm">
              ✗
            </span>
          )}
        </div>

        {/* Refresh button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={refresh}
          className="h-11 w-11 shrink-0 rounded-xl hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Error feedback */}
      {error && verified === false && value.trim() !== '' && (
        <p className="text-[11px] text-rose-500">
          Jawaban salah. Coba hitung ulang atau refresh captcha.
        </p>
      )}
    </div>
  );
}
