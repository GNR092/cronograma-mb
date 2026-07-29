/*
  Warnings:

  - You are about to drop the column `fileType` on the `DayNote` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `DayNote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DayNote" DROP COLUMN "fileType",
DROP COLUMN "fileUrl";

-- CreateTable
CREATE TABLE "DayNoteFile" (
    "id" TEXT NOT NULL,
    "dayNoteId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'image',
    "fileName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DayNoteFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DayNoteFile" ADD CONSTRAINT "DayNoteFile_dayNoteId_fkey" FOREIGN KEY ("dayNoteId") REFERENCES "DayNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
