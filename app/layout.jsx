import "./globals.css";
export const metadata = {
  title: "Battle of the Ancients · Tic Tac Toe",
  description:
    "A Dota 2 inspired, two-player Tic Tac Toe arena. Pick your heroes. Claim three. Defend your Ancient.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
