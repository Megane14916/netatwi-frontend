export function ContestTitle({ name, spaced = false }: { name: string; spaced?: boolean }) {
  const keyword = "ネタツイグランプリ";

  if (!name.includes(keyword)) {
    return <>{name}</>;
  }

  const [before, after] = name.split(keyword);

  return (
    <>
      {before && <span className={`block ${spaced ? "mb-1" : ""}`}>{before}</span>}
      <span className="block">{keyword}</span>
      {after && <span className={`block ${spaced ? "mt-1" : ""}`}>{after}</span>}
    </>
  );
}
