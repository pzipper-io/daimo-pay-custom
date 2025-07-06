import type { Metadata } from "next";
import { type ReactNode } from "react";
import { Providers } from "./providers";

import "../../styles/tailwind.css";

export const metadata: Metadata = {
  title: "Daimo Pay Extended Deposit Demo",
  description: "Demo extended deposit with waiting payment callback and force payment methods",
};

export default function RootLayout(props: { children: ReactNode }) {
  return <Providers>{props.children}</Providers>;
} 