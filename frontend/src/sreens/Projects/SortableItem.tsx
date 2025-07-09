import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';

type SortableItemProps = {
  id: string | number;
  children: ReactNode;
  data?: Record<string, any>;
};

export function SortableItem({ id, children, data }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, data });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    cursor: 'grab',
    touchAction: 'none'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes}
      {...listeners}
      data-dnd-data={JSON.stringify(data)}
    >
      {children}
    </div>
  );
}