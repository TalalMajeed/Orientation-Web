import "server-only";

import { getMongoDb } from "@/lib/mongo";
import { allocate } from "@/services/liaison/allocate";
import { seedHouses } from "@/services/liaison/seed";
import type { Config, House, LiaisonState, LogEntry, Student } from "@/services/liaison/types";

const COLLECTION_NAME = "liaison_state";
const STATE_ID = "current";

export const MAX_STUDENTS = 20000;

export class LiaisonValidationError extends Error {}

interface LiaisonStateDoc extends LiaisonState {
  _id: string;
  updatedAt: Date;
}

export function defaultState(): LiaisonState {
  return {
    houses: seedHouses(),
    students: [],
    config: { houseCapacity: null },
    log: [],
    allocated: false,
  };
}

async function collection() {
  const db = await getMongoDb();

  return db.collection<LiaisonStateDoc>(COLLECTION_NAME);
}

export async function readState(): Promise<LiaisonState> {
  const docs = await collection();
  const doc = await docs.findOne({ _id: STATE_ID });

  if (!doc) {
    return defaultState();
  }

  const { houses, students, config, log, allocated } = doc;

  return { houses, students, config, log, allocated };
}

async function writeState(state: LiaisonState): Promise<LiaisonState> {
  const docs = await collection();

  await docs.updateOne(
    { _id: STATE_ID },
    { $set: { ...state, updatedAt: new Date() } },
    { upsert: true }
  );

  return state;
}

async function mutate(
  transform: (state: LiaisonState) => LiaisonState
): Promise<LiaisonState> {
  return writeState(transform(await readState()));
}

export async function resetState(): Promise<LiaisonState> {
  return writeState(defaultState());
}

export async function setConfig(patch: Partial<Config>): Promise<LiaisonState> {
  return mutate((state) => ({
    ...state,
    config: { ...state.config, ...patch },
  }));
}

export async function reseedHouses(): Promise<LiaisonState> {
  return mutate((state) => ({ ...state, houses: seedHouses() }));
}

export async function updateHouse(
  houseId: string,
  patch: { ol?: string }
): Promise<LiaisonState> {
  return mutate((state) => {
    if (!state.houses.some((house) => house.id === houseId)) {
      throw new LiaisonValidationError(`No house found for id ${houseId}`);
    }

    return {
      ...state,
      houses: state.houses.map((house) =>
        house.id === houseId ? { ...house, ...patch } : house
      ),
    };
  });
}

export async function updateOg(
  houseId: string,
  ogId: string,
  name: string
): Promise<LiaisonState> {
  return mutate((state) => {
    const house = state.houses.find((candidate) => candidate.id === houseId);

    if (!house) {
      throw new LiaisonValidationError(`No house found for id ${houseId}`);
    }

    if (!house.ogs.some((og) => og.id === ogId)) {
      throw new LiaisonValidationError(`No OG found for id ${ogId}`);
    }

    return {
      ...state,
      houses: state.houses.map((candidate) =>
        candidate.id === houseId
          ? {
              ...candidate,
              ogs: candidate.ogs.map((og) => (og.id === ogId ? { ...og, name } : og)),
            }
          : candidate
      ),
    };
  });
}

export async function replaceStudents(
  students: Student[],
  log: LogEntry[]
): Promise<LiaisonState> {
  if (students.length > MAX_STUDENTS) {
    throw new LiaisonValidationError(`A batch cannot exceed ${MAX_STUDENTS} students`);
  }

  return mutate((state) => ({
    ...state,
    students,
    log,
    allocated: false,
  }));
}

export async function runAllocation(students?: Student[]): Promise<LiaisonState> {
  if (students && students.length > MAX_STUDENTS) {
    throw new LiaisonValidationError(`A batch cannot exceed ${MAX_STUDENTS} students`);
  }

  return mutate((state) => {
    const roster = students ?? state.students;
    const result = allocate(roster, state.houses, state.config);

    return {
      ...state,
      students: result.students,
      log: result.log,
      allocated: true,
    };
  });
}

export async function resetAllocation(): Promise<LiaisonState> {
  return mutate((state) => ({
    ...state,
    students: state.students.map((student) => ({
      ...student,
      houseId: null,
      ogId: null,
    })),
    allocated: false,
  }));
}

export type { House, LiaisonState };
