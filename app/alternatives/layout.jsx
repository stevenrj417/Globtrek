// Alternatives are built from the visitor's own quiz answers, so they aren't a page to index.
export const metadata = { title: "More trips like this", robots: { index: false, follow: true } };

export default function AlternativesLayout({ children }) {
  return children;
}
