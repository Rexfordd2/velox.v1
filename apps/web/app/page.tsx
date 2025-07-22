import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Welcome to Velox</h1>
      <nav className="space-y-4">
        <Link
          href="/profile"
          className="block p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          View Profile
        </Link>
        {/* Add more navigation links as needed */}
      </nav>
    </div>
  );
} 