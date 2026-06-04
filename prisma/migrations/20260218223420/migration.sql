/*
  Warnings:

  - You are about to drop the column `features` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `function` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `picture` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `user_type` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "features",
DROP COLUMN "function",
DROP COLUMN "picture",
DROP COLUMN "role",
DROP COLUMN "user_type";

-- DropEnum
DROP TYPE "public"."Role";
