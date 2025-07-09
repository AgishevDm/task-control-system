import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Gantt, Willow, Link, Task as GanttTask, Column, GanttApi } from 'wx-react-gantt';
import 'wx-react-gantt/dist/gantt.css';
import {
  Drawer,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Space,
  Slider,
  ConfigProvider
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import ru_RU from 'antd/lib/locale/ru_RU';
import dayjs, { Dayjs } from 'dayjs';
import { nanoid } from 'nanoid';
import { MilestonesApi } from '../../api/milestones';
import { TasksApi } from '../../api/tasks.api';
import './styles/gantt.css';

const { RangePicker } = DatePicker;
type Priority = 'High' | 'Medium' | 'Low';
type Status   = 'NotStarted' | 'InProgress' | 'Completed';

interface ExtendedTask extends GanttTask {
  description: string;
  status:      Status;
  priority:    Priority;
  assignee?:   string;
}

const columns: Column[] = [
  { id: 'text',     header: 'Задача',      flexGrow: 2 },
  {
    id: 'assignee', header: 'Исполнитель', width: 120,
    template: task => (task as ExtendedTask).assignee ?? '—'
  },
  {
    id: 'dates', header: 'Даты', width: 180,
    template: task => {
      const t = task as ExtendedTask;
      
      if (t.type === 'summary') {
        return dayjs(t.start).format('YYYY-MM-DD');
      }
      
      const start = dayjs(t.start).format('YYYY-MM-DD');
      const end = t.end ? dayjs(t.end).format('YYYY-MM-DD') : '—';
      return `${start} – ${end}`;
    }
  },
  {
    id: 'status',   header: 'Статус',      width: 120,
    template: task => {
      const t = task as ExtendedTask;
      return t.status === 'Completed'
        ? '✅ Завершено'
        : t.status === 'InProgress'
          ? '🔄 В работе'
          : '🕒 Не начато';
    }
  }
];

const scales = [
  { unit: 'month', step: 1, format: 'yyyy-MM' },
  { unit: 'day',   step: 1, format: 'dd' }
];

const GantPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const apiRef = useRef<GanttApi|null>(null);
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ExtendedTask|null>(null);
  const [store, setStore] = useState<any>(null);
  const [form] = Form.useForm();

  // Загрузка данных
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const [ms, ts] = await Promise.all([
        MilestonesApi.getByProject(projectId),
        TasksApi.getProjectTasks(projectId),
      ]);

      const summary = ms.map(m => ({
        id: m.id,
        text: m.title,
        start: dayjs(m.date).toDate(),
        duration: dayjs(m.dateEnd).diff(dayjs(m.date), 'day'),
        progress: m.status === 'Achieved' ? 100 : 0,
        type: 'summary',
        parent: 0,
        open: false,
        priority: 'Medium' as Priority,
        status:   m.status === 'Achieved' ? 'Completed' : 'NotStarted' as Status,
        description: m.description || '',
      }));

      const detail = ts.map(t => ({
        id: t.primarykey,
        text: t.title,
        start: new Date(t.startDate!),
        end:   new Date(t.endDate!),
        duration: t.endDate
          ? dayjs(t.endDate).diff(dayjs(t.startDate), 'day')
          : 0,
        progress: t.status === 'done' ? 100 : 0,
        type: 'task',
        parent: t.milestoneId,
        priority: (t.priority.charAt(0).toUpperCase() + t.priority.slice(1)) as Priority,
        status:   t.status === 'done'
                    ? 'Completed'
                    : t.status === 'in_progress'
                      ? 'InProgress'
                      : 'NotStarted' as Status,
        description: t.description || '',
        assignee: t.assigned?.name,
      }));

      setTasks([...summary, ...detail]);
      setLinks([]);

      // Настройка перехватчика событий после рендеринга
      setTimeout(() => {
        if (apiRef.current) {
          const api = apiRef.current;
          
          // Приведение типа для доступа к getState()
          const state = (api as any).getState();
          setStore(state.tasks);

          // Перехват события открытия редактора
          api.intercept("show-editor", (data) => {
            const task = state.tasks.byId[data.id];
            if (task) {
              openEditDrawer(task as ExtendedTask);
            }
            return false; // Блокируем стандартный редактор
          });
        }
      }, 100);
    })();
  }, [projectId]);

  // Обработчик действий формы
  const handleFormAction = useCallback((action: string, data?: any) => {
    if (!apiRef.current || !editingTask) return;

    switch (action) {
      case "update-task":
        apiRef.current.exec("update-task", {
          ...editingTask,
          ...data
        });
        break;
        
      case "delete-task":
        apiRef.current.exec("delete-task", editingTask.id);
        break;
        
      case "close-form":
        setDrawerOpen(false);
        break;
    }
  }, [editingTask]);

  // Открыть редактор (задача или веха)
  const openEditDrawer = useCallback((task: ExtendedTask) => {
    setEditingTask(task);
    const values: any = { 
      text: task.text, 
      description: task.description, 
      type: task.type 
    };
    
    if (task.type === 'summary') {
      // Для вех используем только дату начала
      values.range = [dayjs(task.start), dayjs(task.start)];
    } else {
      values.start = dayjs(task.start);
      values.end = task.end ? dayjs(task.end) : dayjs(task.start);
      values.status = task.status;
      values.priority = task.priority;
      values.assignee = task.assignee;
      values.progress = task.progress;
    }
    
    form.setFieldsValue(values);
    setDrawerOpen(true);
  }, [form]);

  // Открыть форму добавления
  const openAddDrawer = useCallback((type: 'task' | 'summary') => {
    setEditingTask(null);
    form.resetFields();
    if (type === 'summary') {
      form.setFieldsValue({ type, text: '', description: '', range: [dayjs(), dayjs().add(1, 'day')] });
    } else {
      form.setFieldsValue({
        type,
        text: '',
        description: '',
        start: dayjs(),
        end:   dayjs().add(1, 'day'),
        status:   'NotStarted',
        priority: 'Medium',
        assignee: '',
        progress: 0,
      });
    }
    setDrawerOpen(true);
  }, [form]);

  // Сохранить (создать или обновить)
  const handleSave = useCallback(async () => {
    try {
      const vals = await form.validateFields();
      const base = { title: vals.text, description: vals.description };

      if (vals.type === 'summary') {
        const [startDt, endDt] = (vals.range as Dayjs[]).map(d => d.toDate());

        if (editingTask) {
          // Обновление вехи
          await updateMilestone({
            ...editingTask,
            text: vals.text,
            description: vals.description,
            start: startDt,
            end: endDt,
          } as ExtendedTask);
          
          handleFormAction("update-task", {
            text: vals.text,
            description: vals.description,
            start: startDt,
            end: endDt
          });
        } else {
          // Создание вехи
          const created = await MilestonesApi.create({
            projectId: projectId!,
            ...base,
            date: startDt.toISOString(),
            dateEnd: endDt.toISOString(),
            status: 'Planned'
          });

          // Добавляем новую веху в Gantt
          const newMilestone = {
            id: created.id,
            text: created.title,
            start: new Date(created.date),
            end: new Date(created.dateEnd),
            duration: 0,
            progress: 0,
            type: 'summary',
            parent: 0,
            open: false,
            priority: 'Medium',
            status: 'NotStarted',
            description: created.description || ''
          };
          
          setTasks(ts => [...ts, newMilestone as ExtendedTask]);
          apiRef.current?.exec("add-task", newMilestone);
        }
      } else {
        const startDt = (vals.start as Dayjs).toDate();
        const endDt = (vals.end as Dayjs).toDate();
        const nt = {
          id: editingTask?.id ?? nanoid(),
          text: vals.text,
          description: vals.description,
          start: startDt,
          end: endDt,
          duration: dayjs(endDt).diff(dayjs(startDt), 'day'),
          progress: vals.progress,
          type: 'task',
          parent: editingTask?.parent ?? 0,
          priority: vals.priority,
          status: vals.status,
          assignee: vals.assignee,
        };

        if (editingTask) {
          // Обновление задачи
          await TasksApi.updateTask(nt.id as string, {
            title: nt.text,
            description: nt.description,
            startDate: nt.start,
            endDate: nt.end,
            status: nt.status.toLowerCase(),
            priority: nt.priority.toLowerCase(),
            assigned: nt.assignee ?? undefined,
            milestoneId: nt.parent as string
          });
          
          handleFormAction("update-task", nt);
        } else {
          // Создание задачи
          const created = await TasksApi.createTask({
            title: nt.text,
            description: nt.description,
            startDate: nt.start,
            endDate: nt.end,
            status: nt.status.toLowerCase(),
            priority: nt.priority.toLowerCase(),
            assigned: nt.assignee ?? undefined,
            milestoneId: nt.parent as string,
            project: projectId!,
            type: 'Задача',
            color: '',
            stage: ''
          });

          const newTask = { ...nt, id: created.primarykey };
          setTasks(ts => [...ts, newTask as ExtendedTask]);
          apiRef.current?.exec("add-task", newTask);
        }
      }

      setDrawerOpen(false);
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
    }
  }, [editingTask, form, projectId, handleFormAction]);

  const deleteMilestone = useCallback(async (milestoneId: string) => {
    try {
      await MilestonesApi.delete(milestoneId);
      setTasks(tasks => tasks.filter(t => 
        !(t.id === milestoneId || t.parent === milestoneId)
      ));
      apiRef.current?.exec("delete-task", milestoneId);
    } catch (error) {
      console.error('Ошибка при удалении вехи:', error);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!editingTask) return;
    
    if (editingTask.type === 'summary') {
      await deleteMilestone(editingTask.id as string);
    } else {
      await TasksApi.deleteTask(editingTask.id as string);
      handleFormAction("delete-task");
    }
    
    setDrawerOpen(false);
  }, [editingTask, deleteMilestone, handleFormAction]);

  const updateMilestone = useCallback(async (m: ExtendedTask) => {
    try {
      const { id, text, description, start, end } = m;
      
      await MilestonesApi.update(id as string, {
        title: text,
        description,
        date: (start as Date).toISOString(),
        dateEnd: (end as Date).toISOString(),
      });

      handleFormAction("update-task", {
        text, 
        description, 
        start, 
        end,
        duration: dayjs(end).diff(dayjs(start), 'day')
      });
    } catch (error) {
      console.error('Ошибка при обновлении вехи:', error);
    }
  }, [handleFormAction]);

  useEffect(() => {
    const handleResize = () => {
      apiRef.current?.exec('resize', {});
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    form.resetFields();
  }, [form]);

  return (
    <ConfigProvider locale={ru_RU}>
      <Willow>
        <div className="gantt-container">
          <Space style={{ margin: 16 }}>
            <Button icon={<PlusOutlined />} onClick={() => openAddDrawer('task')}>Добавить задачу</Button>
            <Button icon={<PlusOutlined />} onClick={() => openAddDrawer('summary')}>Добавить веху</Button>
          </Space>
          <Gantt
            apiRef={apiRef}
            tasks={tasks}
            links={links}
            columns={columns}
            scales={scales}
            key={`gantt-${tasks.length}-${links.length}`}
            zoom
            highlightTime={(date, unit) => {
              if (unit === 'day') {
                const today = new Date();
                if (date.toDateString() === today.toDateString()) return 'wx-today';
                if ([0,6].includes(date.getDay())) return 'wx-weekend';
              }
              return '';
            }}
          />

          <Drawer
            title={editingTask ? (editingTask.type === 'summary' ? 'Редактировать веху' : 'Редактировать задачу') : 'Новый элемент'}
            open={drawerOpen}
            onClose={closeDrawer}
            width={400}
            destroyOnClose
          >
            <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ type: 'task' }}>
              <Form.Item name="type" noStyle>
                <Input type="hidden" />
              </Form.Item>

              <Form.Item name="text" label="Название" rules={[{ required: true }]}>
                <Input prefix={<EditOutlined />} />
              </Form.Item>

              <Form.Item name="description" label="Описание">
                <Input.TextArea />
              </Form.Item>

              {/* Поля для вехи */}
              <Form.Item shouldUpdate={(prev, curr) => prev.type !== curr.type} noStyle>
                {() => form.getFieldValue('type') === 'summary' && (
                  <Form.Item name="range" label="Период" rules={[{ required: true }]}>  
                    <RangePicker />
                  </Form.Item>
                )}
              </Form.Item>

              {/* Поля для задачи */}
              <Form.Item shouldUpdate={(prev, curr) => prev.type !== curr.type} noStyle>
                {() => form.getFieldValue('type') === 'task' && (
                  <>
                    <Form.Item name="start" label="Дата начала" rules={[{ required: true }]}>
                      <DatePicker />
                    </Form.Item>
                    <Form.Item name="end" label="Дата окончания" rules={[{ required: true }]}>
                      <DatePicker />
                    </Form.Item>
                    <Form.Item name="status" label="Статус" rules={[{ required: true }]}>
                      <Select>
                        <Select.Option value="NotStarted">Не начато</Select.Option>
                        <Select.Option value="InProgress">В работе</Select.Option>
                        <Select.Option value="Completed">Завершено</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="priority" label="Приоритет" rules={[{ required: true }]}>  
                      <Select>
                        <Select.Option value="High">Высокий</Select.Option>
                        <Select.Option value="Medium">Средний</Select.Option>
                        <Select.Option value="Low">Низкий</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="assignee" label="Исполнитель">
                      <Input />
                    </Form.Item>
                    <Form.Item name="progress" label="Прогресс">
                      <Slider min={0} max={100} />
                    </Form.Item>
                  </>
                )}
              </Form.Item>

              <Form.Item>
                <Space style={{ float: 'right' }}>
                  {editingTask && (
                    <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>Удалить</Button>
                  )}
                  <Button type="primary" htmlType="submit">Сохранить</Button>
                </Space>
              </Form.Item>
            </Form>
          </Drawer>
        </div>
      </Willow>
    </ConfigProvider>
  );
};

export default React.memo(GantPage);