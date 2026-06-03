import { UserProvider } from "@/components/UserProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
