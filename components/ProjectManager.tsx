import React, { useState, useEffect } from 'react';
import { SavedProject, PromptScene, CameraAngle, CameraMovement, SpecialTechnique, VisualStyle } from '../types';
import { storageService } from '../services/storageService';
import { Save, FolderOpen, Trash2, Calendar } from 'lucide-react';

interface ProjectManagerProps {
  currentScenes: PromptScene[];
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  specialTechnique: SpecialTechnique;
  visualStyle: VisualStyle;
  artistName?: string;
  songTitle?: string;
  onProjectLoad: (project: SavedProject) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  currentScenes,
  cameraAngle,
  cameraMovement,
  specialTechnique,
  visualStyle,
  artistName,
  songTitle,
  onProjectLoad,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const allProjects = storageService.getAllProjects();
    setProjects(allProjects);
  };

  const handleSave = () => {
    if (!projectTitle.trim()) {
      alert('プロジェクトタイトルを入力してください');
      return;
    }

    if (currentScenes.length === 0) {
      alert('保存する字コンテがありません');
      return;
    }

    const saved = storageService.saveProject(
      projectTitle,
      currentScenes,
      cameraAngle,
      cameraMovement,
      specialTechnique,
      visualStyle,
      artistName,
      songTitle,
      selectedProjectId || undefined
    );

    setShowSaveDialog(false);
    setProjectTitle('');
    setSelectedProjectId(null);
    loadProjects();
    alert(`プロジェクト「${saved.title}」を保存しました`);
  };

  const handleLoad = (project: SavedProject) => {
    onProjectLoad(project);
    setShowLoadDialog(false);
    setSelectedProjectId(project.id);
    alert(`プロジェクト「${project.title}」を読み込みました`);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`プロジェクト「${title}」を削除しますか？`)) {
      storageService.deleteProject(id);
      loadProjects();
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex gap-2">
      {/* 保存ボタン */}
      <button
        onClick={() => {
          setProjectTitle(songTitle || '');
          setShowSaveDialog(true);
        }}
        disabled={currentScenes.length === 0}
        className="px-4 py-2 rounded-lg bg-primary text-white font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="現在の字コンテを保存"
      >
        <Save className="w-4 h-4" />
        プロジェクト保存
      </button>

      {/* 読み込みボタン */}
      <button
        onClick={() => {
          loadProjects();
          setShowLoadDialog(true);
        }}
        className="px-4 py-2 rounded-lg bg-surface border border-gray-600 text-text font-medium flex items-center gap-2 hover:bg-gray-700 transition-colors"
        title="保存済みプロジェクトを読み込む"
      >
        <FolderOpen className="w-4 h-4" />
        プロジェクト読み込み
      </button>

      {/* 保存ダイアログ */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">プロジェクトを保存</h3>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="プロジェクトタイトル（例：春の歌 - 字コンテ）"
              className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg text-white mb-4 focus:outline-none focus:border-primary"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 読み込みダイアログ */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">プロジェクトを読み込む</h3>
            
            {projects.length === 0 ? (
              <p className="text-muted text-center py-8">保存されたプロジェクトがありません</p>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-background border border-gray-700 rounded-lg p-4 hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-lg">{project.title}</h4>
                        {project.songTitle && (
                          <p className="text-sm text-muted">曲: {project.songTitle}</p>
                        )}
                        {project.artistName && (
                          <p className="text-sm text-muted">アーティスト: {project.artistName}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(project.updatedAt)}
                          </span>
                          <span>{project.scenes.length} シーン</span>
                          <span className="text-accent">{project.visualStyle}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoad(project)}
                          className="px-3 py-1 rounded bg-primary text-white text-sm hover:bg-primary/90"
                        >
                          読み込む
                        </button>
                        <button
                          onClick={() => handleDelete(project.id, project.title)}
                          className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
