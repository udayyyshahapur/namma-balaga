import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input(props: Props) {
    return <input {...props} className={`border p-2 rounded w-full ${props.className ?? ""}`}/>;
}