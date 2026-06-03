export default function AppLoading() {
  return (
    <div className="min-h-[100dvh] bg-g-bg flex items-center justify-center">
      <span className="flex gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="g-dot"
            style={{ background: "var(--g-prim)", animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </span>
    </div>
  );
}
