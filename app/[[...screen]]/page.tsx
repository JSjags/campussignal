import CampusScreen from "@/components/campus-app";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ screen?: string[] }>;
}) {
  const { screen = [] } = await params;
  const [page, record] = screen;
  if (
    screen.length > 2 ||
    ![
      "",
      "login",
      "home",
      "coach",
      "map",
      "phone-a-friend",
      "help",
      "outline",
      "task",
      "stamps",
      "profile",
      "onboarding",
    ].includes(page ?? "") ||
    (["help", "task"].includes(page) && !record) ||
    (!["help", "task"].includes(page) && record)
  )
    notFound();
  // Only the screen content lives here; the shell is in the root layout.
  return <CampusScreen />;
}
