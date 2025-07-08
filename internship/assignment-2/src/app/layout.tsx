import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Blog Summariser",
  description: "Scrape and summarize blog content with ease.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
         <div className="fixed bottom-15 right-15 z-50">
            <ThemeToggle />
          </div>
        </Providers>
      </body>
    </html>
  );
}
