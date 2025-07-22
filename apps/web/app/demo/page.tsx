'use client';

import { DemoController } from '../../components/demo/DemoController';
import { DemoScenarioView } from '../../components/demo/DemoScenarioView';

export default function DemoPage() {
  return (
    <DemoController>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Velox AI Demo
            </h1>
            <p className="text-xl text-gray-400 mt-4">
              Experience the future of fitness training
            </p>
          </div>

          {/* Demo Content */}
          <DemoScenarioView />
        </div>
      </div>
    </DemoController>
  );
} 