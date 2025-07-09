import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  logo: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column('simple-json')
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;

  @Column()
  status: 'В работе' | 'Завершен' | 'Приостановлен';

  @Column('simple-json')
  teams: Array<{
    id: string;
    name: string;
    members: Array<{
      id: string;
      name: string;
      role: string;
    }>;
  }>;
}