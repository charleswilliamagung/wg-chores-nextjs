"use client";

import { useEffect, useState } from "react";
import AreaSection from "./components/areasection";
import { areas } from "./data/areas";
import { Entry } from "./types";
import {
  getCompletionCount,
  getCellValue,
} from "../lib/helpers";
import {
  getCurrentWeekIndex,
  getWeekLabels,
} from "./utils/weeks";
import { getAssignedPerson } from "./utils/assignments";
import { supabase } from "../lib/supabase";

const areaList = [
  { key: "hallway", title: "Hallway" },
  { key: "kitchen", title: "Kitchen" },
  { key: "bathroom", title: "Bathroom" },
] as const;

export default function Home() {
  const currentWeek = getCurrentWeekIndex() + 1;
  const weekLabels = getWeekLabels();
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selectedWeekLabel = weekLabels[selectedWeek - 1] ?? "";
  const selectedWeekIsCurrent = selectedWeek === currentWeek;
  const allVisibleTasks = areaList.flatMap(({ key }) =>
    areas[key].filter((task) => !task.week3Only || selectedWeek === 3)
  );
  const completedCount = allVisibleTasks.filter((task) => {
    const area = areaList.find(({ key }) => areas[key].includes(task));
    return area
      ? getCompletionCount(
          getCellValue(entries, area.key, task.name, selectedWeek)
        ) >= (task.weeklyCompletions ?? 1)
      : false;
  }).length;
  const progress = allVisibleTasks.length
    ? Math.round((completedCount / allVisibleTasks.length) * 100)
    : 0;

  function getTodayString() {
    return new Date().toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  async function loadEntries() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("month", currentMonth);

    if (error) {
      console.error(error);
      setSaveError("Unable to load chores. Please refresh and try again.");
      return;
    }

    setEntries(data ?? []);
    setSaveError(null);
  }

  async function saveCell(
    area: string,
    task: string,
    week: number,
    value: string
  ) {
    const { error } = await supabase
      .from("entries")
      .upsert(
        [
          {
            area,
            task,
            week,
            month: new Date().toISOString().slice(0, 7),
            value,
          },
        ],
        {
          onConflict: "month,area,task,week",
        }
      );

    if (error) {
      console.error(error);
      setSaveError("Unable to save chore. Please try again.");
      return;
    }

    setSaveError(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
    await loadEntries();
  }

  async function markDoneToday(
    area: string,
    task: string,
    week: number,
    maxCompletions: number | null,
    currentValue: string
  ) {
    const completionCount = getCompletionCount(currentValue);
    if (maxCompletions !== null && completionCount >= maxCompletions) {
      return;
    }

    const today = getTodayString();
    const value =
      currentValue
        ? `${currentValue} | ${today}`
        : today;

    await saveCell(area, task, week, value);
  }

  useEffect(() => {
    const loadTimeout = window.setTimeout(() => {
      void loadEntries();
    }, 0);

    const channel = supabase
      .channel("entries-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "entries",
        },
        () => {
          void loadEntries();
        }
      )
      .subscribe();

    return () => {
      window.clearTimeout(loadTimeout);
      void supabase.removeChannel(channel);
    };
  }, []);

  const month = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#fff9f8] px-4 py-8 text-slate-900 sm:py-10">
      <div className="mx-auto w-full max-w-[512px]">
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#f1e2e4] bg-white px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] text-[#a35e70]">
              <span className="size-1.5 rounded-full bg-[#c67c8c]" />
              WG CHORES
            </span>
            <h1 className="mt-2 text-[21px] font-bold leading-tight tracking-[-0.03em]">
              A little better, together.
            </h1>
            <p className="mt-1 text-[11px] text-slate-500">
              Your shared home, one week at a time.
            </p>
          </div>
          <span className="mb-0.5 shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] text-slate-500">
            {month}
          </span>
        </header>

        <section
          aria-label="Weekly progress"
          className="mb-2.5 flex items-center justify-between rounded-xl border border-[#f2e1e3] bg-[#fbedef] px-4 py-3"
        >
          <div>
            <p className="text-[10px] text-slate-600">
              {selectedWeekIsCurrent ? "This week" : `Week ${selectedWeek}`}
            </p>
            <p className="mt-0.5 text-[14px] font-semibold text-[#a65f70]">
              {completedCount} of {allVisibleTasks.length} chores done
            </p>
          </div>
          <div className="w-[104px]">
            <div className="mb-1 flex justify-between text-[9px] text-slate-500">
              <span>Weekly progress</span>
              <span>{progress}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Weekly chore progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="h-1 overflow-hidden rounded-full bg-white"
            >
              <div
                className="h-full rounded-full bg-[#c77989] transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>

        <nav
          aria-label="Choose week"
          className="mb-2.5 flex items-center justify-between rounded-xl border border-[#eadfe0] bg-white px-2.5 py-2"
        >
          <button
            type="button"
            disabled={selectedWeek <= 1}
            onClick={() => setSelectedWeek((week) => Math.max(1, week - 1))}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-[8px] font-semibold tracking-[0.1em] text-slate-400">
              WEEK {selectedWeek}
              {selectedWeekIsCurrent && (
                <span className="rounded-full bg-[#fbedef] px-1.5 py-0.5 tracking-normal text-[#a65f70]">
                  CURRENT
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-800">
              {selectedWeekLabel.replace(" - ", " – ")}
            </p>
          </div>
          <button
            type="button"
            disabled={selectedWeek >= currentWeek}
            onClick={() =>
              setSelectedWeek((week) => Math.min(currentWeek, week + 1))
            }
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </nav>

        {saved && (
          <p role="status" className="mb-2 text-center text-xs text-green-700">
            Saved
          </p>
        )}
        {saveError && (
          <p role="alert" className="mb-2 text-center text-xs text-red-600">
            {saveError}
          </p>
        )}

        <div className="space-y-2">
          {areaList.map(({ key, title }, areaIndex) => (
            <AreaSection
              key={key}
              title={title}
              area={key}
              areaIndex={areaIndex}
              tasks={areas[key]}
              week={selectedWeek}
              entries={entries}
              getAssignedPerson={getAssignedPerson}
              saveCell={saveCell}
              markDoneToday={markDoneToday}
            />
          ))}
        </div>

        <footer className="mt-4 text-center text-[9px] text-slate-400">
          Chores keep the shared space feeling like home.
        </footer>
      </div>
    </main>
  );
}
