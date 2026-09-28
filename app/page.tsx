"use client";

import { useCallback, useEffect, useState } from "react";
import AreaSection from "./components/areasection";
import { areas } from "./data/areas";
import { getAssignedPerson } from "./utils/assignments";
import {
  getCurrentWeekIndex,
  getWeekLabels,
  getWeeks,
} from "./utils/weeks";
import { getCellValue } from "../lib/helpers";
import { supabase } from "../lib/supabase";
import type { Entry } from "./types";

type Feedback = {
  type: "success" | "error";
  message: string;
};

const areaTitles: Record<string, string> = {
  hallway: "Hallway",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
};

function getTaskKey(area: string, task: string, week: number) {
  return `${area}:${task}:${week}`;
}

function getTodayString() {
  return new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function Home() {
  const currentWeek = getCurrentWeekIndex();
  const weeks = getWeeks();
  const weekLabels = getWeekLabels();
  const [selectedWeek, setSelectedWeek] = useState(currentWeek + 1);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("month", currentMonth);

      if (error) {
        console.error(error);
        setFeedback({
          type: "error",
          message:
            "Chores could not be loaded. Please check your connection and try again.",
        });
        return;
      }

      setEntries(data ?? []);
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "error",
        message:
          "Chores could not be loaded. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadEntries);

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
      void supabase.removeChannel(channel);
    };
  }, [loadEntries]);

  async function saveCell(
    area: string,
    task: string,
    week: number,
    value: string
  ) {
    const key = getTaskKey(area, task, week);
    setSavingKeys((current) => new Set(current).add(key));
    setFeedback(null);

    try {
      const { error } = await supabase.from("entries").upsert(
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
        setFeedback({
          type: "error",
          message: "That change could not be saved. Please try again.",
        });
        return;
      }

      setDraftValues((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setFeedback({ type: "success", message: "Chore updated." });
      await loadEntries();
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "error",
        message: "That change could not be saved. Please try again.",
      });
    } finally {
      setSavingKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }

  async function markDoneToday(area: string, task: string, week: number) {
    await saveCell(area, task, week, getTodayString());
  }

  const month = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const today = getTodayString();
  const isFutureWeek = selectedWeek - 1 > currentWeek;
  const visibleAreas = Object.entries(areas).map(
    ([area, tasks], areaIndex) => {
      const visibleTasks = tasks.filter(
        (task) => !task.week3Only || selectedWeek === 3
      );

      return {
        area,
        tasks: visibleTasks,
        areaIndex,
      };
    }
  );
  const completedCount = visibleAreas.reduce(
    (count, { area, tasks }) =>
      count +
      tasks.filter(
        (task) =>
          getCellValue(entries, area, task.name, selectedWeek).trim() !== ""
      ).length,
    0
  );
  const totalCount = visibleAreas.reduce(
    (count, { tasks }) => count + tasks.length,
    0
  );
  const progress = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  return (
    <main className="min-h-screen px-4 pb-12 pt-7 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-900/10 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-900">
              <span className="h-2 w-2 rounded-full bg-brand-600" />
              WG Chores
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              A little better, together.
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Your shared home, one week at a time.
            </p>
          </div>
          <p className="w-fit rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-900/5">
            {month}
          </p>
        </header>

        <section
          aria-label="Weekly chore progress"
          className="mb-5 rounded-2xl bg-brand-100 px-5 py-5 text-brand-900 shadow-sm sm:px-7 sm:py-6"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-800">
                {selectedWeek - 1 === currentWeek
                  ? "This week"
                  : `Week ${selectedWeek}`}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {completedCount}{" "}
                <span className="text-brand-800/80">
                  of {totalCount} chores done
                </span>
              </p>
            </div>
            <div className="w-full sm:w-52">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-brand-800">
                <span>Weekly progress</span>
                <span>{progress}%</span>
              </div>
              <div
                aria-label={`${progress}% complete`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={progress}
                className="h-2 overflow-hidden rounded-full bg-brand-200"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-brand-300 transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Choose a week"
          className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-900/5 sm:px-5 sm:py-4"
        >
          <button
            type="button"
            aria-label="Previous week"
            disabled={selectedWeek <= 1}
            onClick={() => setSelectedWeek((week) => Math.max(1, week - 1))}
            className="flex h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 sm:px-4"
          >
            <span aria-hidden="true" className="mr-2 text-base">
              &larr;
            </span>
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="min-w-0 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Week {selectedWeek}
              {selectedWeek - 1 === currentWeek && (
                <span className="ml-2 rounded-full bg-brand-50 px-2 py-1 tracking-normal text-brand-800">
                  Current
                </span>
              )}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-800 sm:text-base">
              {weekLabels[selectedWeek - 1]}
            </p>
          </div>

          <button
            type="button"
            aria-label="Next week"
            disabled={selectedWeek >= weeks.length}
            onClick={() =>
              setSelectedWeek((week) => Math.min(weeks.length, week + 1))
            }
            className="flex h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 sm:px-4"
          >
            <span className="hidden sm:inline">Next</span>
            <span aria-hidden="true" className="ml-2 text-base">
              &rarr;
            </span>
          </button>
        </section>

        {feedback && (
          <p
            role={feedback.type === "error" ? "alert" : "status"}
            className={`mb-5 rounded-xl px-4 py-3 text-sm font-medium ${
              feedback.type === "error"
                ? "bg-rose-50 text-rose-800 ring-1 ring-rose-200"
                : "bg-brand-50 text-brand-800 ring-1 ring-brand-200"
            }`}
          >
            {feedback.message}
          </p>
        )}

        {isFutureWeek && (
          <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            This week is coming up. Chores can be marked complete once it
            begins.
          </p>
        )}

        <div className="space-y-4">
          {visibleAreas.map(({ area, tasks, areaIndex }) => (
            <AreaSection
              key={area}
              title={areaTitles[area] ?? area}
              area={area}
              areaIndex={areaIndex}
              tasks={tasks}
              week={selectedWeek}
              entries={entries}
              getCellValue={getCellValue}
              getAssignedPerson={getAssignedPerson}
              getDraftValue={(task) =>
                draftValues[getTaskKey(area, task, selectedWeek)]
              }
              onDraftChange={(task, value) => {
                const key = getTaskKey(area, task, selectedWeek);
                setDraftValues((current) => ({ ...current, [key]: value }));
              }}
              onSave={saveCell}
              onMarkDone={markDoneToday}
              savingKeys={savingKeys}
              readOnly={isFutureWeek}
              isLoading={isLoading}
              today={today}
            />
          ))}
        </div>

        <p className="mt-7 text-center text-xs leading-5 text-slate-400">
          Chores keep the shared spaces feeling like home.
        </p>
      </div>
    </main>
  );
}
