import type { Metadata } from "next";
import { type ReactNode } from "react";
import { Providers } from "./providers";

import "../../styles/tailwind.css";

export const metadata: Metadata = {
  title: "Daimo Pay Extended Pay Demo",
  description: "Demo extended payment with force payment method selection",
};

export default function RootLayout(props: { children: ReactNode }) {
  return <Providers>{props.children}</Providers>;
} 