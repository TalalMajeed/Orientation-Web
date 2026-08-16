import fs from "node:fs";
import path from "node:path";

const SECRETS_URL =
  "https://secrets.ecello.net/api/v1/secrets?project=6a553080e3f067860aa099eb&env=prod";

const token = process.env.SECRETS_KEY;

if (!token) {
  console.error("Error: SECRETS_KEY is not defined.");
  process.exit(1);
}

try {
  const response = await fetch(SECRETS_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const secrets = await response.json();
  const envLines = Object.entries(secrets)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const root = import.meta.dirname;

  fs.writeFileSync(path.join(root, "secrets.json"), JSON.stringify(secrets, null, 2));
  fs.writeFileSync(path.join(root, ".env"), envLines);

  console.log("Generated secrets.json and .env in the project root");
} catch (error) {
  console.error("Failed to fetch secrets:", error);
  process.exit(1);
}
