import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Calendar, CheckSquare, Users, Mail } from 'lucide-react';

export const Demo: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Smart Event Management',
      description: 'Organize school events, appointments, and family activities in one beautiful interface.',
      demo: 'View calendar sync demo'
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Parsing Magic',
      description: 'Automatically extract events from school emails and appointment confirmations.',
      demo: 'See email parsing in action'
    },
    {
      icon: <CheckSquare className="w-6 h-6" />,
      title: 'Task Preparation',
      description: 'Never forget to pack soccer gear or prepare for parent-teacher conferences.',
      demo: 'Explore task management'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Family Coordination',
      description: 'Share responsibilities and keep everyone in the family organized and informed.',
      demo: 'Try family features'
    }
  ];

  return (
    <div className="min-h-screen bg-earth-50">
      {/* Header */}
      <div className="bg-warm-50 border-b border-earth-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-earth-100 rounded-xl transition-all duration-200 text-earth-600 mr-3"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-semibold text-earth-800">ParentPal Demo</h1>
          </div>
          <button
            onClick={() => navigate('/auth?mode=signup')}
            className="zen-button"
          >
            Get Started
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-sage-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Play className="w-10 h-10 text-sage-700" />
          </div>
          <h2 className="text-3xl font-semibold text-earth-800 mb-4">
            See ParentPal in Action
          </h2>
          <p className="text-xl text-earth-600 leading-relaxed max-w-2xl mx-auto">
            Discover how ParentPal transforms family organization with smart automation, 
            beautiful design, and intuitive workflows.
          </p>
        </div>

        {/* Demo Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="zen-card p-8 hover:shadow-warm transition-all duration-200">
              <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center mb-6 text-sage-700">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-earth-800 mb-3 text-xl">{feature.title}</h3>
              <p className="text-earth-600 leading-relaxed mb-6">{feature.description}</p>
              <button className="text-sage-700 hover:text-sage-800 font-medium transition-colors duration-200 flex items-center space-x-2">
                <Play className="w-4 h-4" />
                <span>{feature.demo}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Interactive Demo Preview */}
        <div className="zen-card p-8 text-center">
          <h3 className="text-2xl font-semibold text-earth-800 mb-4">
            Ready to Experience ParentPal?
          </h3>
          <p className="text-earth-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            Join thousands of families who have transformed their organization with ParentPal. 
            Start your free account and see the difference in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="zen-button px-8 py-4 text-lg"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate('/auth?mode=signin')}
              className="px-8 py-4 border border-earth-300 text-earth-700 rounded-xl hover:bg-earth-50 transition-all duration-200 font-medium text-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};