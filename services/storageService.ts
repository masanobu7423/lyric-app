import { SavedProject, PromptScene, CameraAngle, CameraMovement, SpecialTechnique, VisualStyle } from '../types';

const STORAGE_KEY = 'lyric_app_projects';

export const storageService = {
  // プロジェクト一覧を取得
  getAllProjects(): SavedProject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  },

  // プロジェクトを保存
  saveProject(
    title: string,
    scenes: PromptScene[],
    cameraAngle: CameraAngle,
    cameraMovement: CameraMovement,
    specialTechnique: SpecialTechnique,
    visualStyle: VisualStyle,
    artistName?: string,
    songTitle?: string,
    projectId?: string
  ): SavedProject {
    const projects = this.getAllProjects();
    const now = new Date().toISOString();
    
    if (projectId) {
      // 既存プロジェクトの更新
      const index = projects.findIndex(p => p.id === projectId);
      if (index !== -1) {
        projects[index] = {
          ...projects[index],
          title,
          scenes,
          cameraAngle,
          cameraMovement,
          specialTechnique,
          visualStyle,
          artistName,
          songTitle,
          updatedAt: now,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        return projects[index];
      }
    }
    
    // 新規プロジェクト作成
    const newProject: SavedProject = {
      id: Date.now().toString(),
      title,
      artistName,
      songTitle,
      cameraAngle,
      cameraMovement,
      specialTechnique,
      visualStyle,
      scenes,
      createdAt: now,
      updatedAt: now,
    };
    
    projects.push(newProject);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return newProject;
  },

  // プロジェクトを取得
  getProject(id: string): SavedProject | null {
    const projects = this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  },

  // プロジェクトを削除
  deleteProject(id: string): void {
    const projects = this.getAllProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  // プロジェクトの絵コンテ画像を更新
  updateSceneImage(projectId: string, sceneNumber: number, imageUrl: string): void {
    const projects = this.getAllProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (project) {
      const scene = project.scenes.find(s => s.sceneNumber === sceneNumber);
      if (scene) {
        scene.storyboardImage = imageUrl;
        project.updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      }
    }
  },
};
