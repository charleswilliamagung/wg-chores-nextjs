export function getWeekLabels() {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstMonday = new Date(firstDay);

  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(firstMonday.getDate() - 1);
  }

  const labels: string[] = [];

  let start = new Date(firstMonday);

  while (start <= lastDay || start.getMonth() === month) {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const startText = start.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    });

    const endText = end.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    });

    labels.push(`${startText} - ${endText}`);

    start = new Date(start);
    start.setDate(start.getDate() + 7);

    if (start > lastDay && start.getMonth() !== month) {
      break;
    }
  }

  return labels;
}

export function getWeeks() {
  const labels = getWeekLabels();

  return labels.map(
    (_, index) => index + 1
  );
}

export function getCurrentWeekIndex() {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);

  const firstMonday = new Date(firstDay);

  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(
      firstMonday.getDate() - 1
    );
  }

  const diffDays = Math.floor(
    (today.getTime() -
      firstMonday.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return Math.floor(diffDays / 7);
}