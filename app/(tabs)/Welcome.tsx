import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    console.log('Get Started clicked - navigating to signup');
    navigate('/auth?mode=signup');
  };

  const handleSeeDemo = () => {
    console.log('See Demo clicked - navigating to demo');
    navigate('/demo');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Mobile-first minimal design */}
      <div className="w-full max-w-sm mx-auto text-center space-y-8">
        
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl text-gray-600 font-normal">
            Welcome to
          </h1>
          <h2 className="text-4xl font-bold text-green-600">
            ParentPal
          </h2>
        </div>

        {/* Subtitle */}
        <div className="space-y-1">
          <p className="text-gray-800 text-lg font-medium">
            Your journey to easier parenting starts now.
          </p>
          <p className="text-gray-800 text-lg font-medium">
            Never miss your children activity!
          </p>
        </div>

        {/* Family Illustration */}
        <div className="relative">
          {/* Main illustration container */}
          <div className="bg-yellow-100 rounded-3xl p-8 shadow-lg">
            <div className="aspect-square w-full flex items-center justify-center">
              <img 
                src="/family-welcomepage.png" 
                alt="Happy family illustration - parents and children walking together, representing family organization and togetherness"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to SVG if PNG fails to load
                  e.currentTarget.src = '/family-illustration.svg';
                }}
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleSeeDemo}
            className="w-full py-4 px-8 border-2 border-gray-800 text-gray-800 rounded-2xl font-medium text-lg hover:bg-gray-50 transition-all duration-200"
          >
            See demo
          </button>
          <button
            onClick={handleGetStarted}
            className="w-full py-4 px-8 bg-green-600 text-white rounded-2xl font-medium text-lg hover:bg-green-700 transition-all duration-200"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};