import React, { useState, useEffect } from 'react';

interface NumericCellProps {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  allowZero?: boolean;
  id?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

export default function NumericCell({
  value,
  onChange,
  placeholder = "-",
  className = "",
  allowZero = false,
  id,
  onKeyDown,
}: NumericCellProps) {
  // Local string state to handle typing decimals (like '12.' or '12,5') seamlessly
  const [localVal, setLocalVal] = useState<string>('');

  // Sync with value changes from parent (e.g. on reset or sample load)
  useEffect(() => {
    if (value === 0) {
      setLocalVal('');
    } else {
      setLocalVal(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    
    // Normalize commas to dots for robust float parsing (crucial for Indonesian decimal locale!)
    const normalized = raw.replace(',', '.');
    
    // Validate that the normalized typing is a starting float string
    if (normalized === '' || /^-?\d*\.?\d*$/.test(normalized)) {
      setLocalVal(raw); // Store the original text layout so we don't disrupt their typing
      
      const parsed = parseFloat(normalized);
      if (!isNaN(parsed)) {
        onChange(parsed);
      } else {
        onChange(0);
      }
    }
  };

  const handleBlur = () => {
    const normalized = localVal.replace(',', '.');
    const parsed = parseFloat(normalized);
    if (localVal === '' || isNaN(parsed) || parsed === 0) {
      setLocalVal('');
      onChange(0);
    } else {
      // Format cleanly to standard string format
      setLocalVal(parsed.toString());
      onChange(parsed);
    }
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={(e) => {
        // Highlight the entire content when focused, so users can overwrite easily
        e.currentTarget.select();
      }}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={className}
    />
  );
}
