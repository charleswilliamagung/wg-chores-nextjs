import { useRef } from "react";
import { Task, Entry } from "../types";
import { getCompletionCount } from "../../lib/helpers";

type AreaSectionProps = {
  title: string;
  area: string;
  areaIndex: number;
  tasks: Task[];
  weeks: number[];
  currentWeek: number;
  entries: Entry[];

  getCellValue: (
    entries: Entry[],
    area: string,
    task: string,
    week: number
  ) => string;

  saveCell: (
    area: string,
    task: string,
    week: number,
    value: string
  ) => Promise<void>;

  markDoneToday: (
    area: string,
    task: string,
    week: number,
    allowMultiple: boolean,
    currentValue: string
  ) => Promise<void>;

  getAssignedPerson: (
    week: number,
    areaIndex: number
  ) => string;
};

export default function AreaSection({
  title,
  area,
  areaIndex,
  tasks,
  weeks,
  currentWeek,
  entries,
  getCellValue,
  saveCell,
  markDoneToday,
  getAssignedPerson,
}: AreaSectionProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

return (
  <>
    <tr>
      <td className="border border-gray-300 p-2 bg-slate-200 text-slate-900 font-semibold">
        {title}
      </td>

      {weeks.map((week) => (
        <th
          key={week}
          className="border border-slate-300 p-3 text-center font-semibold"
        >
          {getAssignedPerson(
            week,
            areaIndex
          )}
        </th>
      ))}
    </tr>

    {tasks.map((task) => (
      <tr key={task.name}>
        <td className="border p-3 h-14">
          {task.name}
        </td>

        {weeks.map((week) => {
          const disabled =
            task.week3Only && week !== 3;

          const isFutureWeek =
            week - 1 > currentWeek;
          const value = getCellValue(
            entries,
            area,
            task.name,
            week
          );
          const cellKey = `${area}:${task.name}:${week}`;
          const allowMultiple =
            Boolean(task.allowMultipleCompletions) ||
            (task.weeklyCompletions ?? 1) > 1;
          const completionCount = getCompletionCount(value);

          return (
            <td
              key={week}
              className={`border p-2 ${
                disabled || isFutureWeek
                  ? "bg-slate-200"
                  : "bg-rose-50"
              }`}
            >
              {!disabled &&
                !isFutureWeek && (
                <>
                <div className="flex items-center gap-1">
                <input
                    key={value}
                    ref={(input) => {
                      inputRefs.current[cellKey] = input;
                    }}
                    defaultValue={value}
                    placeholder="dd.mm"
                    title={value}
                    aria-label={`${task.name} completion dates, week ${week}`}
                    className="w-full min-w-0 bg-transparent outline-none text-center"
                    onBlur={(e) =>
                    saveCell(
                        area,
                        task.name,
                        week,
                        e.target.value
                    )
                    }
                />

                <button
                    type="button"
                    className="
                    text-xs
                    px-2
                    py-1
                    bg-slate-200
                    hover:bg-slate-300
                    rounded
                    "
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() =>
                    markDoneToday(
                        area,
                        task.name,
                        week,
                        allowMultiple,
                        inputRefs.current[cellKey]?.value ?? value
                    )
                    }
                >
                    +
                </button>
                </div>
                {(task.weeklyCompletions || task.allowMultipleCompletions) && (
                  <p className="mt-1 text-center text-xs text-slate-500">
                    {task.weeklyCompletions
                      ? `${completionCount}/${task.weeklyCompletions} this week`
                      : `${completionCount} this week`}
                  </p>
                )}
                </>
                )}
            </td>
          );
        })}
      </tr>
    ))}
  </>
);
}