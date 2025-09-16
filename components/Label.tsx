import * as React from "react";
type Props = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label(props: Props) {
  return <label {...props} className={`text-sm font-medium ${props.className ?? ""}`} />;
}
