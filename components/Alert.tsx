import * as React from "react";

export function AlertSuccess({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-green-800">{children}</div>
    )
}

export function AlertError({ children}: { children: React.ReactNode }) {
    return (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800">{children}</div>
    )
}

