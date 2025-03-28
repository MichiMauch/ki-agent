"use client";

export default function Kalenderwoche() {
  function getCalendarWeek(date = new Date()): number {
    const thursday = new Date(date);
    thursday.setDate(date.getDate() + (3 - ((date.getDay() + 6) % 7))); // auf Donnerstag der Woche gehen

    const firstThursday = new Date(thursday.getFullYear(), 0, 4);
    firstThursday.setDate(
      firstThursday.getDate() + (3 - ((firstThursday.getDay() + 6) % 7))
    );

    const weekNumber =
      Math.round(
        (thursday.getTime() - firstThursday.getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      ) + 1;

    return weekNumber;
  }

  return <>KW{getCalendarWeek()}</>;
}
