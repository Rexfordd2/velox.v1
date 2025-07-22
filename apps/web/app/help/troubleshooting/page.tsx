import Link from 'next/link'
import Image from 'next/image'

export default function TroubleshootingPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/help" className="text-blue-600 hover:underline">← Back to Help Center</Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Troubleshooting Guide</h1>

      <div className="space-y-12">
        {/* Camera Issues */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Camera Issues</h2>
          
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Camera Not Detected</h3>
              <div className="space-y-4">
                <p className="text-gray-600">If your camera isn't being detected, try these steps:</p>
                <ol className="list-decimal ml-6 space-y-2">
                  <li>Check browser camera permissions</li>
                  <li>Ensure no other apps are using the camera</li>
                  <li>Restart your browser</li>
                  <li>Try a different browser</li>
                </ol>
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Pro Tip:</strong> On most browsers, you can check camera permissions by clicking the lock icon in the address bar.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Poor Camera Quality</h3>
              <div className="space-y-4">
                <p className="text-gray-600">To improve camera quality:</p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Clean your camera lens</li>
                  <li>Ensure good lighting (natural light works best)</li>
                  <li>Position camera 6-8 feet away</li>
                  <li>Use a camera stand or stable surface</li>
                </ul>
                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> The AI requires a clear, stable video feed for accurate form detection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Detection Issues */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">AI Form Detection Issues</h2>
          
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Inaccurate Form Detection</h3>
              <div className="space-y-4">
                <p className="text-gray-600">If the AI isn't accurately detecting your form:</p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Wear form-fitting, high-contrast clothing</li>
                  <li>Ensure your full body is visible</li>
                  <li>Remove background distractions</li>
                  <li>Maintain proper lighting</li>
                </ul>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-green-50 p-4 rounded">
                    <h4 className="font-medium text-green-800 mb-2">Good Setup</h4>
                    <ul className="text-sm text-green-700 list-disc ml-4">
                      <li>Clear background</li>
                      <li>Good lighting</li>
                      <li>Full body visible</li>
                      <li>Stable camera</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded">
                    <h4 className="font-medium text-red-800 mb-2">Poor Setup</h4>
                    <ul className="text-sm text-red-700 list-disc ml-4">
                      <li>Cluttered background</li>
                      <li>Poor lighting</li>
                      <li>Partial body view</li>
                      <li>Shaky camera</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Movement Not Recognized</h3>
              <div className="space-y-4">
                <p className="text-gray-600">If specific movements aren't being recognized:</p>
                <ol className="list-decimal ml-6 space-y-2">
                  <li>Review the exercise form guide</li>
                  <li>Perform movements at a moderate pace</li>
                  <li>Ensure proper starting position</li>
                  <li>Check camera angle matches exercise requirements</li>
                </ol>
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Pro Tip:</strong> Watch our <Link href="/help/tutorials/form" className="underline">form guide videos</Link> for each exercise to ensure proper positioning.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Issues */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Performance Issues</h2>
          
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">App Running Slowly</h3>
              <div className="space-y-4">
                <p className="text-gray-600">To improve app performance:</p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Close other browser tabs and applications</li>
                  <li>Clear browser cache and cookies</li>
                  <li>Check internet connection speed</li>
                  <li>Use a supported browser (Chrome, Firefox, Safari)</li>
                </ul>
                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Minimum Requirements:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>• 4GB RAM</li>
                      <li>• Modern browser (last 2 versions)</li>
                      <li>• 5Mbps internet connection</li>
                      <li>• Webcam with 720p resolution</li>
                    </ul>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Still Need Help */}
        <section>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Still Need Help?</h2>
            <p className="text-gray-600 mb-4">
              Contact our support team for personalized assistance.
            </p>
            <Link 
              href="mailto:support@velox.fit"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
} 