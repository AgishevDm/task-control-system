declare module 'wx-react-gantt' {
  import { FC, Ref } from 'react';

  export interface Task {
    id: number | string;
    text: string;
    start: Date | string;
    end?: Date | string;
    duration?: number;
    progress?: number;
    type: string;
    parent?: string | number;
    open?: boolean;
  }

  export interface Link {
    id: number;
    source: number;
    target: number;
    type: 'e2s' | 's2s' | 'e2e' | string;
  }

  export interface Scale {
    unit: 'month' | 'day' | 'week' | 'year' | string;
    step: number;
    format: string;
    iso?: boolean;
  }

  export interface Column {
    id: string;
    header: string;
    flexGrow?: number;
    align?: 'center' | 'left' | 'right';
    width?: number;
    template?: (task: Task) => string;
  }

  export interface GanttApi {
    intercept: (event: string, callback: (data: any) => boolean | void) => void;
    exec: (action: string, payload: any) => void;
    getTask: (id: number) => Task;
  }

  export interface GanttProps {
    tasks: Task[];
    links?: Link[];
    scales?: Scale[];
    columns?: Column[];
    readonly?: boolean;
    highlightTime?: (date: Date, unit?: string) => string;
    apiRef?: Ref<GanttApi>;
    taskTypes?: Array<{ id: string; label: string }>;
    zoom?: boolean;
    markers?: { start: Date; text: string; css?: string }[];
    onTaskChange?: (task: Task) => void;
    onLinkCreate?: (link: Link) => void;
    taskTooltip?: (task: Task) => string;
    onTaskClick?: (task: Task) => void;
  }

  export const Gantt: FC<GanttProps>;
  export const ContextMenu: FC<{
    api: GanttApi;
    options: any[];
    filter?: (opt: any, task: Task) => boolean;
    children?: ReactNode;
  }>;

  export const Willow: FC<{ children?: ReactNode }>;
}
