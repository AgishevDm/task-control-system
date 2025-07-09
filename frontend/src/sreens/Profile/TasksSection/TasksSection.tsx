import React from 'react';
import './TasksSection.scss';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const TasksSection: React.FC = () => {
  const [tasks, setTasks] = React.useState<Task[]>(Array.from({length: 9}, (_, i) => ({
    id: i + 1,
    text: `Задача №${i + 1} - ${['проект', 'встреча', 'документы'][i % 3]}`,
    completed: i % 4 === 0
  })));

  const toggleTask = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <div className="tasks-container">
      {tasks.map(task => (
        <div key={task.id} className="task-item">
          <label className="custom-checkbox">
            <input 
              type="checkbox" 
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />
            <span className="checkmark"></span>
          </label>
          <span className="task-text">{task.text}</span>
        </div>
      ))}
    </div>
  );
};

export default TasksSection;