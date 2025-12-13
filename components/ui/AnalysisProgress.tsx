'use client';

import { useEffect, useState } from 'react';

interface AnalysisProgressProps {
  enableAI: boolean;
}

interface Step {
  label: string;
  description: string;
  duration: number; // estimated ms
}

export function AnalysisProgress({ enableAI }: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const steps: Step[] = [
    { label: 'Connecting', description: 'Fetching repository data...', duration: 1500 },
    { label: 'Analyzing', description: 'Processing commit patterns...', duration: 2000 },
    { label: 'Collaboration', description: 'Calculating team metrics...', duration: 1000 },
    ...(enableAI
      ? [
          { label: 'AI Analysis', description: 'Semantic commit analysis...', duration: 4000 },
          { label: 'Insights', description: 'Generating recommendations...', duration: 2000 },
        ]
      : []),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let accumulated = 0;
    for (let i = 0; i < steps.length; i++) {
      accumulated += steps[i].duration;
      if (elapsed < accumulated) {
        setCurrentStep(i);
        return;
      }
    }
    setCurrentStep(steps.length - 1);
  }, [elapsed, steps.length]);

  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);
  const progressPercent = Math.min((elapsed / totalDuration) * 100, 95);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${
              index === currentStep
                ? 'opacity-100'
                : index < currentStep
                ? 'opacity-50'
                : 'opacity-30'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {index < currentStep ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : index === currentStep ? (
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <div>
              <span className="font-medium">{step.label}</span>
              {index === currentStep && (
                <span className="text-gray-500 ml-2">{step.description}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
