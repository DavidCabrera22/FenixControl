-- CreateTable
CREATE TABLE "third_parties" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "third_parties_pkey" PRIMARY KEY ("id")
);
