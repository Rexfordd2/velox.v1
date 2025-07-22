import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed | Velox"
};

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 