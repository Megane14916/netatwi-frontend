import { getContestTitleParts } from "../model/contestPresentation";

export function ContestTitle({ name, spaced = false }: { name: string; spaced?: boolean }) {
  return (
    <>
      {getContestTitleParts(name).map((part, index, parts) => (
        <span
          key={`${part}-${index}`}
          className={`block ${spaced && index > 0 ? "mt-1" : ""} ${spaced && index < parts.length - 1 ? "mb-1" : ""}`}
        >
          {part}
        </span>
      ))}
    </>
  );
}
