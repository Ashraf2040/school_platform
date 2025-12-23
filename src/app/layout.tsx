import "./globals.css";
import type {ReactNode} from "react";

export const metadata = {
  title: "School Management Platform"
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
