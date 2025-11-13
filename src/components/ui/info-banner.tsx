"use client";

type InfoBannerProps = {
  title: string;
  body: string;
  items?: string[];
};

export function InfoBanner({ title, body, items }: InfoBannerProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-white/15 bg-white/5 p-5 text-sm text-white/80 backdrop-blur">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 select-none text-lg">ℹ️</span>
        <div className="space-y-2">
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-white/70">{body}</p>
          </div>
          {items && items.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-white/70">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
