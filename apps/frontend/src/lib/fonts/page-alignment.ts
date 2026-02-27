const CENTER_ALIGNED_PAGES = [1, 2];

const CENTER_ALIGNED_PAGE_LINES: Record<number, number[]> = {
  255: [2],
  528: [9],
  534: [6],
  545: [6],
  586: [1],
  593: [2],
  594: [5],
  600: [10],
  602: [5, 15],
  603: [10, 15],
  604: [4, 9, 14, 15],
};

export function isCenterAlignedLine(pageNumber: number, lineNumber: number): boolean {
  const centerAlignedLines = CENTER_ALIGNED_PAGE_LINES[pageNumber] ?? [];
  return CENTER_ALIGNED_PAGES.includes(pageNumber) || centerAlignedLines.includes(lineNumber);
}

