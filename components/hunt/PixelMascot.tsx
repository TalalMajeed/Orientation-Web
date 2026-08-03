// A small chibi pixel-art mascot, one per house, styled after the
// big-head/short-body RPG overworld sprites (à la SkyOffice) — an original
// bitmap, not a copy of any third-party character art.
// 0 = empty, 1 = outfit (house color), 2 = skin, 3 = hair/cap, 4 = eye.
const SPRITE: number[][] = [
  [0, 0, 3, 3, 3, 3, 0, 0],
  [0, 3, 3, 3, 3, 3, 3, 0],
  [0, 3, 2, 2, 2, 2, 3, 0],
  [0, 2, 2, 2, 2, 2, 2, 0],
  [0, 2, 4, 2, 2, 4, 2, 0],
  [0, 2, 2, 2, 2, 2, 2, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [0, 1, 1, 0, 0, 1, 1, 0],
];

const COLS = 8;
const SKIN = "#F0C39B";
const HAIR = "#2B2320";
const EYE = "#1A1310";

export default function PixelMascot({
  color,
  size = 32,
}: {
  color: string;
  size?: number;
}) {
  const cell = size / COLS;
  const tone = { 1: color, 2: SKIN, 3: HAIR, 4: EYE } as const;

  return (
    <div
      aria-hidden
      className="shrink-0"
      style={{
        width: size,
        height: cell * SPRITE.length,
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, ${cell}px)`,
        gridTemplateRows: `repeat(${SPRITE.length}, ${cell}px)`,
        imageRendering: "pixelated",
      }}
    >
      {SPRITE.flat().map((v, i) => (
        <div key={i} style={{ background: v === 0 ? "transparent" : tone[v as 1 | 2 | 3 | 4] }} />
      ))}
    </div>
  );
}
