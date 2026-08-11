-- CreateIndex
CREATE UNIQUE INDEX "Card_userId_year_month_day_key" ON "Card"("userId", "year", "month", "day");
