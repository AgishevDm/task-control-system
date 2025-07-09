import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Project } from '../../types/project';
import { Task as TaskType } from '../../types/task';
import { TasksApi } from '../../api/tasks.api';
import './styles/analytics.scss';
import { Card, Spin, Row, Col, Statistic, List, Avatar } from 'antd';
import {
  PieChart, Pie, Cell, Tooltip as RechartTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';

const STATUS_COLORS = { todo: '#8884d8', in_progress: '#ffa500', done: '#4caf50' };
const PRIORITY_COLORS = { low: '#4caf50', medium: '#ffc107', high: '#f44336' };

export const Analytics = () => {
  const project = useOutletContext<Project>();
  const [tasks, setTasks] = useState<TaskType[] | null>(null);

  useEffect(() => {
    TasksApi.getProjectTasks(project.primarykey)
      .then(setTasks)
      .catch(console.error);
  }, [project.primarykey]);

  if (!tasks) {
    return <div className="analytics-spinner"><Spin size="large" /></div>;
  }

  // Быстрые метрики
  const stats = {
    total: tasks.length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  // Статусы
  const statusData = ['todo', 'in_progress', 'done'].map((key) => ({
    name: key.replace('_', ' '),
    value: (stats as any)[key]
  }));

  // Приоритеты
  const prioCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});
  const priorityData = [
    { name: 'High', value: prioCounts.high || 0 },
    { name: 'Medium', value: prioCounts.medium || 0 },
    { name: 'Low', value: prioCounts.low || 0 }
  ];

  // Кумулятивно закрытые задачи по дате
  const closedDates = tasks
    .filter((t): t is TaskType & { updatedAt: string } => t.status === 'done' && typeof (t as any).updatedAt === 'string')
    .map((t: any) => t.updatedAt)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const closedOverTime = closedDates.reduce<{ date: string; count: number }[]>((arr, d) => {
    const date = new Date(d).toLocaleDateString();
    const last = arr[arr.length - 1];
    if (last && last.date === date) last.count++;
    else arr.push({ date, count: 1 });
    return arr;
  }, []);

  closedOverTime.forEach((_, i, arr) => {
    if (i > 0) arr[i].count += arr[i - 1].count;
  });

  // Роли участников
  const roleCounts = project.ProjectMember.reduce<Record<string, number>>((acc, m) => {
    const name = m.role.name;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

  // Недавние изменения
  const recent = tasks
    .filter((t): t is TaskType & { updatedAt: string } => typeof (t as any).updatedAt === 'string')
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="analytics-container">
      {/* Быстрые метрики */}
      <Row gutter={16} className="stats-row">
        <Col span={4}><Card><Statistic title="Участников" value={project.ProjectMember.length} /></Card></Col>
        <Col span={4}><Card><Statistic title="Команд" value={project.teams.length} /></Card></Col>
        <Col span={4}><Card><Statistic title="Всего задач" value={stats.total} /></Card></Col>
        <Col span={4}><Card><Statistic title="Просрочено" value={stats.overdue} valueStyle={{ color: 'red' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="Длительность" value={`${Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 3600 * 24))} дней`} /></Card></Col>
      </Row>

      {/* Диаграммы */}
      <Row gutter={16} className="charts-row">
        <Col span={8}>
          <Card title="Статусы задач">
            <PieChart width={250} height={200}>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={60} label>
                {statusData.map((_, i) => <Cell key={i} fill={Object.values(STATUS_COLORS)[i]} />)}
              </Pie>
              <RechartTooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Приоритеты задач">
            <BarChart width={250} height={200} data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <RechartTooltip />
              <Bar dataKey="value">
                {priorityData.map((_, i) => <Cell key={i} fill={Object.values(PRIORITY_COLORS)[i]} />)}
              </Bar>
            </BarChart>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Распределение ролей">
            <PieChart width={250} height={200}>
              <Pie data={roleData} dataKey="value" nameKey="name" outerRadius={60} label />
              <RechartTooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </Card>
        </Col>
      </Row>

      {/* Линия закрытых задач */}
      <Card title="Кумулятивно закрытые задачи" className="line-chart-card">
        <LineChart width={800} height={250} data={closedOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <RechartTooltip />
          <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </Card>

      {/* Последние изменения */}
      <Card title="Последние изменения" className="recent-card">
        <List
          dataSource={recent}
          renderItem={t => (
            <List.Item>
              <List.Item.Meta
                avatar={t.assigned?.avatarUrl && <Avatar src={t.assigned.avatarUrl} />}
                title={t.title}
                description={`Обновлено: ${new Date((t as any).updatedAt).toLocaleString()}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};
