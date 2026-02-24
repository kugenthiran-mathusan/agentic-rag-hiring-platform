import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "Agentic RAG Hiring",
  description: "HR posts jobs, candidates apply, AI ranks resumes with evidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}