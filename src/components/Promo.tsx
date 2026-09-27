/* eslint-disable @next/next/no-img-element */
import Icon from "./Icon";

export function PromoCard({ title, description, image, until, price, badge = "Nowość", width }: { title: string; description?: string | null; image?: string; until?: string; price?: string | null; badge?: string; width?: number }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white" style={{ width: width ?? "100%", flex: width ? "none" : undefined }}>
      <div className="relative">
        {image ? <img src={image} alt="" className="aspect-[3/2] w-full object-cover" /> : <div className="grid aspect-[3/2] w-full place-items-center bg-sand"><Icon name="coffee" size={28} stroke="var(--ink-2)" /></div>}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-gold px-2.5 py-1 text-[13px] font-semibold leading-[1.25] text-ink">{badge}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="line-clamp-2 text-[17px] font-semibold leading-[1.3]">{title}</p>
        {description && <p className="text-[14px] leading-[1.45] text-ink-2">{description}</p>}
        {(until || price) && (
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <span className="min-w-0 text-[13px] leading-[1.35] text-ink-2">{until ?? ""}</span>
            {price && <span className="flex-none text-[15px] font-semibold leading-[1.3] text-gold-ink tabular-nums">{price}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export function PromoRow({ title, children, count }: { title: string; children: React.ReactNode[]; count: number }) {
  if (!count) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[20px] font-semibold leading-[1.3]">{title}</h2>
      {count === 1 ? children[0] : <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">{children.map((c, i) => <div key={i} className="flex-none snap-start">{c}</div>)}</div>}
    </section>
  );
}

export function ComboCard({ title, contents, oldPrice, newPrice, window, image, href }: { title: string; contents?: string; oldPrice?: string; newPrice: string; window?: string; image?: string; href?: string }) {
  const body = (
    <>
      <div className="relative">
        {image ? <img src={image} alt="" className="aspect-[3/2] w-full object-cover" /> : <div className="grid aspect-[3/2] w-full place-items-center bg-sand"><Icon name="coffee" size={28} stroke="var(--ink-2)" /></div>}
        {window && <span className="absolute bottom-2.5 left-2.5 rounded-full bg-dark px-2.5 py-1 text-[13px] font-semibold leading-[1.25] text-cream">{window}</span>}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <p className="text-[17px] font-semibold leading-[1.3]">{title}</p>
        {contents && <p className="text-[14px] leading-[1.45] text-ink-2">{contents}</p>}
        <div className="mt-1.5 flex items-baseline gap-2">
          {oldPrice && <span className="text-[14px] leading-[1.3] text-ink-2 line-through tabular-nums">{oldPrice}</span>}
          <span className="text-[22px] font-semibold leading-[1.2] text-gold-ink tabular-nums">{newPrice}</span>
        </div>
      </div>
    </>
  );
  const cls = "flex flex-col overflow-hidden rounded-2xl border border-line bg-white";
  return href ? <a href={href} className={cls}>{body}</a> : <div className={cls}>{body}</div>;
}
