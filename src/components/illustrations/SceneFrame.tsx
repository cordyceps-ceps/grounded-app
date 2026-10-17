interface SceneFrameProps {
  children: React.ReactNode;
  ratio?: string;
  className?: string;
}

/** Rounded wrapper that frames a Scene* illustration (scenes fill via slice). */
export function SceneFrame({ children, ratio = "320 / 220", className = "" }: SceneFrameProps) {
  return (
    <div
      className={`rounded-[28px] overflow-hidden shadow-[var(--g-shadow-sm)] ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {children}
    </div>
  );
}
