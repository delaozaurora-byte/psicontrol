import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PsiControl - Centro de Psicología',
  description: 'Sistema de gestión para centro de psicología',
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
