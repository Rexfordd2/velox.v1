import Link from 'next/link'

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/help" className="text-blue-600 hover:underline">← Back to Help Center</Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>

      <div className="space-y-8">
        {/* Getting Started */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">What equipment do I need?</h3>
              <p className="text-gray-600">
                To use Velox, you need:
                <ul className="list-disc ml-6 mt-2">
                  <li>A smartphone, tablet, or computer with a camera</li>
                  <li>Stable internet connection</li>
                  <li>Well-lit workout space</li>
                  <li>Exercise equipment specific to your chosen workout</li>
                </ul>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">How accurate is the AI form detection?</h3>
              <p className="text-gray-600">
                Our AI form detection is highly accurate when used correctly. For best results:
                <ul className="list-disc ml-6 mt-2">
                  <li>Ensure good lighting</li>
                  <li>Position your camera to capture your full body</li>
                  <li>Wear form-fitting clothing</li>
                  <li>Keep the camera stable during workouts</li>
                </ul>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Can I use Velox offline?</h3>
              <p className="text-gray-600">
                Currently, Velox requires an internet connection for real-time form analysis. However, you can download your workout plans for reference when offline.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Issues */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Technical Issues</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Why isn't the camera detecting my movements?</h3>
              <p className="text-gray-600">
                Common reasons for detection issues:
                <ul className="list-disc ml-6 mt-2">
                  <li>Poor lighting conditions</li>
                  <li>Camera not positioned correctly</li>
                  <li>Loose or baggy clothing</li>
                  <li>Objects blocking the camera view</li>
                </ul>
                Check our <Link href="/help/camera-setup" className="text-blue-600 hover:underline">camera setup guide</Link> for detailed instructions.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">The app is running slowly. What can I do?</h3>
              <p className="text-gray-600">
                Try these steps:
                <ul className="list-disc ml-6 mt-2">
                  <li>Clear your browser cache</li>
                  <li>Close other resource-intensive applications</li>
                  <li>Check your internet connection speed</li>
                  <li>Update your browser to the latest version</li>
                </ul>
              </p>
            </div>
          </div>
        </section>

        {/* Workout Related */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Workout Related</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">How do I track my progress?</h3>
              <p className="text-gray-600">
                Velox offers multiple ways to track your progress:
                <ul className="list-disc ml-6 mt-2">
                  <li>Performance metrics dashboard</li>
                  <li>Form improvement tracking</li>
                  <li>Personal records history</li>
                  <li>Weekly and monthly progress reports</li>
                </ul>
                Visit your <Link href="/profile" className="text-blue-600 hover:underline">profile page</Link> to view detailed statistics.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Can I customize my workout plans?</h3>
              <p className="text-gray-600">
                Yes! You can customize your workouts by:
                <ul className="list-disc ml-6 mt-2">
                  <li>Selecting specific exercises</li>
                  <li>Adjusting sets and repetitions</li>
                  <li>Setting your own goals</li>
                  <li>Creating custom workout templates</li>
                </ul>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
} 