"use client";

import AreaSection from "./components/areasection";
import { Task, Entry } from "./types";
import { areas } from "./data/areas";
import {
  getWeeks,
  getWeekLabels,
  getCurrentWeekIndex,
} from "./utils/weeks";
import { getAssignedPerson } from "./utils/assignments";
import { getCellValue } from "../lib/helpers";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {

  const currentWeek = getCurrentWeekIndex();
  const weeks = getWeeks();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saved, setSaved] = useState(false);

    async function markDoneToday(
  area: string,
  task: string,
  week: number
) {
  await saveCell(
    area,
    task,
    week,
    getTodayString()
  );
}


  function getTodayString() {
    return new Date().toLocaleDateString(
    "de-DE",
        {
          day: "2-digit",
          month: "2-digit",
        }
      );
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

  if (!error) {

  setSaved(true);

  setTimeout(() => {
    setSaved(false);
  }, 2000);

  await loadEntries();
}
}

  async function loadEntries() {

    const currentMonth = new Date()
      .toISOString()
      .slice(0, 7);

    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("month", currentMonth);

    if (data) {
      setEntries(data);
    }

    if (error) {
      console.error(error);
    }
  }

  useEffect(() => {
  loadEntries();

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
        loadEntries();
      }
    )
    .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const month = new Date().toLocaleString(
  "en-US",
  { month: "long", year: "numeric" }
  );

  const weekLabels = getWeekLabels();

  return (
    <main className="p-8 min-h-screen bg-stone-100 text-slate-900">
      <h1 className="text-4xl font-bold mb-2">
        WG Chores
      </h1>

      <h2 className="text-lg text-slate-500 mb-6">
        {month}
      </h2>

      {saved && (
        <p className="text-green-600 mb-4">
          ✅ Saved
        </p>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
        <table className="min-w-[900px] border-collapse shadow-sm">
          <thead>
            <tr>
              <th className="border border-slate-300 p-3 bg-slate-100 text-slate-800 text-center font-semibold"
                >
                Task
              </th>

              {weeks.map((week) => (
                <th
                  key={week}
                  className={`border border-slate-300 p-3 text-center font-semibold ${
                    week - 1 === currentWeek
                      ? "bg-green-200"
                      : "bg-slate-100"
                  }`}
                >
                  {weekLabels[week - 1]}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>

            {/* Hallway */}

            <AreaSection
              title="Hallway"
              area="hallway"
              areaIndex={0}
              tasks={areas.hallway}
              weeks={weeks}
              currentWeek={currentWeek}
              entries={entries}
              getCellValue={getCellValue}
              saveCell={saveCell}
              markDoneToday={markDoneToday}
              getAssignedPerson={getAssignedPerson}
            />

            {/* Kitchen */}

            <AreaSection
              title="Kitchen"
              area="kitchen"
              areaIndex={1}
              tasks={areas.kitchen}
              weeks={weeks}
              currentWeek={currentWeek}
              entries={entries}
              getCellValue={getCellValue}
              saveCell={saveCell}
              markDoneToday={markDoneToday}
              getAssignedPerson={getAssignedPerson}
            />

            {/* Bathroom */}

            <AreaSection
              title="Bathroom"
              area="bathroom"
              areaIndex={2}
              tasks={areas.bathroom}
              weeks={weeks}
              currentWeek={currentWeek}
              entries={entries}
              getCellValue={getCellValue}
              saveCell={saveCell}
              markDoneToday={markDoneToday}
              getAssignedPerson={getAssignedPerson}
            />

          </tbody>
        </table>
      </div>
    </main>
  );
}