import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { supabase, EVIDENCE_BUCKET } from "../lib/supabase";

const prisma = new PrismaClient();

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

async function main() {
  const pending = await prisma.dayNoteFile.findMany({
    where: { fileUrl: { startsWith: "data:" } },
  });
  console.log(`Found ${pending.length} file(s) still stored as base64`);

  let migrated = 0;
  let failed = 0;

  for (const file of pending) {
    try {
      const [meta, b64] = file.fileUrl.split(",");
      const mime =
        meta.match(/:(.*?);/)?.[1] ??
        (file.fileType === "pdf" ? "application/pdf" : "image/jpeg");
      const buffer = Buffer.from(b64, "base64");
      const path = `${file.dayNoteId}/${randomUUID()}-${sanitizeName(file.fileName || "archivo")}`;

      const { error } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .upload(path, buffer, { contentType: mime });
      if (error) throw error;

      await prisma.dayNoteFile.update({
        where: { id: file.id },
        data: { fileUrl: path },
      });
      migrated++;
      console.log(`  ✓ ${file.id} (${file.fileName}) -> ${path}`);
    } catch (e) {
      failed++;
      console.error(`  ✗ ${file.id} (${file.fileName}):`, e);
    }
  }

  console.log(`Done. Migrated ${migrated}, failed ${failed}.`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
