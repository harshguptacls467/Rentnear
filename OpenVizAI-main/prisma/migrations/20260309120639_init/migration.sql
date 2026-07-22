/*
  Warnings:

  - You are about to drop the column `is_pinned` on the `user_session` table. All the data in the column will be lost.
  - You are about to drop the column `pinned_ts` on the `user_session` table. All the data in the column will be lost.
  - You are about to drop the `checkpoint_blobs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `checkpoint_migrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `checkpoint_writes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `checkpoints` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "user_session" DROP COLUMN "is_pinned",
DROP COLUMN "pinned_ts";

-- DropTable
DROP TABLE "checkpoint_blobs";

-- DropTable
DROP TABLE "checkpoint_migrations";

-- DropTable
DROP TABLE "checkpoint_writes";

-- DropTable
DROP TABLE "checkpoints";
