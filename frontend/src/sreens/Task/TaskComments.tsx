import React, { useState, useRef, ChangeEvent, useEffect, useCallback } from 'react';
import { 
  MdSend, 
  MdAttachFile, 
  MdMoreVert, 
  MdEdit, 
  MdDelete, 
  MdContentCopy,
  MdImage,
  MdCancel
} from 'react-icons/md';
import './TaskComments.scss';
import { Comment, FileAttachment, UploadingFile } from '../../types/task';
import { useAuth } from '../../context/AuthContext';
import { TasksApi } from '../../api/tasks.api';

interface TaskCommentsProps {
  taskId?: string;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user: authUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const FilePreview: React.FC<{ file: FileAttachment }> = ({ file }) => {
    if (file.type.startsWith('image/')) {
      return (
        <img 
          src={file.preview || file.url} 
          alt={file.name} 
          className="file-preview-image"
        />
      );
    }
    return (
      <div className="file-info">
        <span className="name">{file.name}</span>
        <span className="size">{formatBytes(file.rawSize)}</span>
      </div>
    );
  };

  useEffect(() => {
    const loadComments = async () => {
      if (taskId) {
        try {
          const loadedComments = await TasksApi.getComments(taskId);
          setComments(loadedComments);
        } catch (error) {
          console.error('Ошибка загрузки комментариев:', error);
        }
      }
    };
    
    loadComments();
  }, [taskId]);

  const handleCommentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
  };

  const createUploadableFile = (file: File): UploadingFile => ({
    id: Date.now().toString() + file.name,
    file,
    preview: URL.createObjectURL(file),
    progress: 0,
    status: 'pending'
  });

  const handleAddComment = async () => {
  console.log('Начало обработки комментария'); // Добавьте это
  if ((newComment.trim() === '' && files.length === 0) || !taskId) {
    console.log('Условие отмены выполнения:', {newComment, files, taskId});
    return;
  }
    try {
      const formData = new FormData();
      formData.append('comment', newComment);
      files.forEach(file => formData.append('files', file.file));

      let updatedComment: Comment;
      let updatedComments: Comment[];

      if (editingCommentId) {
        updatedComment = await TasksApi.updateComment(
          taskId,
          editingCommentId, 
          newComment,
          files.map(f => f.file)
        );
        updatedComments = comments.map(c => 
          c.id === editingCommentId ? updatedComment : c
        );
        setEditingCommentId(null);
      } else {
        const newCommentData = await TasksApi.addComment(
          taskId, 
          newComment, 
          files.map(f => f.file)
        );
        updatedComments = [...comments, newCommentData];
      }

      setComments(updatedComments);
      setFiles([]);
      setNewComment('');
      setEditingCommentId(null);
    } catch (error) {
      console.error('Ошибка сохранения комментария:', error);
      setFiles(prev => prev.map(f => ({
        ...f,
        status: 'error',
        error: 'Ошибка загрузки файла'
      })));
    }
  };

  const handleEditComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    setNewComment(comment.text);
    setEditingCommentId(commentId);
    setShowMenuId(null);

    // Загрузка превью для существующих файлов
    const filesWithPreview = await Promise.all(
      comment.files.map(async (file) => {
        const response = await fetch(file.url);
        const blob = await response.blob();
        return {
          id: file.id,
          file: new File([blob], decodeURIComponent(file.name), { type: file.type }),
          preview: file.url,
          progress: 100,
          status: 'completed' as const
        };
      })
    );

    setFiles(filesWithPreview);
  };

  const handleDeleteComment = async (taskId: string, commentId: string) => {
    try {
      if(taskId === '') return
      await TasksApi.deleteComment(taskId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setShowMenuId(null);
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleCopyComment = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowMenuId(null);
  };

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files).map(createUploadableFile);
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files?.length) {
      const newFiles = Array.from(e.dataTransfer.files).map(createUploadableFile);
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

const renderFilePreview = (file: UploadingFile | FileAttachment) => {
    if ('status' in file) {
      return (
        <div className="file-item uploading">
          <div className="preview">
            {file.file.type.startsWith('image/') ? (
              <img src={file.preview} alt={file.file.name} />
            ) : (
              <div className="file-icon">
                <MdAttachFile size={20} />
                <span>{file.file.type.split('/')[1]}</span>
              </div>
            )}
          </div>
          <div className="info">
            <span className="name">{file.file.name}</span>
            {file.status === 'uploading' && (
              <progress value={file.progress} max="100" />
            )}
            {file.status === 'error' && (
              <span className="error">{file.error}</span>
            )}
          </div>
          <button 
            className="remove"
            onClick={() => handleRemoveFile(file.id)}
          >
            <MdCancel size={16} />
          </button>
        </div>
      );
    }
    
    return (
      <div className="file-item">
        <a href={file.url} target="_blank" rel="noopener noreferrer">
          {file.type.startsWith('image/') ? (
            <img src={file.url} alt={file.name} />
          ) : (
            <div className="file-info">
              <span className="name">{file.name}</span>
              <span className="size"> {file.size}</span>
            </div>
          )}
        </a>
      </div>
    );
  };

  return (
    <div className="task-comments-container">
      <h3 className="comments-title">Комментарии</h3>
      
      <div className="comments-list">
        {comments.map(comment => (
          <div key={comment.id} className="comment-item">
            <div className="comment-header">
              <div className="assignee-info">
                <img 
                  src={comment.author.avatar}
                  alt={comment.author?.name} 
                  className="avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />
              </div>
              <div className="comment-author">{comment.author.name}</div>
              <div className="comment-date">
                {formatDate(comment.date)}
              </div>
              <div className="comment-date">
                {(comment.isEdited && comment.editDate) && <span className="edited-label">Изменено: {formatDate(comment.editDate)}</span>}
              </div>
              <div className="comment-menu" ref={menuRef}>
                <button 
                  className="menu-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenuId(comment.id === showMenuId ? null : comment.id);
                  }}
                >
                  <MdMoreVert size={18} />
                </button>
                {showMenuId === comment.id && (
                  <div className="menu-content">
                    <button onClick={() => handleEditComment(comment.id)}>
                      <MdEdit size={16} /> Редактировать
                    </button>
                    <button onClick={() => handleDeleteComment(taskId || '', comment.id)}>
                      <MdDelete size={16} /> Удалить
                    </button>
                    <button onClick={() => handleCopyComment(comment.text)}>
                      <MdContentCopy size={16} /> Копировать
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div 
              className="comment-text"
              dangerouslySetInnerHTML={{ 
                __html: comment.text.replace(/\n/g, '<br/>') || '<em>Нет текста</em>' 
              }} 
            />
            {comment.files.length > 0 && (
              <div className="uploads-container">
                {comment.files.map(file => renderFilePreview(file))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div 
        className={`comment-editor ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="editor-toolbar">
          <button 
            className="toolbar-button"
            onClick={() => fileInputRef.current?.click()}
            title="Прикрепить файл"
          >
            <MdAttachFile size={20} />
          </button>
          {/* <button 
            className="toolbar-button"
            onClick={() => fileInputRef.current?.click()}
            title="Добавить изображение"
          >
            <MdImage size={20} />
          </button> */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            style={{ display: 'none' }}
          />
        </div>
        <textarea
          className="comment-input"
          placeholder="Напишите комментарий..."
          value={newComment}
          onChange={handleCommentChange}
          rows={4}
        />
        {files.length > 0 && (
          <div className="uploads-container">
            {files.map(file => renderFilePreview(file))}
          </div>
        )}
        <div className="editor-actions">
          <div className="drag-hint">
            {isDragging ? 'Отпустите файлы для загрузки' : 'Перетащите файлы сюда'}
          </div>
          <button 
            className="send-button"
            onClick={handleAddComment}
            disabled={(newComment.trim() === '' && files.length === 0) || taskId?.toString()[1] === '.'}
          >
            <MdSend size={20} />
            {editingCommentId ? 'Обновить' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskComments;