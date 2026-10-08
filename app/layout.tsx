import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
export const metadata = { title: "Mail Center", description: "Dashboard pengiriman Gmail pribadi" };
const init = `try{var t=localStorage.getItem('mc-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head><meta name="viewport" content="width=device-width, initial-scale=1" /><script dangerouslySetInnerHTML={{ __html: init }} /></head>
      <body>{children}</body>
    </html>
  );
}
