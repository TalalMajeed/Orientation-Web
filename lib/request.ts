export async function readJson(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();

    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function readString(body: Record<string, unknown>, field: string): string {
  const value = body[field];

  return typeof value === "string" ? value.trim() : "";
}
