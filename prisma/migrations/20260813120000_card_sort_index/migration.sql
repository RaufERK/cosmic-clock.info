-- User-order index on Card; drop User.cardSortOrder.
-- Backfill preserves today's on-screen order (newest-first default; oldest if that preference was set).

ALTER TABLE "Card" ADD COLUMN "sortIndex" INTEGER;

UPDATE "Card" AS c
SET "sortIndex" = s.rn
FROM (
  SELECT
    c2.id,
    ROW_NUMBER() OVER (
      PARTITION BY c2."userId"
      ORDER BY
        CASE
          WHEN u."cardSortOrder" = 'oldest' THEN EXTRACT(EPOCH FROM c2."createdAt")
          ELSE -EXTRACT(EPOCH FROM c2."createdAt")
        END ASC,
        c2.id ASC
    ) - 1 AS rn
  FROM "Card" c2
  INNER JOIN "User" u ON u.id = c2."userId"
) AS s
WHERE c.id = s.id;

ALTER TABLE "Card" ALTER COLUMN "sortIndex" SET NOT NULL;

CREATE INDEX "Card_userId_sortIndex_idx" ON "Card"("userId", "sortIndex");

ALTER TABLE "User" DROP COLUMN "cardSortOrder";
