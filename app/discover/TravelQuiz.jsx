"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const questions = [
  {
    id: "alive",
    eyebrow: "Question 01",
    question: "Where do you feel most alive?",
    options: [
      {
        label: "Ocean",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      },
      {
        label: "Mountains",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      },
      {
        label: "Cities",
        image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
      },
      {
        label: "Road Trips",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
      },
      {
        label: "Culture",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
      },
      {
        label: "Surprise Me",
        image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325",
      },
    ],
  },
  {
    id: "escape",
    eyebrow: "Question 02",
    question: "What pace sounds right?",
    options: [
      {
        label: "Slow mornings",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      },
      {
        label: "Balanced days",
        image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963",
      },
      {
        label: "Packed schedule",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      },
      {
        label: "Mostly relaxing",
        image: "https://images.unsplash.com/photo-1494526585095-c41746248156",
      },
      {
        label: "Adventure days",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
      },
      {
        label: "Surprise me",
        image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
      },
    ],
  },
  {
    id: "self",
    eyebrow: "Question 03",
    question: "Who is coming with you?",
    options: [
      {
        label: "Solo",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
      },
      {
        label: "Couple",
        image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963",
      },
      {
        label: "Friends",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
      },
      {
        label: "Family",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      },
      {
        label: "Honeymoon",
        image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
      },
      {
        label: "Not sure",
        image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
      },
    ],
  },
  {
    id: "hotel",
    eyebrow: "Question 04",
    question: "Where would you rather stay?",
    options: [
      {
        label: "Boutique hotel",
        image: "https://images.unsplash.com/photo-1494526585095-c41746248156",
      },
      {
        label: "Beach resort",
        image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
      },
      {
        label: "Mountain lodge",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      },
      {
        label: "Private villa",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
      },
      {
        label: "Design hotel",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      },
      {
        label: "Traditional inn",
        image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963",
      },
    ],
  },
  {
    id: "luxury",
    eyebrow: "Question 05",
    question: "What matters most when you travel?",
    options: [
      {
        label: "Food",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      },
      {
        label: "Nature",
        image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963",
      },
      {
        label: "Culture",
        image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
      },
      {
        label: "Nightlife",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      },
      {
        label: "Wellness",
        image: "https://images.unsplash.com/photo-1494526585095-c41746248156",
      },
      {
        label: "Shopping",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
      },
    ],
  },
  {
    id: "memory",
    eyebrow: "Question 06",
    question: "What budget feels right?",
    options: [
      {
        label: "Smart value",
        image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963",
      },
      {
        label: "Comfortable",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      },
      {
        label: "Premium",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
      },
      {
        label: "Blowout",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      },
      {
        label: "Mixed",
        image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
      },
      {
        label: "Not sure",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
      },
    ],
  },
  {
    id: "length",
    eyebrow: "Question 07",
    question: "How much time can this trip hold?",
    options: [
      {
        label: "Long Weekend",
        image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
      },
      {
        label: "Five Nights",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      },
      {
        label: "One Week",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
      },
      {
        label: "Ten Days",
        image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963",
      },
      {
        label: "Two Weeks",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      },
      {
        label: "Open-Ended",
        image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
      },
    ],
  },
];

export default function TravelQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [tripStart, setTripStart] = useState("");
  const [tripEnd, setTripEnd] = useState("");
  const [isFlexible, setIsFlexible] = useState(false);

  const isDateStep = step === questions.length;
  const currentQuestion = questions[step];
  const answeredCount = questions.filter((question) => answers[question.id])
    .length;
  const progress = Math.round(
    (Math.min(step, questions.length) / questions.length) * 100,
  );
  const canSubmit =
    answeredCount === questions.length &&
    (isFlexible || (Boolean(tripStart) && Boolean(tripEnd)));

  const selectedSummary = useMemo(
    () =>
      questions
        .map((question) => answers[question.id])
        .filter(Boolean)
        .slice(0, 4)
        .join(" / "),
    [answers],
  );

  function choose(questionId, label) {
    setAnswers((current) => ({ ...current, [questionId]: label }));
    setTimeout(() => {
      setStep((currentStep) =>
        currentStep < questions.length ? currentStep + 1 : currentStep,
      );
    }, 160);
  }

  function submitQuiz(event) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    window.localStorage.setItem(
      "globtrekQuiz",
      JSON.stringify({
        answers,
        tripStart,
        tripEnd,
        isFlexible,
        createdAt: Date.now(),
      }),
    );
    window.location.assign("/thinking");
  }

  return (
    <section
      id="quiz"
      className="bg-[radial-gradient(circle_at_top_left,rgba(127,99,77,0.22),transparent_30%),linear-gradient(180deg,#070604_0%,#0f0c08_48%,#050403_100%)] py-8 sm:py-12"
    >
      <div className="mx-auto max-w-[1800px] px-5 sm:px-8">
        <div className="mb-10 border-b border-[#efe6dc]/10 pb-7">
          <div className="ml-auto w-full max-w-md">
            <div className="flex justify-between text-xs uppercase tracking-[0.18em] text-[#8f857b]">
              <span>{isDateStep ? "Reveal" : currentQuestion.eyebrow}</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-4 h-px bg-[#efe6dc]/10">
              <div
                className="h-px bg-[#efe6dc] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={submitQuiz}>
          {!isDateStep ? (
            <div>
              <div className="mb-9">
                <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-[#8f857b]">
                  {currentQuestion.eyebrow}
                </p>
                <h3 className="max-w-4xl text-[clamp(2rem,4.2vw,3.625rem)] font-light leading-[1.05] text-[#efe6dc]">
                  {currentQuestion.question}
                </h3>
              </div>

              <div className="mx-auto grid max-w-[1180px] gap-4 lg:grid-cols-6">
                {currentQuestion.options.map((option, index) => {
                  const isSelected =
                    answers[currentQuestion.id] === option.label;

                  return (
                    <button
                      className={`group relative h-[190px] overflow-hidden bg-[#111] text-center outline-none ring-1 transition duration-500 ease-out sm:h-[214px] ${
                        index < 2 ? "lg:col-span-3" : "lg:col-span-2"
                      } ${
                        isSelected
                          ? "ring-2 ring-[#efe6dc]"
                          : "ring-[#efe6dc]/10 hover:-translate-y-1 hover:ring-[#efe6dc]/65"
                      }`}
                      key={option.label}
                      onClick={() => choose(currentQuestion.id, option.label)}
                      type="button"
                    >
                      <Image
                        src={option.image}
                        alt=""
                        fill
                        className="object-cover brightness-[0.54] saturate-[0.82] contrast-125 transition duration-700 ease-out group-hover:scale-[1.07] group-hover:brightness-[0.76]"
                        sizes={
                          index < 2
                            ? "(min-width: 1024px) 43vw, (min-width: 640px) 48vw, 100vw"
                            : "(min-width: 1024px) 28vw, (min-width: 640px) 48vw, 100vw"
                        }
                        quality={75}
                      />
                      <div className="absolute inset-0 bg-black/34 transition duration-500 group-hover:bg-black/22" />
                      <div className="absolute inset-0 opacity-0 ring-1 ring-inset ring-[#efe6dc]/75 transition duration-500 group-hover:opacity-100" />
                      {isSelected ? (
                        <div className="absolute right-4 top-4 grid h-9 w-9 place-items-center border border-[#efe6dc] bg-black/45 text-lg text-[#efe6dc] backdrop-blur">
                          ✓
                        </div>
                      ) : null}

                      <div className="absolute inset-0 grid place-items-center p-5 sm:p-6">
                        <h4 className="text-xl font-light leading-tight sm:text-2xl">
                          {option.label}
                        </h4>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 flex items-center justify-between gap-5">
                <button
                  className="border border-[#efe6dc]/20 px-6 py-3 text-xs uppercase tracking-[0.18em] text-[#d8c7b6] transition duration-300 hover:border-[#efe6dc] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  disabled={step === 0}
                  onClick={() => setStep((currentStep) => currentStep - 1)}
                  type="button"
                >
                  Back
                </button>

                <button
                  className="bg-[#efe6dc] px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black transition duration-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!answers[currentQuestion.id]}
                  onClick={() => setStep((currentStep) => currentStep + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#b8a796]">
                  Final Step
                </p>
                <h3 className="mt-5 text-[clamp(2rem,4.4vw,3.75rem)] font-light leading-[1]">
                  When are you leaving?
                </h3>
                <p className="mt-5 text-lg font-light text-[#d8c7b6]">
                  Flexible dates are welcome.
                </p>

                {selectedSummary ? (
                  <p className="mt-8 max-w-xl border-l border-[#7f634d] pl-6 text-sm uppercase tracking-[0.14em] text-[#d8c7b6]">
                    {selectedSummary}
                  </p>
                ) : null}
              </div>

              <div className="border border-[#efe6dc]/10 bg-[#0f0d0b] p-6 shadow-2xl shadow-black/30 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    ["Spring", "Mar-May"],
                    ["Summer", "Jun-Aug"],
                    ["Fall", "Sep-Nov"],
                  ].map(([label, value]) => (
                    <button
                      className="border border-[#efe6dc]/10 bg-black/25 px-4 py-4 text-left transition duration-300 hover:border-[#efe6dc]/60 hover:bg-[#efe6dc]/10"
                      key={label}
                      onClick={() => {
                        setIsFlexible(true);
                        setTripStart("");
                        setTripEnd("");
                        setAnswers((current) => ({
                          ...current,
                          season: `${label} (${value})`,
                        }));
                      }}
                      type="button"
                    >
                      <span className="block text-xs uppercase tracking-[0.18em] text-[#8f857b]">
                        {label}
                      </span>
                      <span className="mt-2 block text-lg font-light text-[#efe6dc]">
                        {value}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.18em] text-[#8f857b]">
                      Depart
                    </span>
                    <input
                      className="mt-3 w-full border border-[#efe6dc]/10 bg-black px-4 py-4 text-lg text-[#efe6dc] outline-none transition [color-scheme:dark] focus:border-[#efe6dc] disabled:opacity-35"
                      disabled={isFlexible}
                      name="tripStart"
                      onChange={(event) => setTripStart(event.target.value)}
                      required={!isFlexible}
                      type="date"
                      value={tripStart}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.18em] text-[#8f857b]">
                      Return
                    </span>
                    <input
                      className="mt-3 w-full border border-[#efe6dc]/10 bg-black px-4 py-4 text-lg text-[#efe6dc] outline-none transition [color-scheme:dark] focus:border-[#efe6dc] disabled:opacity-35"
                      disabled={isFlexible}
                      min={tripStart}
                      name="tripEnd"
                      onChange={(event) => setTripEnd(event.target.value)}
                      required={!isFlexible}
                      type="date"
                      value={tripEnd}
                    />
                  </label>
                </div>

                <label className="mt-6 flex cursor-pointer items-center gap-3 border-y border-[#efe6dc]/10 py-5 text-sm text-[#d8c7b6]">
                  <input
                    checked={isFlexible}
                    className="h-5 w-5 accent-[#efe6dc]"
                    onChange={(event) => {
                      setIsFlexible(event.target.checked);
                      if (event.target.checked) {
                        setTripStart("");
                        setTripEnd("");
                      }
                    }}
                    type="checkbox"
                  />
                  <span>I&apos;m flexible</span>
                </label>

                <div className="mt-7 grid gap-3 text-sm text-[#b8a796]">
                  {questions.map((question) => (
                    <div
                      className="flex justify-between gap-5 border-b border-[#efe6dc]/10 py-3"
                      key={question.id}
                    >
                      <span>{question.question}</span>
                      <strong className="text-right font-normal text-[#efe6dc]">
                        {answers[question.id]}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-5">
                  <button
                    className="border border-[#efe6dc]/20 px-6 py-3 text-sm uppercase tracking-[0.18em] text-[#d8c7b6] transition duration-300 hover:border-[#efe6dc] hover:text-white"
                    onClick={() => setStep(questions.length - 1)}
                    type="button"
                  >
                    Back
                  </button>

                  <button
                    className="bg-[#efe6dc] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-black transition duration-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!canSubmit}
                    type="submit"
                  >
                    Reveal My Trip
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

      </div>
    </section>
  );
}
