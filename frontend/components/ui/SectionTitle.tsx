import React, { ReactNode } from "react";

type SectionTitleProps = {
  children: ReactNode;
  className?: string;
};

export default function SectionTitle({ children, className = "" }: SectionTitleProps) {
  return (
    <h2
      className={`text-2xl font-bold text-green-700 mb-6 ${className}`}
    >
      {children}
    </h2>
  );
}
