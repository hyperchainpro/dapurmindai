'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ShieldCheck } from 'lucide-react';

interface MathCaptchaProps {
  onVerify: (isCorrect: boolean) => void;
  onCaptchaChange?: (value: string) => void;
  resetTrigger?: number;
}

const OPERATIONS = ['+', '-', '\u00d7'] as const;
const MAX_NUM = 12;

function generateCaptcha(): { question: string; answer: number } {
  const op = OPERATIONS[Math.floor(Math.random() * OPERATIONS.length)];
  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * MAX_NUM) + 1;
      b = Math.floor(Math.random() * MAX_NUM) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * MAX_NUM) + 5;
      b = Math.floor(Math.random() * (a - 1)) + 1;
      answer = a - b;
      break;
    case '\u00d7':
      a = Math.floor(Math.random() * 8) + 2;
      b = Math.floor(Math.random() * 8) + 2;
      answer = a * b;
      break;
  }

  return { question: `${a} ${op} ${b} = ?`, answer };
}

export function MathCaptcha({ onVerify, onCaptchaChange, resetTrigger }: MathCaptchaProps) {
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [input, setInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const regenerate = useCallback(() => {
    const newCaptcha = generateCaptcha();
    setCaptcha(newCaptcha);
    setInput('');
    setIsVerified(false);
    onCaptchaChange?.('');
    onVerify(false);
    inputRef.current?.focus();
  }, [onCaptchaChange, onVerify]);

  React.useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0) {
      regenerate();
    }
  }, [resetTrigger, regenerate]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^0-9\-]/g, '');
      setInput(val);
      onCaptchaChange?.(val);

      if (val === '') {
        setIsVerified(false);
        onVerify(false);
      } else if (val === String(captcha.answer)) {
        setIsVerified(true);
        onVerify(true);
      } else {
        setIsVerified(false);
        onVerify(false);
      }
    },
    [captcha.answer, onCaptchaChange, onVerify]
  );

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">
        <ShieldCheck className="inline-block h-3 w-3 mr-1" />
        Verifikasi Captcha
      </label>

      <div className="flex items-center gap-2">
        {/* Captcha question box */}
        <div className="flex-shrink-0 flex items-center justify-center h-11 px-4 rounded-xl nm-raised-sm bg-emerald-500/10">
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 tracking-wide select-none">
            {captcha.question}
          </span>
        </div>

        {/* Answer input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={input}
            onChange={handleChange}
            placeholder="Jawaban"
            maxLength={4}
            className={`h-11 w-full rounded-xl nm-input pl-3 pr-9 text-sm text-[var(--nm-text)] placeholder:text-[var(--nm-text-light)] ${
              isVerified
                ? 'shadow-[0_0_0_1px_rgba(34,197,94,0.3)]'
                : ''
            }`}
          />
          {isVerified && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm font-bold">
              &#10003;
            </span>
          )}
        </div>

        {/* Refresh button */}
        <motion.button
          type="button"
          onClick={regenerate}
          whileTap={{ scale: 0.9, rotate: 180 }}
          className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl nm-btn text-[var(--nm-text-muted)] hover:text-emerald-500 transition-all"
          aria-label="Ganti captcha"
        >
          <RefreshCw className="h-4 w-4" />
        </motion.button>
      </div>

      {isVerified ? (
        <p className="text-[11px] font-medium text-green-600 dark:text-green-400">
          Captcha terverifikasi
        </p>
      ) : input.length > 0 ? (
        <p className="text-[11px] text-transparent">placeholder</p>
      ) : null}
    </div>
  );
}

export { generateCaptcha };
