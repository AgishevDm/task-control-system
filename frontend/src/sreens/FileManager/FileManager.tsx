import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FiFolder, FiFile, FiPlus, FiChevronRight, FiChevronDown, FiTrash2, FiEdit, FiUpload, FiDownload, FiEye, FiLoader } from 'react-icons/fi';
import './FileManager.scss';
import { FileHierarchyResponseDto } from '../../types/fileHierarchy';
import { FileApi } from '../../api/fileHierarchy';
import { EditorModal } from './EditorModal';
import { OnlyofficeApi } from '../../api/onlyoffice';
import { ShareModal } from '../../components/ShareModal';

type DragItem = {
  id: string;
  parentId: string | 'root';
};

interface TreeNodeProps {
  node: FileHierarchyResponseDto;
  depth?: number;
  parentId: string | 'root';
}

const isEditableFile = (node: FileHierarchyResponseDto): boolean => {
  if (node.type !== 'file') return false;
  
  const editableTypes = [
    'text/plain',
    'text/html',
    'text/css',
    'application/json',
    'application/javascript'
  ];
  
  return editableTypes.some(type => 
    node.mimeType?.toLowerCase().includes(type)
  );
};

const FileManager = () => {
  // const [rootFolder] = useState(() => ({
  //   id: 'root',
  //   name: 'Корневая папка',
  //   type: 'folder' as const,
  //   expanded: true,
  //   children: [] as FileNode[],
  // }));
  //const [files, setFiles] = useState<FileNode[]>([rootFolder]);
  const [editingFile, setEditingFile] = useState<{
    id: string;
    content: string;
    isPlainText: boolean;
  } | null>(null);
  const [files, setFiles] = useState<FileHierarchyResponseDto[]>([]);
  const [viewMode, setViewMode] = useState<'own' | 'shared'>('own');
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{x: number; y: number; nodeId: string} | null>(null);
  const [editingNode, setEditingNode] = useState<{id: string; name: string} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{ fileId: string } | null>(null);

  // useEffect(() => {
  //   const loadTree = async () => {
  //     try {
  //       const tree = await FileApi.getFileTree();
  //       // Добавим свойство expanded для отображения
  //       setFiles(tree);
  //     } catch (error) {
  //       console.error('Ошибка загрузки файлов:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   loadTree();
  // }, []);

  useEffect(() => {
    const loadTree = async () => {
      try {
        if (viewMode === 'own') {
          const tree = await FileApi.getFileTree();
          setFiles(tree);
        } else {
          const shared = await FileApi.getSharedFiles();
          setFiles(shared);
        }
      } catch (error) {
        console.error('Ошибка загрузки файлов:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTree();
  }, [viewMode]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, parentId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadedFiles = await Promise.all(
        Array.from(files).map(file => 
          FileApi.uploadFile(file, parentId)
        )
      );
      
      setFiles(prev => updateTreeWithNewFiles(prev, parentId, uploadedFiles));
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
    }
  };

  const updateTreeWithNewFiles = (
    prev: FileHierarchyResponseDto[],
    parentId: string,
    newFiles: FileHierarchyResponseDto[]
  ): FileHierarchyResponseDto[] => {
    const updateTree = (nodes: FileHierarchyResponseDto[]): FileHierarchyResponseDto[] => {
      return nodes.map(node => {
        if (node.id === parentId && node.type === 'folder') {
          return {
            ...node,
            children: [...(node.children || []), ...newFiles]
          };
        }
        if (node.children) {
          return {
            ...node,
            children: updateTree(node.children)
          };
        }
        return node;
      });
    };
    return updateTree(prev);
  };

  const handleDownload = async (nodeId: string) => {
    try {
      // Получаем прямой URL из БД
      const { url, name } = await FileApi.downloadFile(nodeId);
      
      // Создаем временную ссылку
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.rel = 'noopener noreferrer';
      link.target = '_blank';
      
      // Симулируем клик
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Для старых браузеров
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('Ошибка скачивания:', error);
    }
  };

  const triggerFileInput = (parentId: string) => {
    if (fileInputRef.current) {
      // Сохраняем parentId в dataset для использования в обработчике
      fileInputRef.current.dataset.parentId = parentId;
      fileInputRef.current.click();
    }
  };

  const findNode = useCallback((nodes: FileHierarchyResponseDto[], id: string): FileHierarchyResponseDto | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }, []);

  const removeNode = useCallback((nodes: FileHierarchyResponseDto[], id: string): FileHierarchyResponseDto[] => {
    return nodes.filter(node => {
      if (node.id === id) return false;
      if (node.children) {
        node.children = removeNode(node.children, id);
      }
      return true;
    });
  }, []);

  const insertNode = useCallback((nodes: FileHierarchyResponseDto[], parentId: string, newNode: FileHierarchyResponseDto): FileHierarchyResponseDto[] => {
    return nodes.map(node => {
      if (node.id === parentId && node.type === 'folder') {
        // Проверяем нет ли уже такого элемента
        if (!node.children?.some(n => n.id === newNode.id)) {
          return {
            ...node,
            children: [...(node.children || []), newNode]
          };
        }
        return node;
      }
      if (node.children) {
        return {
          ...node,
          children: insertNode(node.children, parentId, newNode)
        };
      }
      return node;
    });
  }, []);

  const handleDragStart = (e: React.DragEvent, nodeId: string, parentId: string) => {
    console.log('Drag started:', nodeId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData('text/plain', nodeId);
    setDragItem({ id: nodeId, parentId });
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragItem(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (nodeId !== dropTarget) {
      console.log('Drag over:', nodeId);
      setDropTarget(nodeId);
    }
  };

  const handleDrop = (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop on:', dropId);
    
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === dropId) return;

    const isChild = checkIsChild(files, draggedId, dropId);
    if (isChild) {
      console.log('Cannot drop into child');
      return;
    }

    setFiles(prev => {
      const dropNode = findNode(prev, dropId);
      const nodeToMove = findNode(prev, draggedId);
      
      if (!dropNode || dropNode.type !== 'folder' || !nodeToMove) {
        return prev;
      }

      // Создаем глубокую копию с правильным типом
      const newTree = JSON.parse(JSON.stringify(prev)) as FileHierarchyResponseDto[];
      
      // Обновленные функции с правильными типами
      const removeNodeById = (nodes: FileHierarchyResponseDto[]): FileHierarchyResponseDto[] => {
        return nodes.filter(node => {
          if (node.id === draggedId) return false;
          if (node.children) node.children = removeNodeById(node.children);
          return true;
        });
      };
      
      const insertNodeToParent = (nodes: FileHierarchyResponseDto[]): FileHierarchyResponseDto[] => {
        return nodes.map(node => {
          if (node.id === dropId) {
            return {
              ...node,
              children: [...(node.children || []), { ...nodeToMove }]
            };
          }
          if (node.children) {
            return { ...node, children: insertNodeToParent(node.children) };
          }
          return node;
        });
      };
      
      return insertNodeToParent(removeNodeById(newTree));
    });

    setIsDragging(false);
    setDropTarget(null);
  };

  const checkIsChild = (nodes: FileHierarchyResponseDto[], parentId: string, targetId: string): boolean => {
    // Если проверяем корень
    if (parentId === 'root') {
      return nodes.some(n => n.id === targetId || checkIsChild(n.children || [], n.id, targetId));
    }

    const parent = findNode(nodes, parentId);
    if (!parent) return false;
    
    let queue = [...parent.children || []];
    while (queue.length) {
      const current = queue.shift();
      if (current?.id === targetId) return true;
      if (current?.children) queue.push(...current.children);
    }
    return false;
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const handleDelete = async (nodeId: string) => {
    try {
      await FileApi.deleteItem(nodeId);
      setFiles(prev => removeNode(prev, nodeId));
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleRename = async (nodeId: string, newName: string) => {
    try {
      setIsRenaming(true);
      // Вызываем API для обновления имени на сервере
      const updatedNode = await FileApi.renameItem(nodeId, newName);
      
      // Обновляем локальное состояние
      const updateName = (nodes: FileHierarchyResponseDto[]): FileHierarchyResponseDto[] => nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, name: updatedNode.name };
        }
        if (node.children) {
          return { ...node, children: updateName(node.children) };
        }
        return node;
      });
      
      setFiles(prev => updateName(prev));
      setEditingNode(null);
    } catch (error) {
      console.error('Ошибка переименования:', error);
      // Можно добавить уведомление об ошибке
    } finally {
      setIsRenaming(false);
    }
  };

  const toggleFolder = (nodeId: string) => {
    const updateNode = (nodes: FileHierarchyResponseDto[]): FileHierarchyResponseDto[] => nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children) {
        return { ...node, children: updateNode(node.children) };
      }
      return node;
    });
    
    setFiles(prev => updateNode(prev));
  };

  const addNewItem = async (parentId: string, type: 'file' | 'folder') => {
    try {
      if (type === 'folder') {
        const newFolder = await FileApi.createFolder({
          name: 'Новая папка',
          parentId: parentId === 'root' ? undefined : parentId
        });

        setFiles(prev => {
          if (parentId === 'root') {
            return [...prev, newFolder];
          }
          return insertNode(prev, parentId, newFolder);
        });
      }
    } catch (error) {
      console.error('Ошибка создания папки:', error);
    }
  };

  const fetchFileContent = async (fileId: string): Promise<string> => {
    try {
      return await FileApi.getFileContent(fileId);
    } catch (error) {
      console.error('Ошибка загрузки контента:', error);
      return '';
    }
  };

  const saveFileContent = async (fileId: string, content: string): Promise<void> => {
    try {
      await FileApi.updateFileContent(fileId, content);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      throw error;
    }
  };

  const FileTreeNode = ({ node, depth = 0, parentId }: TreeNodeProps) => {
    const handleFolderClick = () => {
      if (node.type === 'folder') {
        toggleFolder(node.id);
      }
    };

    return (
      <div 
        className={`node ${dropTarget === node.id ? 'drop-target' : ''}`}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, node.id, parentId)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (node.type === 'folder') {
            setDropTarget(node.id);
          }
        }}
        onDragLeave={() => setDropTarget(null)}
        onDrop={(e) => {
          if (node.type === 'folder') {
            handleDrop(e, node.id);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleContextMenu(e, node.id);
        }}
      >
        {editingNode?.id === node.id ? (
          <input
            type="text"
            value={editingNode.name}
            onChange={(e) => setEditingNode({...editingNode, name: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && handleRename(node.id, editingNode.name)}
            disabled={isRenaming}
            autoFocus
          />
        ) : (
        <div 
          className="node-content"
          style={{ paddingLeft: `${depth * 24}px` }}
          onClick={handleFolderClick}
        >
          {node.type === 'folder' && (
            <span className="toggle-icon">
              {node.expanded ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          )}
          
          <span 
            className="icon"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          >
            {node.type === 'folder' ? <FiFolder /> : <FiFile />}
          </span>
          
          <span className="name">{node.name}</span>

          {/* {node.type === 'file' && node.mimeType?.includes('officedocument.wordprocessingml') && (
            <div className="file-actions">
              <button
                className="edit-button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (node.url) {
                    window.open(`/editor.html?fileKey=${encodeURIComponent(node.url)}`, '_blank')
                  };
                }}
                title="Редактировать"
              >
                <FiEdit />
              </button>
            </div>
          )} */}

          {node.type === 'file' && (
            <div className="file-actions">
              {isEditableFile(node) && (
                <button
                  className="edit-button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setLoadingFileId(node.id);
                    try {
                      const content = await fetchFileContent(node.id);
                      setEditingFile({
                        id: node.id,
                        content,
                        isPlainText: node.mimeType?.toLowerCase() === 'text/plain'
                      });
                    } finally {
                      setLoadingFileId(null);
                    }
                  }}
                  title="Редактировать"
                >
                  {loadingFileId === node.id
                   ? <FiLoader className="spin" />
                   : <FiEdit />
                  }
                </button>
              )}

              {node.mimeType?.includes('officedocument.wordprocessingml') && (
                <div className="file-actions">
                  <button
                    className="edit-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (node.url) {
                        window.open(`/editor.html?fileKey=${encodeURIComponent(node.url)}&fileId=${node.id}`, '_blank')
                      };
                    }}
                    title="Редактировать"
                  >
                    <FiEdit />
                  </button>
                </div>
              )}

              {/* Кнопка предпросмотра без изменений */}
              <button
                className="preview-button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(node.url, '_blank');
                }}
                title="Предпросмотр"
              >
                <FiEye />
              </button>
              
              {/* Исправленная кнопка скачивания */}
              <button 
                className="download-button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleDownload(node.id);
                }}
                title="Скачать файл"
              >
                <FiDownload />
              </button>
            </div>
          )}
        </div>
        )}

        {node.expanded && node.type === 'folder' && (
          <div className="folder-actions" style={{ paddingLeft: `${(depth + 1) * 24}px` }}>
            <button 
              className="upload-button"
              onClick={(e) => {
                e.stopPropagation();
                triggerFileInput(node.id);
              }}
            >
              <FiUpload /> Загрузить файлы
            </button>
          </div>
        )}

        {node.expanded && node.children?.map(child => (
          <FileTreeNode 
            key={child.id} 
            node={child} 
            depth={depth + 1} 
            parentId={node.id}
          />
        ))}

        {node.expanded && node.children?.length === 0 && (
          <div 
            className="empty-folder"
            style={{ paddingLeft: `${(depth + 1) * 24}px` }}
          >
            Папка пуста
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-manager">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        multiple
        onChange={(e) => {
          const parentId = fileInputRef.current?.dataset.parentId || 'root';
          handleFileUpload(e, parentId);
        }}
      />

      {/* <div className="toolbar">
        <button onClick={() => addNewItem('root', 'folder')}>
          <FiPlus /> Новая папка
        </button>
      </div> */}

      {/* ТУЛБАР С ТАБАМИ И КНОПКОЙ "Новая папка" */}
      <div className="toolbar">
        <div className="tabs">
          <button
            className={viewMode === 'own' ? 'active' : ''}
            onClick={() => setViewMode('own')}
          >
            Мои файлы
          </button>
          <button
            className={viewMode === 'shared' ? 'active' : ''}
            onClick={() => setViewMode('shared')}
          >
            Расшаренные
          </button>
        </div>
        {viewMode === 'own' && (
          <button onClick={() => addNewItem('root', 'folder')}>
            <FiPlus /> Новая папка
          </button>
        )}
      </div>

      {shareModal && (
        <ShareModal
          fileId={shareModal.fileId}
          visible={true}
          onClose={() => setShareModal(null)}
        />
      )}

      {contextMenu && (
        <div 
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => addNewItem(contextMenu.nodeId, 'folder')}>
            <FiPlus /> Новая папка
          </button>
          {/* <button onClick={() => addNewItem(contextMenu.nodeId, 'file')}>
            <FiPlus /> Новый файл
          </button> */}
          <button onClick={() => handleDelete(contextMenu.nodeId)}>
            <FiTrash2 /> Удалить
          </button>
          <button onClick={() => {
            const node = findNode(files, contextMenu.nodeId);
            if (node) {
              setEditingNode({ id: node.id, name: node.name });
            }
            setContextMenu(null);
          }}>
            <FiEdit /> Переименовать
          </button>
          <button onClick={() => {
            setShareModal({ fileId: contextMenu.nodeId });
            setContextMenu(null);
          }}>
            <FiUpload /> Поделиться
          </button>
        </div>
      )}

      <div className="file-tree">
        {files.map(node => (
          <FileTreeNode key={node.id} node={node} parentId="root" />
        ))}
      </div>

      {editingFile && (
        <EditorModal
          content={editingFile.content}
          onSave={async (content) => {
            await saveFileContent(editingFile.id, content);
            setEditingFile(null);
          }}
          onClose={() => setEditingFile(null)}
          //isPlainText={editingFile.isPlainText}
        />
      )}
    </div>
  );
};

export default FileManager;