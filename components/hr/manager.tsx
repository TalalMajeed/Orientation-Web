"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { HrShortLinkDto } from "@/services/hr/links";

export default function Manager() {
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
      router.push("/hr/login");
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
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

      setLinks((prev) => [data.link, ...prev]);
      setNewUrl("");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(shortId: string) {
    setError(null);

    const response = await fetch(`/api/v1/hr/links/${shortId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Failed to delete link");
      return;
    }

    setLinks((prev) => prev.filter((link) => link.shortId !== shortId));
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

    setLinks((prev) =>
      prev.map((link) => (link.shortId === shortId ? data.link : link))
    );
    cancelEditing();
  }

  async function handleLogout() {
    await fetch("/api/v1/hr/login", { method: "DELETE" });
    router.push("/hr/login");
    router.refresh();
  }

  async function handleCopy(shortUrl: string) {
    await navigator.clipboard.writeText(shortUrl);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invite Links</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Create and manage short invite links.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          Log Out
        </button>
      </div>

      <form onSubmit={handleCreate} className="mt-8 flex gap-2">
        <input
          type="url"
          required
          placeholder="https://example.com/destination"
          value={newUrl}
          onChange={(event) => setNewUrl(event.target.value)}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create Link"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-8 overflow-hidden rounded-lg border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Short Link</th>
              <th className="px-4 py-3 font-medium">Destination</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {loading && (
              <tr>
                <td className="px-4 py-3 text-neutral-500" colSpan={4}>
                  Loading…
                </td>
              </tr>
            )}

            {!loading && links.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-neutral-500" colSpan={4}>
                  No links yet.
                </td>
              </tr>
            )}

            {links.map((link) => (
              <tr key={link.shortId} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium">
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-900 underline"
                  >
                    {link.shortUrl.replace("https://", "")}
                  </a>
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-neutral-500">
                  {editingId === link.shortId ? (
                    <input
                      type="url"
                      value={editingUrl}
                      onChange={(event) => setEditingUrl(event.target.value)}
                      className="w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    link.targetUrl
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(link.createdAt).toLocaleDateString()}
                </td>
                <td className="space-x-3 px-4 py-3">
                  {editingId === link.shortId ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdate(link.shortId)}
                        className="text-neutral-900 underline"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="text-neutral-500 underline"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopy(link.shortUrl)}
                        className="text-neutral-900 underline"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditing(link)}
                        className="text-neutral-900 underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(link.shortId)}
                        className="text-red-600 underline"
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
