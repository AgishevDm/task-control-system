import { FC, useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { keymap } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { FiX, FiSave } from 'react-icons/fi';
import './FileManager.scss';

interface EditorModalProps {
  content: string;
  onSave: (content: string) => Promise<void>;
  onClose: () => void;
}

export const EditorModal: FC<EditorModalProps> = ({ content, onSave, onClose }) => {
  const [value, setValue] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(value);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="editor-modal">
      <div className="editor-modal__container" ref={modalRef}>
        <div className="editor-modal__header">
          <h3>Редактирование документа</h3>
          <div className="editor-modal__actions">
            <button className="save-button" onClick={handleSave} disabled={isSaving}>
              <FiSave /> {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button className="close-button" onClick={onClose}>
              <FiX />
            </button>
          </div>
        </div>
        <div className="editor-modal__content">
          <CodeMirror
            value={value}
            height="100%"
            extensions={[
              markdown(),
              keymap.of([indentWithTab, ...defaultKeymap])
            ]}
            onChange={(val) => setValue(val)}
          />
        </div>
      </div>
    </div>
  );
};