// src/screens/Projects/Milestones.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Space,
  Spin,
  List,
  Tag,
  Card,
  Tabs,
  Timeline,
  Avatar,
  Progress as AntProgress,
  Tooltip as AntTooltip,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileOutlined,
  CommentOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { MilestonesApi } from '../../api/milestones';
import { Milestone } from '../../types/milestone';
import { Task as TaskType } from '../../types/task';
import './styles/milestones.scss';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const { TabPane } = Tabs;
const statusOptions = [
  { label: 'Запланировано', value: 'Planned' },
  { label: 'Достигнуто', value: 'Achieved' },
  { label: 'Просрочено', value: 'Missed' }
];

const STATUS_COLORS = { todo: '#8884d8', in_progress: '#ffa500', done: '#4caf50' };
const PRIORITY_COLORS = { low: '#4caf50', medium: '#ffc107', high: '#f44336' };

function computePercent(task: TaskType) {
  const start = dayjs(task.startDate);
  const end = dayjs(task.endDate);
  const now = dayjs();
  if (!start || !end || now.isBefore(start)) return 0;
  const total = end.diff(start);
  const elapsed = now.diff(start);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function StatusPie({ tasks }: { tasks: TaskType[] }) {
  const counts = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status]||0)+1; return acc }, {} as Record<string,number>);
  const data = [
    { name:'To Do', value:counts.todo||0 },
    { name:'In Progress', value:counts.in_progress||0 },
    { name:'Done', value:counts.done||0 }
  ];
  return (
    <PieChart width={300} height={200}>
      <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label>
        {data.map((e,i)=><Cell key={i} fill={Object.values(STATUS_COLORS)[i]}/>)}
      </Pie>
      <Tooltip />
      <Legend verticalAlign="bottom" height={36}/>
    </PieChart>
  );
}

function PriorityBar({ tasks }: { tasks: TaskType[] }) {
  const counts = tasks.reduce((acc, t) => { acc[t.priority] = (acc[t.priority]||0)+1; return acc }, {} as Record<string,number>);
  const data = [
    { priority:'High', count:counts.high||0 },
    { priority:'Medium', count:counts.medium||0 },
    { priority:'Low', count:counts.low||0 }
  ];
  return (
    <BarChart width={350} height={200} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="priority" />
      <YAxis allowDecimals={false}/>
      <Tooltip />
      <Bar dataKey="count" fill="#8884d8"/>
    </BarChart>
  );
}

function MilestoneProgress({ tasks }: { tasks: TaskType[] }) {
  const doneCount = tasks.filter(t=>t.status==='done').length;
  const percent = tasks.length ? Math.round((doneCount/tasks.length)*100) : 0;
  return <AntProgress type="circle" percent={percent} width={120}/>;
}

export default function Milestones() {
  const { projectId } = useParams();
  const [items, setItems] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone|null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<Milestone|null>(null);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async()=>{
    if(!projectId) return;
    setLoading(true);
    try{ setItems(await MilestonesApi.getByProject(projectId)); }
    finally{ setLoading(false); }
  },[projectId]);

  useEffect(()=>{ load() },[load]);

  const loadTasks = useCallback(async(id:string)=>{
    setTasksLoading(true);
    try{ setTasks(await MilestonesApi.getByMilestone(id)); }
    finally{ setTasksLoading(false); }
  },[]);

  const openForm = useCallback((m?:Milestone)=>{
    setEditing(m||null);
    form.resetFields();
    form.setFieldsValue(m ? {
      title:m.title,
      description:m.description,
      date:dayjs(m.date),
      dateEnd:dayjs(m.dateEnd),
      status:m.status
    } : {
      title:'',description:'',date:dayjs(),dateEnd:dayjs(),status:'Planned'
    });
    setFormOpen(true);
  },[form]);

  const closeForm = ()=>setFormOpen(false);
  const handleSave = async ()=>{
    const vals = await form.validateFields();
    const payload = {
      title:vals.title,
      description:vals.description,
      date:(vals.date as Dayjs).toISOString(),
      dateEnd:(vals.dateEnd as Dayjs).toISOString(),
      status:vals.status
    };
    if(payload.dateEnd<payload.date){
      Modal.warning({title:'Некорректные даты',content:'Окончание до начала'});
      return;
    }
    if(editing) await MilestonesApi.update(editing.id,payload);
    else await MilestonesApi.create({...payload,projectId:projectId!});
    closeForm(); load();
  };

  const handleDelete = async(id:string)=>{
    await MilestonesApi.delete(id); load();
  };

  const openDetails = (m:Milestone)=>{ setSelected(m); setDetailsOpen(true); loadTasks(m.id) };
  const closeDetails = ()=>setDetailsOpen(false);

  const columns = [
    { title:'Название',dataIndex:'title',key:'title' },
    { title:'Дата начала',dataIndex:'date',key:'date',render:(d:string)=>dayjs(d).format('DD.MM.YYYY') },
    { title:'Дата окончания',dataIndex:'dateEnd',key:'dateEnd',render:(d:string)=>dayjs(d).format('DD.MM.YYYY') },
    { title:'Статус',dataIndex:'status',key:'status',render:(s:string)=><Tag color={s==='Achieved'?'green':s==='Missed'?'red':'blue'}>{s}</Tag> },
    { title:'Описание',dataIndex:'description',key:'description' },
    { title:'Действия',key:'actions',width:120,render:(_:any,rec:Milestone)=>(
      <Space onClick={e => e.stopPropagation()}>
        <Button icon={<EditOutlined/>} size="small" onClick={e=>{e.stopPropagation();openForm(rec)}}/>
        <Popconfirm title="Удалить веху?" onConfirm={()=>handleDelete(rec.id)}>
          <Button icon={<DeleteOutlined/>} size="small" danger/>
        </Popconfirm>
      </Space>
    )}
  ];

  return (
    <div className="milestones-page">
      <Space className="header-bar">
        <h2>Вехи проекта</h2>
        <Button type="primary" icon={<PlusOutlined/>} onClick={()=>openForm()}>
          Добавить веху
        </Button>
      </Space>
      {loading ? <div className="spin-wrapper"><Spin/></div> : (
        <Table
          rowKey="id"
          dataSource={items}
          columns={columns}
          pagination={false}
          className="milestones-table"
          onRow={rec=>({onClick:()=>openDetails(rec)})}
        />
      )}

      {/* Form Modal */}
      <Modal open={formOpen} title={editing?'Редактировать веху':'Новая веха'} onCancel={closeForm} footer={null} width="70vw" style={{top:20}}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="title" label="Название" rules={[{required:true}]}><Input/></Form.Item>
          <Form.Item name="description" label="Описание"><Input.TextArea rows={4}/></Form.Item>
          <Form.Item name="date" label="Плановая дата" rules={[{required:true}]}><DatePicker/></Form.Item>
          <Form.Item name="dateEnd" label="Окончание окна"><DatePicker/></Form.Item>
          <Form.Item name="status" label="Статус" rules={[{required:true}]}><Select options={statusOptions}/></Form.Item>
          <Form.Item><Space style={{float:'right'}}><Button onClick={closeForm}>Отмена</Button><Button type="primary" htmlType="submit">Сохранить</Button></Space></Form.Item>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal open={detailsOpen} onCancel={closeDetails} footer={null} width="80vw" style={{top:10}} bodyStyle={{overflow:'auto',height:'calc(90vh-55px)'}}>
        {selected && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="Обзор" key="1">
              <div className="overview-grid">
                <Card title="Прогресс"><MilestoneProgress tasks={tasks}/></Card>
                <Card title="Статусы"><StatusPie tasks={tasks}/></Card>
                <Card title="Приоритеты"><PriorityBar tasks={tasks}/></Card>
              </div>
              <Card title="Описание" style={{marginTop:16}}><p>{selected.description}</p></Card>
            </TabPane>
            <TabPane tab="Задачи" key="2">
              {tasksLoading?<Spin/>:(
                <div className="tasks-columns">
                  {['todo','in_progress','done'].map(status=>{
                    const list = tasks.filter(t=>t.status===status);
                    return (
                      <Card key={status} title={status.replace('_',' ')} style={{margin:'0 8px',flex:1}}>
                        <List
                          dataSource={list}
                          renderItem={task=>(
                            <List.Item actions={[
                              <span><FileOutlined/> {task.attachmentsCount||0}</span>,
                              <span><CommentOutlined/> {task.commentsCount||0}</span>
                            ]}>
                              <List.Item.Meta
                                avatar={task.assigned?.avatarUrl&&<Avatar src={task.assigned.avatarUrl}/>}  
                                title={<AntTooltip title={task.description||''}>{task.title}</AntTooltip>}
                                description={<><Tag color={PRIORITY_COLORS[task.priority]}>{task.priority}</Tag><Tag>{task.type}</Tag></>}
                              />
                              <AntProgress percent={computePercent(task)} size="small" style={{width:80}}/>
                            </List.Item>
                          )}
                        />
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabPane>
            <TabPane tab="Комментарии" key="3">Пока нет комментариев</TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
}
