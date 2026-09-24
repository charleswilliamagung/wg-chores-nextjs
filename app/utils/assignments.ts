const members = [
  "Jay",
  "Laras",
  "Charles",
];

export function getAssignedPerson(
  week: number,
  areaIndex: number
) {
  return members[
    (week - 1 + areaIndex) %
    members.length
  ];
}