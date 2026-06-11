"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, Users, MessageSquare, Send, TrendingUp } from "lucide-react";
import { TopBar, Kicker, IconBtn, Avatar } from "@/components/ui";
import { useTheme } from "@/components/ThemeProvider";
import { useUser } from "@/components/UserProvider";

function DarkToggle() {
  const { isDark, setMode, mode } = useTheme();
  return (
    <IconBtn
      icon={isDark ? Sun : Moon}
      label="Toggle night mode"
      onClick={() => {
        if (mode === "auto") setMode(isDark ? "light" : "night");
        else if (mode === "night") setMode("light");
        else setMode("night");
      }}
    />
  );
}

interface DayCount {
  day: string;
  count: number;
}

interface TopUser {
  display_name: string;
  convo_count: number;
  question_count: number;
}

interface Stats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  dailyConversations: DayCount[];
  dailyActiveUsers: DayCount[];
  dailySignups: DayCount[];
  topUsers: TopUser[];
}

// Fill missing days in a 30-day range so chart has no gaps
function fillDays(data: DayCount[], days: string[]): number[] {
  const map = new Map(data.map((d) => [d.day, d.count]));
  return days.map((d) => map.get(d) || 0);
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function Chart({
  days,
  bars,
  line,
  barLabel,
  lineLabel,
}: {
  days: string[];
  bars: number[];
  line: number[];
  barLabel: string;
  lineLabel: string;
}) {
  const maxBar = Math.max(...bars, 1);
  const maxLine = Math.max(...line, 1);
  const w = 600;
  const h = 200;
  const pad = { top: 20, right: 16, bottom: 32, left: 32 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const barW = plotW / days.length;

  const linePoints = line
    .map((v, i) => {
      const x = pad.left + i * barW + barW / 2;
      const y = pad.top + plotH - (v / maxLine) * plotH;
      return `${x},${y}`;
    })
    .join(" ");

  // X-axis labels: show every ~5 days
  const xLabels = days
    .map((d, i) => ({ d, i }))
    .filter((_, i) => i % 5 === 0 || i === days.length - 1);

  return (
    <div className="bg-g-panel rounded-[16px] p-4 shadow-[var(--g-shadow-sm)] overflow-hidden">
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-[6px]">
          <span className="w-[10px] h-[10px] rounded-[2px]" style={{ background: "var(--g-prim)", opacity: 0.5 }} />
          <span className="font-body text-[11px] text-g-sub">{barLabel}</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <span className="w-[10px] h-[2px] rounded" style={{ background: "var(--g-prim)" }} />
          <span className="font-body text-[11px] text-g-sub">{lineLabel}</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 200 }}>
        {/* Y-axis labels */}
        {[0, 0.5, 1].map((frac) => {
          const y = pad.top + plotH * (1 - frac);
          const val = Math.round(maxBar * frac);
          return (
            <g key={frac}>
              <line
                x1={pad.left}
                x2={w - pad.right}
                y1={y}
                y2={y}
                stroke="var(--g-line)"
                strokeWidth={0.5}
              />
              <text
                x={pad.left - 6}
                y={y + 3}
                textAnchor="end"
                fill="var(--g-faint)"
                fontSize={9}
                fontFamily="var(--font-body)"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {bars.map((v, i) => {
          const barH = (v / maxBar) * plotH;
          const x = pad.left + i * barW + barW * 0.15;
          const y = pad.top + plotH - barH;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW * 0.7}
              height={barH}
              rx={2}
              fill="var(--g-prim)"
              opacity={0.4}
            />
          );
        })}

        {/* Line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="var(--g-prim)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Line dots */}
        {line.map((v, i) => {
          if (v === 0) return null;
          const x = pad.left + i * barW + barW / 2;
          const y = pad.top + plotH - (v / maxLine) * plotH;
          return (
            <circle key={i} cx={x} cy={y} r={3} fill="var(--g-prim)" />
          );
        })}

        {/* X-axis labels */}
        {xLabels.map(({ d, i }) => (
          <text
            key={d}
            x={pad.left + i * barW + barW / 2}
            y={h - 6}
            textAnchor="middle"
            fill="var(--g-faint)"
            fontSize={9}
            fontFamily="var(--font-body)"
          >
            {d.slice(5).replace("-", "/")}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { familyId } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    router.prefetch("/home");
  }, [router]);

  useEffect(() => {
    if (familyId && familyId !== "9972834c-8965-45f1-8a82-8b36a0f67e5d") {
      startTransition(() => router.replace("/home"));
      return;
    }
    fetch("/api/admin/stats")
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(JSON.stringify(body));
        }
        return r.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message));
  }, [familyId, router, startTransition]);

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-g-bg flex items-center justify-center">
        <div className="font-body text-[13px] text-g-sub max-w-[300px] text-center break-all">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-[100dvh] bg-g-bg flex items-center justify-center">
        <span className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="g-dot" style={{ background: "var(--g-prim)", animationDelay: `${i * 0.16}s` }} />
          ))}
        </span>
      </div>
    );
  }

  const days = getLast30Days();
  const convosBars = fillDays(stats.dailyConversations, days);
  const activeLine = fillDays(stats.dailyActiveUsers, days);
  const signupsBars = fillDays(stats.dailySignups, days);

  const totalSignups30d = signupsBars.reduce((a, b) => a + b, 0);
  const totalConvos30d = convosBars.reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col">
      <TopBar
        onBack={() => startTransition(() => router.push("/home"))}
        right={
          <div className="flex gap-[9px] items-center">
            <DarkToggle />
            <Avatar />
          </div>
        }
      />

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "6px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
      >
        <div className="g-up font-display text-[36px] leading-[1.02] text-g-ink mb-6">
          Dashboard
        </div>

        {/* Headline stats */}
        <div className="grid grid-cols-3 gap-[10px] mb-6">
          <StatCard icon={Users} label="Users" value={stats.totalUsers} />
          <StatCard icon={MessageSquare} label="Conversations" value={stats.totalConversations} />
          <StatCard icon={Send} label="Questions" subLabel="30d" value={stats.totalMessages} />
        </div>

        {/* Activity chart */}
        <Kicker className="mb-3">Activity — last 30 days</Kicker>
        <div className="mb-6">
          <Chart
            days={days}
            bars={convosBars}
            line={activeLine}
            barLabel="Conversations"
            lineLabel="Active users"
          />
        </div>

        {/* 30-day summary */}
        <div className="grid grid-cols-2 gap-[10px] mb-6">
          <div className="bg-g-panel rounded-[14px] p-[14px] shadow-[var(--g-shadow-sm)]">
            <div className="font-body text-[11px] text-g-faint uppercase tracking-[0.5px]">New signups (30d)</div>
            <div className="font-display text-[28px] text-g-ink mt-1">{totalSignups30d}</div>
          </div>
          <div className="bg-g-panel rounded-[14px] p-[14px] shadow-[var(--g-shadow-sm)]">
            <div className="font-body text-[11px] text-g-faint uppercase tracking-[0.5px]">Conversations (30d)</div>
            <div className="font-display text-[28px] text-g-ink mt-1">{totalConvos30d}</div>
          </div>
        </div>

        {/* Top users */}
        {stats.topUsers.length > 0 && (
          <>
            <Kicker className="mb-3">Top users</Kicker>
            <div className="bg-g-panel rounded-[16px] shadow-[var(--g-shadow-sm)] overflow-hidden mb-6">
              {stats.topUsers.map((u, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 py-[13px] px-4 ${
                    i < stats.topUsers.length - 1 ? "border-b border-g-line" : ""
                  }`}
                >
                  <span
                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center font-body text-[12px] font-bold shrink-0"
                    style={{
                      background: i === 0 ? "var(--g-prim)" : "var(--g-prim-soft)",
                      color: i === 0 ? "var(--g-on-prim)" : "var(--g-prim)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 font-body text-[14.5px] text-g-ink font-semibold">
                    {u.display_name}
                  </span>
                  <span className="font-body text-[13px] text-g-faint text-right">
                    {u.convo_count} {u.convo_count === 1 ? "convo" : "convos"}
                    {u.question_count > 0 && (
                      <span className="text-g-prim ml-1">· {u.question_count} Qs</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Signups chart */}
        {totalSignups30d > 0 && (
          <>
            <Kicker className="mb-3">Signups — last 30 days</Kicker>
            <div className="mb-6">
              <Chart
                days={days}
                bars={signupsBars}
                line={signupsBars}
                barLabel="New users"
                lineLabel="Cumulative"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subLabel,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number;
  subLabel?: string;
}) {
  return (
    <div className="bg-g-panel rounded-[14px] p-[14px] shadow-[var(--g-shadow-sm)] flex flex-col items-center text-center">
      <span className="w-[32px] h-[32px] rounded-full bg-g-prim-soft text-g-prim flex items-center justify-center mb-[8px]">
        <Icon size={16} />
      </span>
      <div className="font-display text-[26px] text-g-ink leading-[1]">{value}</div>
      <div className="font-body text-[11px] text-g-faint mt-[4px]">
        {label}
        {subLabel && <span className="text-g-prim ml-[3px]">{subLabel}</span>}
      </div>
    </div>
  );
}
