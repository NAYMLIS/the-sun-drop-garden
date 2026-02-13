import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Nunito_Sans,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";

const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Sundrop Garden",
  description:
    "An immersive artist website featuring tour dates, music, and visual galleries.",
  icons: {
    icon: "/(((o)))(light).png",
    apple: "/(((o)))(light).png",
  },
  openGraph: {
    title: "The Sundrop Garden",
    description:
      "An immersive artist website featuring tour dates, music, and visual galleries.",
    images: [
      {
        url: "/Link Preview (The Sundrop Garden Tour).png",
        width: 1200,
        height: 630,
        alt: "The Sundrop Garden Tour",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Sundrop Garden",
    description:
      "An immersive artist website featuring tour dates, music, and visual galleries.",
    images: ["/Link Preview (The Sundrop Garden Tour).png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${nunitoSans.variable} ${playfairDisplay.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem
        >
          <ConvexClientProvider>
            <ToastProvider>
              {children}
              <Footer />
            </ToastProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
