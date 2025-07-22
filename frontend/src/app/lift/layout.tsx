import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lift to the Beat | Velox",
  description: "Exercise to the rhythm of your favorite music with AI form tracking"
};

export default function LiftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 