import * as React from "react";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-2xl border bg-white/70 shadow-md p-6 ${props.className ?? ""}`}
    />
  );
}

export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h1 {...props} className={`text-2xl font-semibold mb-4 ${props.className ?? ""}`} />;
}

export function CardFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`mt-4 text-sm text-gray-600 ${props.className ?? ""}`} />;
}
