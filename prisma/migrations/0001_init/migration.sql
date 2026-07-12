-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL DEFAULT '',
    "userId" TEXT,
    "stack" TEXT NOT NULL DEFAULT 'vite',
    "typescript" BOOLEAN NOT NULL DEFAULT true,
    "styling" TEXT NOT NULL DEFAULT 'tailwind',
    "routing" TEXT NOT NULL DEFAULT 'router',
    "stateMgmt" TEXT NOT NULL DEFAULT 'none',
    "uiLib" TEXT NOT NULL DEFAULT 'none',
    "features" TEXT NOT NULL DEFAULT '[]',
    "selectedPacks" TEXT NOT NULL DEFAULT '[]',
    "prd" TEXT NOT NULL DEFAULT '',
    "arsenalJson" TEXT NOT NULL DEFAULT '',
    "filesJson" TEXT NOT NULL DEFAULT '[]',
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "validationJson" TEXT NOT NULL DEFAULT '',
    "installStatus" TEXT NOT NULL DEFAULT 'pending',
    "buildStatus" TEXT NOT NULL DEFAULT 'pending',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Snapshot',
    "filesJson" TEXT NOT NULL DEFAULT '[]',
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "prd" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Snapshot_projectId_createdAt_idx" ON "Snapshot"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
