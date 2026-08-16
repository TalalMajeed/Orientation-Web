"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { HrShortLinkDto } from "@/services/hr/links";

const COLUMNS = ["Short Link", "Destination", "Created", "Actions"];

const ACTION =
  "font-mono text-[11px] uppercase tracking-[0.08em] underline decoration-dotted underline-offset-4 transition-colors";

export default function LinkManager() {
  const router = useRouter();
  const [links, setLinks] = useState<HrShortLinkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState("");

  async function loadLinks() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/v1/hr/links");

    if (response.status === 401) {
      router.push("/login?next=/hr");
      return;
    }

    if (!response.ok) {
      setError("Failed to load links");
      setLoading(false);
      return;
    }

    const data = await response.json();
    setLinks(data.links);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/hr/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to create link");
        return;
      }

      setLinks((current) => [data.link, ...current]);
      setNewUrl("");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(shortId: string) {
    setError(null);

    const response = await fetch(`/api/v1/hr/links/${shortId}`, { method: "DELETE" });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Failed to delete link");
      return;
    }

    setLinks((current) => current.filter((link) => link.shortId !== shortId));
  }

  function startEditing(link: HrShortLinkDto) {
    setEditingId(link.shortId);
    setEditingUrl(link.targetUrl);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingUrl("");
  }

  async function handleUpdate(shortId: string) {
    setError(null);

    const response = await fetch(`/api/v1/hr/links/${shortId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: editingUrl.trim() }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to update link");
      return;
    }

    setLinks((current) =>
      current.map((link) => (link.shortId === shortId ? data.link : link))
    );
    cancelEditing();
  }

  async function handleLogout() {
    await fetch("/api/v1/auth/login", { method: "DELETE" });
    router.push("/login?next=/hr");
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-italic text-sm italic text-fg/50">— NUST Orientation &apos;26</p>
          <h1 className="mt-2 font-serif text-5xl font-bold text-fg">Invite Links</h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">
            Create &amp; manage short invite links
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-fg transition-colors hover:border-fg"
        >
          Log out
        </button>
      </div>

      <form onSubmit={handleCreate} className="mt-8 flex flex-wrap gap-2">
        <input
          type="url"
          required
          placeholder="https://example.com/destination"
          value={newUrl}
          onChange={(event) => setNewUrl(event.target.value)}
          className="min-w-0 flex-1 rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-full border-2 border-transparent bg-fg px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-surface transition-colors hover:bg-ember hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
        >
          {creating ? "Creating…" : "Create link"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-danger"
        >
          {error}
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-fg/12">
        <table className="w-full min-w-[720px] border-collapse text-left font-mono text-[12px]">
          <thead>
            <tr className="border-b border-fg/15 text-fg/45">
              {COLUMNS.map((column) => (
                <th key={column} className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-4 text-fg/45" colSpan={4}>
                  Loading…
                </td>
              </tr>
            )}

            {!loading && links.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center uppercase tracking-[0.1em] text-fg/40"
                  colSpan={4}
                >
                  No links yet.
                </td>
              </tr>
            )}

            {links.map((link) => (
              <tr
                key={link.shortId}
                className="border-b border-fg/8 text-fg/80 transition-colors hover:bg-fg/[0.03]"
              >
                <td className="px-4 py-3">
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-fg underline decoration-dotted underline-offset-4 transition-colors hover:text-sky"
                  >
                    {link.shortUrl.replace("https://", "")}
                  </a>
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-fg/60">
                  {editingId === link.shortId ? (
                    <input
                      type="url"
                      value={editingUrl}
                      onChange={(event) => setEditingUrl(event.target.value)}
                      className="w-full rounded-full border-2 border-dotted border-fg/25 bg-transparent px-3 py-1.5 text-fg focus:border-fg focus:outline-none"
                    />
                  ) : (
                    link.targetUrl
                  )}
                </td>
                <td className="px-4 py-3 text-fg/60">
                  {new Date(link.createdAt).toLocaleDateString()}
                </td>
                <td className="space-x-3 whitespace-nowrap px-4 py-3">
                  {editingId === link.shortId ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdate(link.shortId)}
                        className={`${ACTION} text-fg hover:text-sky`}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className={`${ACTION} text-fg/50 hover:text-fg`}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(link.shortUrl)}
                        className={`${ACTION} text-fg hover:text-sky`}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditing(link)}
                        className={`${ACTION} text-fg hover:text-sky`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(link.shortId)}
                        className={`${ACTION} text-danger`}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
