import { useOutletContext } from 'react-router-dom';
import { Project } from '../../types/project';
import { ProjectEditModal } from '../Projects/ProjectEditModal';
import { useState, useEffect } from 'react';
import { ProjectsApi } from '../../api/projects';

export default function ProjectSettings() {
  const project = useOutletContext<Project>();
  const [currentProject, setCurrentProject] = useState(project);
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      const updated = await ProjectsApi.getProjectById(project.primarykey);
      setCurrentProject(updated);
    };
    fetchProject();
  }, [project.primarykey]);

  const handleSave = async (updatedProject: Project) => {
    try {
      const saved = await ProjectsApi.updateProject(
        updatedProject.primarykey,
        updatedProject
      );
      setCurrentProject(saved);
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  return (
    <div className="project-settings">
      <ProjectEditModal
        project={currentProject}
        onClose={() => {/* можно оставить пустым или добавить навигацию назад */}}
        onSave={handleSave}
        isEditing={isEditing}
        isCreator={currentProject.createdBy === project.createdBy}
      />
    </div>
  );
}