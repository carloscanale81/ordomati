import React, { useState, useEffect, useRef } from 'react';

export interface DecimalInputProps {
  value: number | null | undefined;
  onChange: (val: number) => void;
  onNull?: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  title?: string;
  id?: string;
}

export const DecimalInput: React.FC<DecimalInputProps> = ({
  value,
  onChange,
  onNull,
  min,
  max,
  disabled = false,
  className = '',
  placeholder,
  title,
  id
}) => {
  const isFocusedRef = useRef(false);
  const [text, setText] = useState<string>(
    typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
  );

  useEffect(() => {
    if (!isFocusedRef.current) {
      setText(typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(',', '.');
    // Allow empty, minus sign, digits, and a single decimal point
    if (!/^-?\d*\.?\d*$/.test(clean) && clean !== '') return;
    setText(clean);

    const trimmed = clean.trim();
    if (trimmed === '' || trimmed === '-') {
      if (onNull) onNull();
    } else {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed) && Number.isFinite(parsed)) {
        let clamped = parsed;
        if (typeof min === 'number' && clamped < min) clamped = min;
        if (typeof max === 'number' && clamped > max) clamped = max;
        onChange(clamped);
      }
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    const clean = text.trim().replace(',', '.');
    if (clean === '' || clean === '-') {
      if (onNull) {
        setText('');
        onNull();
      } else {
        const fallback = typeof min === 'number' ? min : 0;
        setText(String(fallback));
        onChange(fallback);
      }
    } else {
      const parsed = parseFloat(clean);
      if (!isNaN(parsed) && Number.isFinite(parsed)) {
        let clamped = parsed;
        if (typeof min === 'number' && clamped < min) clamped = min;
        if (typeof max === 'number' && clamped > max) clamped = max;
        setText(String(clamped));
        onChange(clamped);
      } else {
        setText(typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
      }
    }
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={text}
      placeholder={placeholder}
      title={title}
      onFocus={() => {
        isFocusedRef.current = true;
      }}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
};
