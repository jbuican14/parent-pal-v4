import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronRight, Users, Plus, Check } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<{ onNext: () => void; onSkip?: () => void }>;
}

const FamilySetup: React.FC<{ onNext: () => void; onSkip?: () => void }> = ({ onNext, onSkip }) => {
  const [familyName, setFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      if (mode === 'create') {
        // Create new family
        const { data: family, error: familyError } = await supabase
          .from('families')
          .insert({
            name: familyName,
            created_by: user.id,
          })
          .select()
          .single();

        if (familyError) {
          throw familyError;
        }

        // Update user with family_id
        const { error: userError } = await supabase
          .from('users')
          .update({ family_id: family.id })
          .eq('id', user.id);

        if (userError) {
          throw userError;
        }

        // Update local user state
        const updatedUser = { ...user, family_id: family.id };
        localStorage.setItem('parentpal_user', JSON.stringify(updatedUser));
        
      } else {
        // Join existing family logic (simplified for demo)
        console.log('Joining family with code:', joinCode);
        // In a real app, you'd validate the join code and add user to family
      }
      
      onNext();
    } catch (error) {
      console.error('Error setting up family:', error);
      alert('Failed to set up family. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-sage-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">👨‍👩‍👧‍👦</span>
        </div>
        <h2 className="text-2xl font-semibold text-earth-800 mb-3">Set up your family</h2>
        <p className="text-earth-600 leading-relaxed">
          Create a new family space or join an existing one
        </p>
      </div>

      <div className="flex rounded-xl bg-earth-100 p-1 mb-6">
        <button
          onClick={() => setMode('create')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            mode === 'create' 
              ? 'bg-white text-earth-800 shadow-gentle' 
              : 'text-earth-600 hover:text-earth-800'
          }`}
        >
          Create Family
        </button>
        <button
          onClick={() => setMode('join')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            mode === 'join' 
              ? 'bg-white text-earth-800 shadow-gentle' 
              : 'text-earth-600 hover:text-earth-800'
          }`}
        >
          Join Family
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'create' ? (
          <div>
            <label className="block text-sm font-semibold text-earth-700 mb-2">
              Family Name
            </label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="zen-input w-full"
              placeholder="The Johnson Family"
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-earth-700 mb-2">
              Family Join Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="zen-input w-full"
              placeholder="Enter 6-digit code"
              required
            />
          </div>
        )}

        <div className="flex space-x-3">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 px-6 py-3 border border-earth-300 text-earth-700 rounded-xl hover:bg-earth-50 transition-all duration-200 font-medium"
            >
              Skip for now
            </button>
          )}
          <button
            type="submit"
            disabled={loading || (mode === 'create' ? !familyName : !joinCode)}
            className="zen-button flex-1 disabled:opacity-50"
          >
            {loading ? 'Setting up...' : mode === 'create' ? 'Create Family' : 'Join Family'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ChildrenSetup: React.FC<{ onNext: () => void; onSkip?: () => void }> = ({ onNext, onSkip }) => {
  const [children, setChildren] = useState<Array<{ name: string; school: string; class: string; color: string }>>([]);
  const [currentChild, setCurrentChild] = useState({ name: '', school: '', class: '', color: '#6b776b' });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const avatarColors = [
    '#6b776b', '#9d8b75', '#b5a693', '#8a968a', '#7d6b56', '#556055',
    '#cbbfa8', '#b5a488', '#9a8569', '#78716c', '#57534e', '#44403c'
  ];

  const addChild = () => {
    if (currentChild.name) {
      setChildren([...children, currentChild]);
      setCurrentChild({ name: '', school: '', class: '', color: avatarColors[children.length % avatarColors.length] });
    }
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    if (!user?.family_id) {
      onNext();
      return;
    }

    setLoading(true);
    try {
      // Save children to database
      if (children.length > 0) {
        const childrenData = children.map(child => ({
          name: child.name,
          school_name: child.school || null,
          class_name: child.class || null,
          avatar_color: child.color,
          family_id: user.family_id,
        }));

        const { error } = await supabase
          .from('children')
          .insert(childrenData);

        if (error) {
          throw error;
        }
      }
      
      onNext();
    } catch (error) {
      console.error('Error saving children:', error);
      alert('Failed to save children. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-sage-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">👶</span>
        </div>
        <h2 className="text-2xl font-semibold text-earth-800 mb-3">Add your children</h2>
        <p className="text-earth-600 leading-relaxed">
          Add your children's profiles to get started with organizing their activities
        </p>
      </div>

      {/* Added Children */}
      {children.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-earth-700">Added Children</h3>
          {children.map((child, index) => (
            <div key={index} className="zen-card p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-medium shadow-gentle"
                  style={{ backgroundColor: child.color }}
                >
                  {child.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-earth-800">{child.name}</p>
                  <p className="text-sm text-earth-600">
                    {child.class && child.school ? `${child.class} • ${child.school}` : child.school || 'No school info'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeChild(index)}
                className="text-stone-600 hover:text-stone-800 transition-colors duration-200"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Child Form */}
      <div className="zen-card p-6 space-y-4">
        <h3 className="font-semibold text-earth-800 mb-4">Add a child</h3>
        
        <div>
          <input
            type="text"
            value={currentChild.name}
            onChange={(e) => setCurrentChild({ ...currentChild, name: e.target.value })}
            className="zen-input w-full"
            placeholder="Child's name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={currentChild.school}
            onChange={(e) => setCurrentChild({ ...currentChild, school: e.target.value })}
            className="zen-input w-full"
            placeholder="School name"
          />
          <input
            type="text"
            value={currentChild.class}
            onChange={(e) => setCurrentChild({ ...currentChild, class: e.target.value })}
            className="zen-input w-full"
            placeholder="Class/Grade"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-earth-700 mb-2">Avatar Color</label>
          <div className="flex space-x-2">
            {avatarColors.slice(0, 6).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setCurrentChild({ ...currentChild, color })}
                className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                  currentChild.color === color ? 'border-earth-800 scale-110' : 'border-earth-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={addChild}
          disabled={!currentChild.name}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-sage-300 text-sage-700 rounded-xl hover:bg-sage-50 transition-all duration-200 font-medium disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Child</span>
        </button>
      </div>

      <div className="flex space-x-3">
        {onSkip && (
          <button
            onClick={onSkip}
            className="flex-1 px-6 py-3 border border-earth-300 text-earth-700 rounded-xl hover:bg-earth-50 transition-all duration-200 font-medium"
          >
            Skip for now
          </button>
        )}
        <button
          onClick={handleFinish}
          disabled={loading}
          className="zen-button flex-1 disabled:opacity-50"
        >
          {loading ? 'Saving...' : children.length > 0 ? 'Continue' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
};

const Welcome: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const features = [
    {
      icon: '📅',
      title: 'Organize Events',
      description: 'Keep track of school activities, appointments, and family events'
    },
    {
      icon: '✅',
      title: 'Manage Tasks',
      description: 'Create preparation tasks and never forget important items'
    },
    {
      icon: '👨‍👩‍👧‍👦',
      title: 'Family Coordination',
      description: 'Share responsibilities and stay connected with your family'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-sage-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🌿</span>
        </div>
        <h2 className="text-2xl font-semibold text-earth-800 mb-3">Welcome to ParentPal</h2>
        <p className="text-earth-600 leading-relaxed max-w-sm mx-auto">
          Your peaceful family organization companion is ready to help you stay organized and stress-free
        </p>
      </div>

      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="zen-card p-5 flex items-start space-x-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-gentle">
              <span className="text-xl">{feature.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-earth-800 mb-1">{feature.title}</h3>
              <p className="text-sm text-earth-600 leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="zen-button w-full flex items-center justify-center space-x-2"
      >
        <span>Get Started</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const steps: OnboardingStep[] = [
    {
      id: 'family',
      title: 'Family Setup',
      description: 'Create or join your family space',
      component: FamilySetup
    },
    {
      id: 'children',
      title: 'Add Children',
      description: 'Set up your children\'s profiles',
      component: ChildrenSetup
    },
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'You\'re all set!',
      component: Welcome
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding and navigate to dashboard
      localStorage.setItem('onboarding_completed', 'true');
      navigate('/', { replace: true });
    }
  };

  const handleSkip = () => {
    // Skip to welcome step or complete onboarding
    if (currentStep < steps.length - 1) {
      setCurrentStep(steps.length - 1);
    } else {
      localStorage.setItem('onboarding_completed', 'true');
      navigate('/', { replace: true });
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-earth-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index <= currentStep ? 'bg-sage-600' : 'bg-earth-300'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="zen-card p-8">
          <CurrentStepComponent 
            onNext={handleNext} 
            onSkip={currentStep < steps.length - 1 ? handleSkip : undefined}
          />
        </div>
      </div>
    </div>
  );
};