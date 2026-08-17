import "server-only";

import { randomUUID } from "crypto";

import { getMongoDb } from "@/lib/mongo";
import { isTransientMailError, sendMail } from "@/services/email/graph";
import { renderBodyHtml, renderSubject } from "@/services/email/template";

const COLLECTION_NAME = "email_campaigns";
const CAMPAIGN_ID = "current";

export const CAMPAIGN_SENDER = process.env.MS_GRAPH_SENDER ?? "info@orientation.nust.edu.pk";

export const MAX_RECIPIENTS = 5000;
export const MAX_COLUMNS = 25;
export const MAX_SUBJECT = 300;
export const MAX_BODY = 20000;
export const MAX_CELL = 300;
export const MAX_SHEET_BYTES = 6_000_000;

const MAX_SKIPPED_STORED = 500;
const MAX_FAILURES_STORED = 500;

const SEND_INTERVAL_MS = Number(process.env.EMAIL_SEND_INTERVAL_MS ?? 2000);
const MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 4000;
const MAX_CONSECUTIVE_FAILURES = 25;
const STALE_AFTER_MS = 90_000;

export class EmailValidationError extends Error {}

export type CampaignStatus = "draft" | "running" | "cancelled" | "completed" | "failed";

export interface Recipient {
  email: string;
  values: Record<string, string>;
}

export interface SkippedRow {
  row: number;
  value: string;
  reason: string;
}

export interface Failure {
  email: string;
  error: string;
}

export interface Campaign {
  fileName: string;
  columns: string[];
  recipients: Recipient[];
  skipped: SkippedRow[];
  subject: string;
  body: string;
  status: CampaignStatus;
  total: number;
  cursor: number;
  sent: number;
  failed: number;
  failures: Failure[];
  error: string | null;
  startedAt: number | null;
  finishedAt: number | null;
}

export type Progress = Omit<Campaign, "fileName" | "columns" | "recipients" | "skipped">;

interface CampaignDoc extends Campaign {
  _id: string;
  runId: string | null;
  cancelRequested: boolean;
  heartbeatAt: Date | null;
  updatedAt: Date;
}

export interface SheetInput {
  fileName: string;
  columns: string[];
  recipients: Recipient[];
  skipped: SkippedRow[];
}

const runsInThisProcess = new Set<string>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emptyCampaign(): Campaign {
  return {
    fileName: "",
    columns: [],
    recipients: [],
    skipped: [],
    subject: "",
    body: "",
    status: "draft",
    total: 0,
    cursor: 0,
    sent: 0,
    failed: 0,
    failures: [],
    error: null,
    startedAt: null,
    finishedAt: null,
  };
}

async function collection() {
  const db = await getMongoDb();

  return db.collection<CampaignDoc>(COLLECTION_NAME);
}

function toCampaign(doc: CampaignDoc | null): Campaign {
  const empty = emptyCampaign();

  if (!doc) {
    return empty;
  }

  return {
    fileName: doc.fileName ?? empty.fileName,
    columns: doc.columns ?? empty.columns,
    recipients: doc.recipients ?? empty.recipients,
    skipped: doc.skipped ?? empty.skipped,
    subject: doc.subject ?? empty.subject,
    body: doc.body ?? empty.body,
    status: doc.status ?? empty.status,
    total: doc.total ?? empty.total,
    cursor: doc.cursor ?? empty.cursor,
    sent: doc.sent ?? empty.sent,
    failed: doc.failed ?? empty.failed,
    failures: doc.failures ?? empty.failures,
    error: doc.error ?? null,
    startedAt: doc.startedAt ?? null,
    finishedAt: doc.finishedAt ?? null,
  };
}

function toProgress(campaign: Campaign): Progress {
  return {
    subject: campaign.subject,
    body: campaign.body,
    status: campaign.status,
    total: campaign.total,
    cursor: campaign.cursor,
    sent: campaign.sent,
    failed: campaign.failed,
    failures: campaign.failures,
    error: campaign.error,
    startedAt: campaign.startedAt,
    finishedAt: campaign.finishedAt,
  };
}

function isAbandoned(doc: Pick<CampaignDoc, "runId" | "heartbeatAt">): boolean {
  if (doc.runId && runsInThisProcess.has(doc.runId)) {
    return false;
  }

  return (
    !doc.heartbeatAt || Date.now() - new Date(doc.heartbeatAt).getTime() > STALE_AFTER_MS
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message.slice(0, 300);
  }

  return String(error).slice(0, 300);
}

export async function readCampaign(): Promise<Campaign> {
  const docs = await collection();

  return toCampaign(await docs.findOne({ _id: CAMPAIGN_ID }));
}

async function readControl(): Promise<CampaignDoc | null> {
  const docs = await collection();

  return docs.findOne(
    { _id: CAMPAIGN_ID },
    { projection: { recipients: 0, skipped: 0, failures: 0 } }
  );
}

async function assertNotRunning(): Promise<void> {
  const doc = await readControl();

  if (doc?.status === "running") {
    throw new EmailValidationError("A dispatch is already running — cancel it first");
  }
}

export async function saveSheet(input: SheetInput): Promise<Campaign> {
  await assertNotRunning();

  const docs = await collection();

  await docs.updateOne(
    { _id: CAMPAIGN_ID },
    {
      $set: {
        fileName: input.fileName,
        columns: input.columns,
        recipients: input.recipients,
        skipped: input.skipped.slice(0, MAX_SKIPPED_STORED),
        status: "draft" as CampaignStatus,
        total: input.recipients.length,
        cursor: 0,
        sent: 0,
        failed: 0,
        failures: [],
        error: null,
        runId: null,
        cancelRequested: false,
        heartbeatAt: null,
        startedAt: null,
        finishedAt: null,
        updatedAt: new Date(),
      },
      $setOnInsert: { subject: "", body: "" },
    },
    { upsert: true }
  );

  return readCampaign();
}

export async function saveDraft(subject: string, body: string): Promise<Progress> {
  await assertNotRunning();

  const docs = await collection();
  const defaults = emptyCampaign();

  delete (defaults as Partial<Campaign>).subject;
  delete (defaults as Partial<Campaign>).body;

  await docs.updateOne(
    { _id: CAMPAIGN_ID },
    {
      $set: { subject, body, updatedAt: new Date() },
      $setOnInsert: { ...defaults, runId: null, cancelRequested: false, heartbeatAt: null },
    },
    { upsert: true }
  );

  return readProgress();
}

export async function clearCampaign(): Promise<Campaign> {
  await assertNotRunning();

  const docs = await collection();

  await docs.deleteOne({ _id: CAMPAIGN_ID });

  return emptyCampaign();
}

export async function startDispatch(): Promise<Progress> {
  const doc = await readControl();

  if (!doc || !doc.total) {
    throw new EmailValidationError("Upload a recipient list before dispatching");
  }

  if (doc.status === "running") {
    throw new EmailValidationError("A dispatch is already running");
  }

  if (!doc.subject?.trim()) {
    throw new EmailValidationError("A subject is required");
  }

  if (!doc.body?.trim()) {
    throw new EmailValidationError("An email body is required");
  }

  const resuming =
    (doc.status === "cancelled" || doc.status === "failed") &&
    doc.cursor > 0 &&
    doc.cursor < doc.total;

  if (!resuming && doc.cursor >= doc.total) {
    throw new EmailValidationError("This list has already been dispatched — clear it to resend");
  }

  const runId = randomUUID();
  const docs = await collection();

  await docs.updateOne(
    { _id: CAMPAIGN_ID, status: { $ne: "running" } },
    {
      $set: {
        status: "running" as CampaignStatus,
        runId,
        cancelRequested: false,
        error: null,
        finishedAt: null,
        startedAt: Date.now(),
        heartbeatAt: new Date(),
        updatedAt: new Date(),
        ...(resuming ? {} : { cursor: 0, sent: 0, failed: 0, failures: [] }),
      },
    }
  );

  void runDispatch(runId);

  return readProgress();
}

export async function cancelDispatch(): Promise<Progress> {
  const docs = await collection();

  await docs.updateOne(
    { _id: CAMPAIGN_ID, status: "running" },
    { $set: { cancelRequested: true, updatedAt: new Date() } }
  );

  const doc = await readControl();

  if (doc?.status === "running" && isAbandoned(doc)) {
    await finishRun(doc.runId, "cancelled");
  }

  return readProgress();
}

export async function readProgress(): Promise<Progress> {
  const docs = await collection();
  const doc = await docs.findOne(
    { _id: CAMPAIGN_ID },
    { projection: { recipients: 0, skipped: 0 } }
  );

  if (doc?.status === "running" && doc.runId && isAbandoned(doc)) {
    void runDispatch(doc.runId);
  }

  return toProgress(toCampaign(doc));
}

async function finishRun(
  runId: string | null,
  status: CampaignStatus,
  error: string | null = null
): Promise<void> {
  const docs = await collection();

  await docs.updateOne(
    { _id: CAMPAIGN_ID, ...(runId ? { runId } : {}), status: "running" },
    {
      $set: {
        status,
        error,
        cancelRequested: false,
        finishedAt: Date.now(),
        heartbeatAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );
}

async function deliver(
  recipient: Recipient,
  subject: string,
  body: string
): Promise<string | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await sendMail({
        from: CAMPAIGN_SENDER,
        to: recipient.email,
        subject: renderSubject(subject, recipient.values),
        body: renderBodyHtml(body, recipient.values),
        contentType: "HTML",
      });

      return null;
    } catch (error) {
      if (attempt < MAX_ATTEMPTS && isTransientMailError(error)) {
        await sleep(RETRY_BACKOFF_MS * attempt);
        continue;
      }

      return errorMessage(error);
    }
  }

  return "Delivery failed";
}

async function runDispatch(runId: string): Promise<void> {
  if (runsInThisProcess.has(runId)) {
    return;
  }

  runsInThisProcess.add(runId);

  try {
    const docs = await collection();
    let cursor = -1;
    let consecutiveFailures = 0;

    for (;;) {
      const doc = await docs.findOne(
        { _id: CAMPAIGN_ID },
        { projection: { recipients: { $slice: [Math.max(cursor, 0), 1] } } }
      );

      if (!doc || doc.runId !== runId || doc.status !== "running") {
        return;
      }

      if (doc.cancelRequested) {
        await finishRun(runId, "cancelled");
        return;
      }

      if (doc.cursor >= doc.total) {
        await finishRun(runId, "completed");
        return;
      }

      if (doc.cursor !== cursor) {
        cursor = doc.cursor;
        continue;
      }

      const recipient = doc.recipients?.[0];

      if (!recipient) {
        await finishRun(runId, "failed", `Recipient ${cursor + 1} could not be read`);
        return;
      }

      const failure = await deliver(recipient, doc.subject, doc.body);

      const advanced = await docs.updateOne(
        { _id: CAMPAIGN_ID, runId, cursor },
        {
          $set: { cursor: cursor + 1, heartbeatAt: new Date(), updatedAt: new Date() },
          $inc: failure ? { failed: 1 } : { sent: 1 },
          ...(failure
            ? {
                $push: {
                  failures: {
                    $each: [{ email: recipient.email, error: failure }],
                    $slice: -MAX_FAILURES_STORED,
                  },
                },
              }
            : {}),
        }
      );

      if (advanced.matchedCount === 0) {
        cursor = -1;
        continue;
      }

      cursor += 1;
      consecutiveFailures = failure ? consecutiveFailures + 1 : 0;

      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        await finishRun(
          runId,
          "failed",
          `Stopped after ${consecutiveFailures} consecutive failures — check the sending mailbox`
        );
        return;
      }

      await sleep(SEND_INTERVAL_MS);
    }
  } catch (error) {
    await finishRun(runId, "failed", errorMessage(error)).catch(() => {});
  } finally {
    runsInThisProcess.delete(runId);
  }
}
