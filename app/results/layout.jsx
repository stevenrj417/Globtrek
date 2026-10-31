// Quiz results are personal to the traveler, so they stay out of search engines.
export const metadata = { title: "Your trip", robots: { index: false, follow: false } };

export default function ResultsLayout({ children }) {
  return children;
}
