import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Employee2 {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  position: string;

  @Column()
  department: string;
}
