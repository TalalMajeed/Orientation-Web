export type Gender = "male" | "female";

export type Student = {
  id: string;
  name: string;
  cmsId: string;
  department: string;
  gender: Gender;
  merit: number | null;
  houseId: string | null;
  ogId: string | null;
};

export type OG = {
  id: string;
  name: string;
  group: number;
};

export type House = {
  id: string;
  name: string;
  ol: string;
  color: string;
  ogs: OG[];
};

export type Config = {
  houseCapacity: number | null;
};

export type LogEntry = {
  type: "duplicate" | "incomplete" | "overflow" | "info";
  row: number | null;
  message: string;
};

export type LiaisonState = {
  houses: House[];
  students: Student[];
  config: Config;
  log: LogEntry[];
  allocated: boolean;
};
