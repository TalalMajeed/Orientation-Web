"use client";

import { useCallback, useEffect, useState } from "react";

const API = "/api/v1/liaison/accounts";

const PILL =
  "rounded-full border-2 border-dotted px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors disabled:opacity-30";
const PILL_ON = "border-transparent bg-fg text-surface";
const PILL_OFF = "border-fg/40 text-fg hover:border-fg";
const FIELD =
  "rounded-xl border-2 border-dotted border-fg/30 bg-transparent px-4 py-2 font-mono text-[13px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none";

interface MemberAccount {
  username: string;
  createdAt: string;
  updatedAt: string;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function AccountsView() {
  const [accounts, setAccounts] = useState<MemberAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetting, setResetting] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const call = useCallback(
    async (path: string, init?: RequestInit): Promise<boolean> => {
      setBusy(true);
      setError(null);

      try {
        const response = await fetch(`${API}${path}`, {
          ...init,
          headers: init?.body ? { "Content-Type": "application/json" } : undefined,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(typeof data.error === "string" ? data.error : "Request failed");
          return false;
        }

        if (Array.isArray(data.accounts)) {
          setAccounts(data.accounts as MemberAccount[]);
        }

        return true;
      } catch {
        setError("Could not reach the server");
        return false;
      } finally {
        setBusy(false);
      }
    },
    []
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void call("").finally(() => setLoaded(true));
  }, [call]);

  const create = async () => {
    setNotice(null);
    const name = username.trim().toLowerCase();

    const ok = await call("", {
      method: "POST",
      body: JSON.stringify({ username: name, password }),
    });

    if (ok) {
      setNotice(`Created ${name}. Share the password with them now — it is not stored in readable form.`);
      setUsername("");
      setPassword("");
    }
  };

  const savePassword = async (name: string) => {
    setNotice(null);

    const ok = await call(`/${encodeURIComponent(name)}`, {
      method: "PATCH",
      body: JSON.stringify({ password: resetPassword }),
    });

    if (ok) {
      setNotice(`New password set for ${name}.`);
      setResetting(null);
      setResetPassword("");
    }
  };

  const remove = async (name: string) => {
    setNotice(null);
    setConfirmDelete(null);

    if (await call(`/${encodeURIComponent(name)}`, { method: "DELETE" })) {
      setNotice(`Deleted ${name}.`);
    }
  };

  return (
    <div className={busy ? "pointer-events-none opacity-60 transition-opacity" : undefined}>
      <h2 className="font-serif text-5xl font-bold text-fg">Accounts</h2>
      <p className="mt-3 max-w-2xl font-mono text-[12px] uppercase leading-relaxed tracking-[0.08em] text-fg/50">
        Member logins for the OG team. Members can read every tab but only write in
        <span className="text-ember"> Emails</span> — they cannot upload lists, run allocation,
        rename houses, or see this page.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-danger/40 bg-danger/5 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-danger"
        >
          {error}
        </p>
      )}

      {notice && (
        <p className="mt-6 rounded-2xl border border-fg/20 bg-fg/[0.03] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-fg/70">
          {notice}
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-fg/12 bg-fg/[0.02] p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/40">
          New member account
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="username"
            autoComplete="off"
            className={`${FIELD} w-56`}
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password (min 8 chars)"
            type="text"
            autoComplete="off"
            className={`${FIELD} w-72`}
          />
          <button
            onClick={create}
            disabled={username.trim().length < 3 || password.length < 8}
            className={`${PILL} ${PILL_ON}`}
          >
            Create account
          </button>
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-fg/40">
          Usernames: lowercase letters, digits, dot, dash or underscore.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-fg/12">
        {!loaded ? (
          <p className="px-4 py-8 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-fg/40">
            Loading accounts…
          </p>
        ) : accounts.length === 0 ? (
          <p className="px-4 py-8 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-fg/40">
            No member accounts yet.
          </p>
        ) : (
          accounts.map((account) => (
            <div key={account.username} className="border-b border-fg/8 px-5 py-4 last:border-b-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-serif text-xl font-bold text-fg">{account.username}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg/45">
                  added {formatDate(account.createdAt)}
                  {account.updatedAt !== account.createdAt
                    ? ` · password changed ${formatDate(account.updatedAt)}`
                    : ""}
                </span>
                <span className="ml-auto flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setResetPassword("");
                      setResetting(resetting === account.username ? null : account.username);
                    }}
                    className={`${PILL} ${PILL_OFF}`}
                  >
                    {resetting === account.username ? "Cancel" : "Set password"}
                  </button>
                  <button
                    onClick={() =>
                      confirmDelete === account.username
                        ? remove(account.username)
                        : setConfirmDelete(account.username)
                    }
                    onBlur={() => setConfirmDelete(null)}
                    className={`${PILL} ${
                      confirmDelete === account.username
                        ? "border-transparent bg-danger text-cream"
                        : "border-danger/50 text-danger hover:border-danger"
                    }`}
                  >
                    {confirmDelete === account.username ? "Confirm delete?" : "Delete"}
                  </button>
                </span>
              </div>

              {resetting === account.username && (
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-dashed border-fg/15 pt-3">
                  <input
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    placeholder="new password (min 8 chars)"
                    type="text"
                    autoComplete="off"
                    className={`${FIELD} w-72`}
                  />
                  <button
                    onClick={() => savePassword(account.username)}
                    disabled={resetPassword.length < 8}
                    className={`${PILL} ${PILL_ON}`}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
