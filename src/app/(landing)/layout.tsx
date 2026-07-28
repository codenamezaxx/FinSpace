import LandingNav from "@/components/landing/LandingNav";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LandingNav />
      {children}
    </>
  );
}
