import type { Entry, Task } from "../types";

type AreaSectionProps = {
  title: string;
  area: string;
  areaIndex: number;
  tasks: Task[];
  week: number;
  entries: Entry[];
  getCellValue: (
    entries: Entry[],
    area: string,
    task: string,
    week: number
  ) => string;
  getAssignedPerson: (week: number, areaIndex: number) => string;
  getDraftValue: (task: string) => string | undefined;
  onDraftChange: (task: string, value: string) => void;
  onSave: (
    area: string,
    task: string,
    week: number,
    value: string
  ) => Promise<void>;
  onMarkDone: (area: string, task: string, week: number) => Promise<void>;
  savingKeys: Set<string>;
  readOnly: boolean;
  isLoading: boolean;
  today: string;
};

function getTaskKey(area: string, task: string, week: number) {
  return `${area}:${task}:${week}`;
}

export default function AreaSection({
  title,
  area,
  areaIndex,
  tasks,
  week,
  entries,
  getCellValue,
  getAssignedPerson,
  getDraftValue,
  onDraftChange,
  onSave,
  onMarkDone,
  savingKeys,
  readOnly,
  isLoading,
  today,
}: AreaSectionProps) {
  const assignedPerson = getAssignedPerson(week, areaIndex);
  const completedCount = tasks.filter(
    (task) => getCellValue(entries, area, task.name, week).trim() !== ""
  ).length;

  return (
    <section
      aria-labelledby={`${area}-heading`}
      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
        <div>
          <h2
            id={`${area}-heading`}
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {completedCount} of {tasks.length} complete
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-50 py-1.5 pl-1.5 pr-3">
          <span           className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-900">
            {assignedPerson.slice(0, 1)}
          </span>
          <span className="text-xs font-medium text-slate-600">
            {assignedPerson}
          </span>
        </div>
      </header>

      <ul className="divide-y divide-slate-100 px-4 sm:px-6">
        {isLoading ? (
          <li className="py-5 text-sm text-slate-400">Loading chores...</li>
        ) : (
          tasks.map((task) => {
            const key = getTaskKey(area, task.name, week);
            const savedValue = getCellValue(entries, area, task.name, week);
            const value = getDraftValue(task.name) ?? savedValue;
            const isCompleted = value.trim() !== "";
            const isSaving = savingKeys.has(key);

            return (
              <li
                key={task.name}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                      isCompleted
                        ? "border-brand-600 bg-brand-600 font-semibold text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isCompleted ? "✓" : ""}
                  </span>
                  <span
                    className={`text-sm font-medium leading-6 ${
                      isCompleted
                        ? "text-slate-500 line-through decoration-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    {task.name}
                  </span>
                </div>

                <div className="flex w-full items-center gap-2 pl-8 sm:w-auto sm:shrink-0 sm:pl-0">
                  <label className="sr-only" htmlFor={`date-${key}`}>
                    Completion date for {task.name}
                  </label>
                  <input
                    id={`date-${key}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="dd.mm"
                    value={value}
                    disabled={readOnly || isLoading || isSaving}
                    onChange={(event) =>
                      onDraftChange(task.name, event.target.value)
                    }
                    onBlur={() => {
                      if (value !== savedValue) {
                        void onSave(area, task.name, week, value);
                      }
                    }}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-center text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 disabled:bg-slate-50 disabled:text-slate-400 sm:w-[5.5rem] sm:flex-none"
                  />
                  <button
                    type="button"
                    disabled={readOnly || isLoading || isSaving}
                    onClick={() =>
                      void onMarkDone(area, task.name, week)
                    }
                    className={`h-11 flex-1 rounded-xl px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none sm:px-4 ${
                      isCompleted && value === today
                        ? "bg-brand-50 text-brand-800 hover:bg-brand-100"
                        : "bg-brand-700 text-white hover:bg-brand-800"
                    }`}
                  >
                    {isSaving
                      ? "Saving..."
                      : isCompleted && value === today
                        ? "Done today"
                        : "Mark done"}
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
