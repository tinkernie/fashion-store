import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">Fashion Store Frontend Base</h1>
      <p className="text-muted-foreground text-sm">Minimalist, premium style initialization.</p>
      <Button>Explore Collection</Button>
    </main>
  );
}