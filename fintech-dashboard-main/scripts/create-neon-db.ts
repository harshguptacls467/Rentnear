/**
 * Создаёт проект и базу данных в Neon через API.
 * Запуск: npx tsx scripts/create-neon-db.ts
 */
const NEON_API_KEY = "napi_s9df3uxdnq5jgrl6421txrq8osw8ufvg652gv6rhdv1pshi49zx69esd2rp5ehtj";

async function main() {
  // 1. Создаём проект
  console.log("Creating Neon project...");
  const projectRes = await fetch("https://api.neon.tech/v2/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NEON_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: { name: "fintech-dashboard", region_id: "aws-eu-central-1" },
    }),
  });

  if (!projectRes.ok) {
    const err = await projectRes.text();
    throw new Error(`Failed to create project: ${projectRes.status} ${err}`);
  }

  const project = await projectRes.json();
  const projectId = project.project.id;
  console.log(`Project created: ${projectId}`);

  // 2. Ждём готовности
  console.log("Waiting for project to be ready...");
  await new Promise((r) => setTimeout(r, 5000));

  // 3. Получаем строку подключения
  const connRes = await fetch(
    `https://api.neon.tech/v2/projects/${projectId}/connection_uri`,
    {
      headers: { Authorization: `Bearer ${NEON_API_KEY}` },
    },
  );

  if (!connRes.ok) {
    const err = await connRes.text();
    throw new Error(`Failed to get connection URI: ${connRes.status} ${err}`);
  }

  const connData = await connRes.json();
  const uri = connData.connection_uri;

  console.log("\n=== DATABASE_URL ===");
  console.log(uri);
  console.log("====================\n");
  console.log("Add this to your .env.local and Vercel environment variables.");
}

main().catch(console.error);