import { Entry } from "../app/types";

export function getCellValue(
  entries: Entry[],
  area: string,
  task: string,
  week: number
) {
  const entry = entries.find(
    (e) =>
      e.area === area &&
      e.task === task &&
      e.week === week
  );

  return entry?.value || "";
}