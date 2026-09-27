/* eslint-disable @next/next/no-img-element */
export default function StampGrid({ stamps, dark = false, size = 54 }: { stamps: number; dark?: boolean; size?: number }) {
  const cells = Array.from({ length: 9 }, (_, i) => i + 1);
  return (
    <div className="grid w-full justify-between" style={{ gridTemplateColumns: `repeat(5, ${size}px)`, columnGap: 12, rowGap: 20 }}>
      {cells.map((n) => {
        const filled = n <= stamps;
        const ring = n === 3 || n === 6;
        return (
          <div
            key={n}
            className="flex items-center justify-center rounded-full"
            style={{
              width: size,
              height: size,
              background: filled ? "transparent" : dark ? "rgba(250,242,231,.22)" : "var(--slot)",
              boxShadow: ring ? "0 0 0 4px transparent, 0 0 0 5.5px var(--gold)" : undefined,
            }}
          >
            {filled ? (
              <img src="/img/brand/bean.png" alt="" width={Math.round(size * 0.8)} height={Math.round(size * 0.8)} className={n === stamps ? "anim-pop" : ""} />
            ) : (
              <span style={{ font: `600 ${Math.max(13, Math.round(size * 0.31))}px/1 var(--font-inter)`, color: dark ? "var(--cream)" : "var(--slot-ink)", fontVariantNumeric: "lining-nums tabular-nums" }}>
                {n}
              </span>
            )}
          </div>
        );
      })}
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <img src="/img/brand/cup.png" alt="Kawa gratis" width={Math.round(size * 1.14)} height={Math.round(size * 1.14)} className="max-w-none" />
      </div>
    </div>
  );
}
