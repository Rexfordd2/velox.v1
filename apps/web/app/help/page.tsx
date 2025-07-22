import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Help Center</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <ul className="space-y-3">
            <li>
              <Link href="/help/getting-started" className="text-blue-600 hover:underline">
                Getting Started Guide
              </Link>
            </li>
            <li>
              <Link href="/help/faq" className="text-blue-600 hover:underline">
                Frequently Asked Questions
              </Link>
            </li>
            <li>
              <Link href="/help/troubleshooting" className="text-blue-600 hover:underline">
                Troubleshooting Guide
              </Link>
            </li>
            <li>
              <Link href="/help/first-workout" className="text-blue-600 hover:underline">
                Your First Workout
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
          <p className="mb-4">Need help? Our support team is here for you.</p>
          <div className="space-y-3">
            <div>
              <h3 className="font-medium">Email Support</h3>
              <p className="text-gray-600">support@velox.fit</p>
            </div>
            <div>
              <h3 className="font-medium">Response Time</h3>
              <p className="text-gray-600">Within 24 hours</p>
            </div>
            <div>
              <h3 className="font-medium">Business Hours</h3>
              <p className="text-gray-600">Monday - Friday, 9AM - 6PM EST</p>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Common Issues</h2>
          <ul className="space-y-3">
            <li>
              <Link href="/help/camera-setup" className="text-blue-600 hover:underline">
                Camera Setup Guide
              </Link>
            </li>
            <li>
              <Link href="/help/ai-accuracy" className="text-blue-600 hover:underline">
                AI Form Detection Tips
              </Link>
            </li>
            <li>
              <Link href="/help/connectivity" className="text-blue-600 hover:underline">
                Connectivity Issues
              </Link>
            </li>
          </ul>
        </div>

        {/* Video Tutorials */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Video Tutorials</h2>
          <ul className="space-y-3">
            <li>
              <Link href="/help/tutorials/setup" className="text-blue-600 hover:underline">
                Initial Setup Guide
              </Link>
            </li>
            <li>
              <Link href="/help/tutorials/workout" className="text-blue-600 hover:underline">
                Recording Your First Workout
              </Link>
            </li>
            <li>
              <Link href="/help/tutorials/form" className="text-blue-600 hover:underline">
                Perfect Form Guide
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
} 