import React, { useState } from 'react';
import { TaskCard } from '../components/TaskCard';
import { FilterBar } from '../components/FilterBar';
import { useTasks } from '../hooks/useTasks';
import { useChildren } from '../hooks/useChildren';
import { useAuth } from '../hooks/useAuth';
import type { FilterState } from '../types';

export const Prep: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    assignee: null,
    child: null,
    eventType: null,
    status: null,
  });

  const { tasks, loading, error, toggleTaskStatus } = useTasks(filters);
  const { children } = useChildren();

  const preparationTasks = tasks.filter(task => task.task_type === 'preparation');
  const pendingTasks = preparationTasks.filter(task => task.status !== 'completed');
  const completedTasks = preparationTasks.filter(task => task.status === 'completed');

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-earth-200 h-28 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="zen-card p-6 border-stone-300">
          <p className="text-stone-800">Error loading tasks: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        users={user ? [user] : []}
        children={children}
      />

      <div className="p-6 space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">📋</span>
            Preparation Tasks ({pendingTasks.length})
          </h2>
          
          {pendingTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-sage-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🧘‍♀️</span>
              </div>
              <h3 className="text-xl font-semibold text-earth-800 mb-3">All prepared!</h3>
              <p className="text-earth-600 max-w-sm mx-auto leading-relaxed">
                No preparation tasks pending. You're beautifully organized and ready for what's ahead.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskStatus}
                />
              ))}
            </div>
          )}
        </section>

        {completedTasks.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-earth-800 mb-4 flex items-center">
              <span className="text-2xl mr-3">✨</span>
              Completed ({completedTasks.length})
            </h2>
            <div className="space-y-4">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskStatus}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};