"use client";

import * as React from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[]; // Marked optional for extra safety
}

export function Select({ options = [], ...props }: SelectProps) {
  return (
    <select
      className="p-2 border rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    >
      {options.length === 0 ? (
        <option disabled>No options available</option>
      ) : (
        options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))
      )}
    </select>
  );
}
