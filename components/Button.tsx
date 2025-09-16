import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button(props: Props) {
    return <button {...props} className={`bg-black text-white px-4 py-2 rounded ${props.className ?? ""}`}/>;
}