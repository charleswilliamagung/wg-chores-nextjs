export type Task = {
  name: string;
  week3Only: boolean;
  weeklyCompletions?: number;
  allowMultipleCompletions?: boolean;
};

export type Entry = {
  area: string;
  task: string;
  week: number;
  month: string;
  value: string;
};