export interface Task {
  id: number;
  open?: boolean;
  start: Date | string;
  duration: number;
  text: string;
  progress: number;
  type?: "task" | "summary";
  parent?: number;
}

export interface Link {
  id: number;
  source: number;
  target: number;
  type: "e2s" | "s2s" | "e2e";
}

export interface Scale {
  unit: "month" | "day";
  step: number;
  format: string;
}

export interface Column {
  id: string;
  header: string;
  flexGrow?: number;
  align?: "center" | "left" | "right";
  width?: number;
}

export const tasks: Task[] = [
  {
    id: 1,
    open: true,
    start: new Date(2023, 11, 6),
    duration: 8,
    text: "React Gantt Widget",
    progress: 60,
    type: "summary"
  },
  {
    id: 2,
    parent: 1,
    start: new Date(2023, 11, 6),
    duration: 4,
    text: "Lib-Gantt",
    progress: 80
  },
  {
    id: 3,
    parent: 1,
    start: new Date(2023, 11, 11),
    duration: 4,
    text: "UI Layer",
    progress: 30
  },
  {
    id: 4,
    start: new Date(2023, 11, 12),
    duration: 8,
    text: "Documentation",
    progress: 10,
    type: "summary"
  },
  {
    id: 5,
    parent: 4,
    start: new Date(2023, 11, 10),
    duration: 1,
    text: "Overview",
    progress: 30
  },
  {
    id: 6,
    parent: 4,
    start: new Date(2023, 12, 11),
    duration: 8,
    text: "API reference",
    progress: 0
  }
];

export const columns: Column[] = [
  { id: "text", header: "Task name", flexGrow: 2 },
  {
    id: "start",
    header: "Start date",
    flexGrow: 1,
    align: "center",
  },
  {
    id: "duration",
    header: "Duration",
    align: "center",
    flexGrow: 1,
  },
  {
    id: "action",
    header: "",
    width: 50,
    align: "center",
  },
];

export const links: Link[] = [
    { id: 1, source: 3, target: 4, type: "e2s" },
    { id: 2, source: 1, target: 2, type: "e2s" },
    { id: 21, source: 8, target: 1, type: "s2s" },
    { id: 22, source: 1, target: 6, type: "s2s" },
];

export const scales: Scale[] = [
    { unit: "month", step: 1, format: "MMMM yyy" },
    { unit: "day", step: 1, format: "d" },
];

export const getGanttData = () => ({
  tasks,
  links,
  scales,
  columns
});