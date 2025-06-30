import React, { useState } from 'react';
import { Calendar, CheckSquare, Users, X } from 'lucide-react';
import { AddEventForm } from '../components/AddEventForm';
import { AddTaskForm } from '../components/AddTaskForm';
import { AddChildForm } from '../components/AddChildForm';

type AddType = 'event' | 'task' | 'child' | null;

export const Add: React.FC = () => {
  const [selectedType, setSelectedType] = useState<AddType>(null);

  const addOptions = [
    {
      type: 'event' as const,
      icon: Calendar,
      emoji: '📅',
      title: 'Add Event',
      description: 'Schedule a family activity or appointment',
      color: 'bg-sage-50 border-sage-200 hover:bg-sage-100',
    },
    {
      type: 'task' as const,
      icon: CheckSquare,
      emoji: '✅',
      title: 'Add Task',
      description: 'Create a preparation or general task',
      color: 'bg-warm-50 border-warm-200 hover:bg-warm-100',
    },
    {
      type: 'child' as const,
      icon: Users,
      emoji: '👶',
      title: 'Add Child',
      description: 'Add a new child profile to your family',
      color: 'bg-earth-50 border-earth-200 hover:bg-earth-100',
    },
  ];

  const handleClose = () => {
    setSelectedType(null);
  };

  const handleSuccess = () => {
    setSelectedType(null);
  };

  if (selectedType) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-earth-800">
            {addOptions.find(opt => opt.type === selectedType)?.title}
          </h2>
          <button
            onClick={handleClose}
            className="p-2.5 hover:bg-earth-100 rounded-xl transition-all duration-200 text-earth-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="zen-card p-6">
          {selectedType === 'event' && (
            <AddEventForm onSuccess={handleSuccess} onCancel={handleClose} />
          )}
          {selectedType === 'task' && (
            <AddTaskForm onSuccess={handleSuccess} onCancel={handleClose} />
          )}
          {selectedType === 'child' && (
            <AddChildForm onSuccess={handleSuccess} onCancel={handleClose} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-earth-800 mb-3">What would you like to add?</h2>
        <p className="text-earth-600 leading-relaxed">Choose an option to get started with organizing your family life</p>
      </div>
      
      <div className="space-y-4 max-w-md mx-auto">
        {addOptions.map(({ type, icon: Icon, emoji, title, description, color }) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-warm ${color}`}
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white rounded-xl shadow-gentle">
                <span className="text-2xl">{emoji}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 text-earth-800">{title}</h3>
                <p className="text-sm text-earth-600 leading-relaxed">{description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};