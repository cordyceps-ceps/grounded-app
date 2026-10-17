import { notFound } from "next/navigation";
import { FixtureProvider } from "./FixtureProvider";

export default function FixturesLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return <FixtureProvider>{children}</FixtureProvider>;
}
