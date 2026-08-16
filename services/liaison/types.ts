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

// An OG leads one group within a house (e.g. "Vikings 1").
export type OG = {
  id: string;
  name: string; // the OG person's name
  group: number; // group number within the house
};

export type House = {
  id: string;
  name: string; // e.g. "Vikings"
  ol: string; // Orientation Leader (head of the house)
  color: string;
  ogs: OG[];
};

export type Config = {
  houseCapacity: number | null; // max students per house; null = unlimited
};

export type LogEntry = {
  type: "duplicate" | "incomplete" | "overflow" | "info";
  row: number | null; // source row number (1-based, incl. header)
  message: string;
};

/** The whole liaison workspace, persisted as one document. */
export type LiaisonState = {
  houses: House[];
  students: Student[];
  config: Config;
  log: LogEntry[];
  allocated: boolean;
};
