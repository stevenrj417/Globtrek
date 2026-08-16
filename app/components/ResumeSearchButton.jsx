"use client";

export function ResumeSearchButton({ search }) {
  function resume() {
    window.localStorage.setItem("globtrekQuiz", JSON.stringify(search.search_data || {}));
    window.location.href = `/thinking?destination=${encodeURIComponent(search.destination_id || "")}`;
  }
  return <button type="button" onClick={resume} className="text-[9px] uppercase tracking-[0.2em]">Continue search →</button>;
}
