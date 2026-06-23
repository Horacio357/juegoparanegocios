import "./globals.css";

export const metadata = {
  title: "Arkanoid Premium",
  description: "Juego de recompensas y descuentos para negocios",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
