import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cronograma del Proyecto",
  description: "Diagrama de Gantt dinámico",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
