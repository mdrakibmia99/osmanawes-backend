export interface IDaySchedule {
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export interface IOpeningHour {
  _id?: string;
  sat: IDaySchedule;
  sun: IDaySchedule;
  mon: IDaySchedule;
  tue: IDaySchedule;
  wed: IDaySchedule;
  thu: IDaySchedule;
  fri: IDaySchedule;
  createdAt?: Date;
  updatedAt?: Date;
}
