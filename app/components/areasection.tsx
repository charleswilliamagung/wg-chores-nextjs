import { useState } from "react";
import { Entry, Task } from "../types";
import { getCellValue, getCompletionCount } from "../../lib/helpers";

type AreaSectionProps = {
  title: string;
  area: string;
  areaIndex: number;
  tasks: Task[];
  week: number;
  entries: Entry[];
  getAssignedPerson: (week: number, areaIndex: number) => string;
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
    maxCompletions: number | null,
    currentValue: string
  ) => Promise<void>;
};

type TaskRowProps = {
  task: Task;
  area: string;
  week: number;
  value: string;
  saveCell: AreaSectionProps["saveCell"];
  markDoneToday: AreaSectionProps["markDoneToday"];
};

function TaskRow({
  task,
  area,
  week,
  value,
  saveCell,
  markDoneToday,
}: TaskRowProps) {
  const target = task.weeklyCompletions ?? 1;
  const isTwoDateTask = target === 2;
  const isUnlimitedMultiTask = Boolean(task.allowMultipleCompletions);
  const [dateValues, setDateValues] = useState(() => {
    const dates = value
      ? value.split("|").map((date) => date.trim())
      : [];
    if (isTwoDateTask) {
      return [dates[0] ?? "", dates[1] ?? ""];
    }
    return isUnlimitedMultiTask ? dates : [value];
  });
  const completionCount = getCompletionCount(value);
  const isComplete = completionCount >= target;
  const canRepeat = isUnlimitedMultiTask || target > 1;
  const maxCompletions = isUnlimitedMultiTask ? null : target;
  const currentValue = isTwoDateTask || isUnlimitedMultiTask
    ? dateValues.filter((date) => date.trim()).join(" | ")
    : dateValues[0] ?? "";
  const saveCurrentValue = () => saveCell(area, task.name, week, currentValue);
  const dateFields = isTwoDateTask
    ? [0, 1]
    : dateValues.map((_, index) => index);

  return (
    <li className="flex min-h-[47px] flex-wrap items-center gap-2.5 py-2">
      <span
        aria-hidden="true"
        className={`flex size-[15px] shrink-0 items-center justify-center rounded-full border ${
          isComplete
            ? "border-[#bd7182] bg-[#bd7182] text-white"
            : "border-slate-300 bg-white"
        }`}
      >
        {isComplete && <span className="text-[10px] leading-none">✓</span>}
      </span>
      <span
        className={`min-w-0 flex-1 text-[12px] ${
          isComplete ? "text-slate-500" : "text-slate-700"
        }`}
      >
        {task.name}
        {target > 1 && (
          <span className="ml-1 text-[10px] text-slate-400">
            {completionCount}/{target}
          </span>
        )}
      </span>

      {dateFields.map((index) => {
        const secondDateLocked =
          isTwoDateTask && index === 1 && !dateValues[0]?.trim();

        return (
          <input
            key={index}
            value={dateValues[index] ?? ""}
            disabled={secondDateLocked}
            placeholder="dd.mm"
            title={dateValues[index] || undefined}
            aria-label={`${task.name} completion date ${index + 1}`}
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              setDateValues((dates) => {
                if (isTwoDateTask && index === 0 && !nextValue.trim()) {
                  return ["", ""];
                }
                return dates.map((date, dateIndex) =>
                  dateIndex === index ? nextValue : date
                );
              });
            }}
            onBlur={saveCurrentValue}
            className={`h-8 w-[76px] shrink-0 rounded-lg border px-2 text-center text-[11px] outline-none placeholder:text-slate-400 focus:border-[#c17a89] ${
              secondDateLocked
                ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          />
        );
      })}

      {isUnlimitedMultiTask &&
        (!dateValues.length || dateValues.every((date) => date.trim())) && (
          <button
            type="button"
            onClick={() => setDateValues((dates) => [...dates, ""])}
            className="h-8 shrink-0 rounded-lg border border-[#eadfe0] px-2 text-[11px] font-medium text-[#a65f70] hover:bg-[#fff6f5]"
          >
            + Add date
          </button>
        )}

      <button
        type="button"
        disabled={!canRepeat && isComplete}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() =>
          markDoneToday(
            area,
            task.name,
            week,
            maxCompletions,
            currentValue
          )
        }
        className={`h-8 min-w-[84px] shrink-0 rounded-lg px-2 text-[11px] font-medium transition-colors ${
          !canRepeat && isComplete
            ? "cursor-default bg-[#fff6f5] text-[#a75e70]"
            : "bg-[#ad6475] text-white hover:bg-[#965466]"
        }`}
      >
        {!canRepeat && isComplete ? "Done today" : "Mark done"}
      </button>
    </li>
  );
}

export default function AreaSection({
  title,
  area,
  areaIndex,
  tasks,
  week,
  entries,
  getAssignedPerson,
  saveCell,
  markDoneToday,
}: AreaSectionProps) {
  const visibleTasks = tasks.filter(
    (task) => !task.week3Only || week === 3
  );
  const completedTasks = visibleTasks.filter((task) => {
    const value = getCellValue(entries, area, task.name, week);
    return getCompletionCount(value) >= (task.weeklyCompletions ?? 1);
  }).length;

  return (
    <section className="overflow-hidden rounded-xl border border-[#eadfe0] bg-white shadow-[0_2px_8px_rgba(73,40,45,0.04)]">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {completedTasks} of {visibleTasks.length} complete
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3f3] py-1 pl-1 pr-2.5 text-[11px] text-slate-600">
          <span className="flex size-5 items-center justify-center rounded-full bg-[#f6e1e4] text-[10px] font-semibold text-[#ad6878]">
            {getAssignedPerson(week, areaIndex).charAt(0)}
          </span>
          {getAssignedPerson(week, areaIndex)}
        </span>
      </header>

      <ul className="divide-y divide-slate-100 px-3">
        {visibleTasks.map((task) => {
          const value = getCellValue(entries, area, task.name, week);

          return (
            <TaskRow
              key={`${week}:${task.name}:${value}`}
              task={task}
              area={area}
              week={week}
              value={value}
              saveCell={saveCell}
              markDoneToday={markDoneToday}
            />
          );
        })}
      </ul>
    </section>
  );
}
