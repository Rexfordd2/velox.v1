import Link from 'next/link';

export default function ChallengesPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Challenges</h1>
        <Link className="text-blue-600 hover:underline" href="/challenges/create">
          Create
        </Link>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Browse and take on challenges. BYLS (Beat Your Last) and curated packs coming soon.
      </p>
    </div>
  );
}


