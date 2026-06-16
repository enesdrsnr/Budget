/**
 * Budget calculations for active period
 */

/**
 * Total income for a period
 */
export function calcTotalIncome(incomes, periodId) {
  return incomes
    .filter(i => i.periodId === periodId)
    .reduce((sum, i) => sum + (i.amount || 0), 0);
}

/**
 * Total obligations (reserved) for a period
 */
export function calcTotalObligations(obligations, periodId) {
  return obligations
    .filter(o => o.periodId === periodId)
    .reduce((sum, o) => sum + (o.amount || 0), 0);
}

/**
 * Total paid obligations for a period
 */
export function calcPaidObligations(obligations, periodId) {
  return obligations
    .filter(o => o.periodId === periodId && o.isPaid)
    .reduce((sum, o) => sum + (o.amount || 0), 0);
}

/**
 * Total social spending for a period
 */
export function calcTotalSocialSpending(socialWeeks, periodId) {
  return socialWeeks
    .filter(w => w.periodId === periodId)
    .reduce((sum, w) => {
      const weekSpend = (w.entries || []).reduce((s, e) => s + (e.amount || 0), 0);
      return sum + weekSpend;
    }, 0);
}

/**
 * Total weekly budget allocated for social spending in a period
 */
export function calcTotalSocialBudget(socialWeeks, periodId) {
  return socialWeeks
    .filter(w => w.periodId === periodId)
    .reduce((sum, w) => sum + (w.weeklyBudget || 0), 0);
}

/**
 * Total saved in a period
 */
export function calcPeriodSavings(savings, periodId) {
  return savings
    .filter(s => s.periodId === periodId)
    .reduce((sum, s) => sum + (s.amount || 0), 0);
}

/**
 * All-time cumulative savings
 */
export function calcCumulativeSavings(savings) {
  return savings.reduce((sum, s) => sum + (s.amount || 0), 0);
}

/**
 * Free cash = Income - Obligations - Social Spending - Savings allocated
 */
export function calcFreeCash(incomes, obligations, socialWeeks, savings, periodId) {
  const income = calcTotalIncome(incomes, periodId);
  const oblig = calcTotalObligations(obligations, periodId);
  const social = calcTotalSocialSpending(socialWeeks, periodId);
  const saved = calcPeriodSavings(savings, periodId);
  return income - oblig - social - saved;
}

/**
 * Available to save = Income - Obligations - Social Spending
 */
export function calcAvailableToSave(incomes, obligations, socialWeeks, savings, periodId) {
  const income = calcTotalIncome(incomes, periodId);
  const oblig = calcTotalObligations(obligations, periodId);
  const social = calcTotalSocialSpending(socialWeeks, periodId);
  const alreadySaved = calcPeriodSavings(savings, periodId);
  return income - oblig - social - alreadySaved;
}

/**
 * IPO profit calculation for a single application
 */
export function calcIpoProfit(application) {
  if (!application.sales || application.sales.length === 0) return 0;
  return application.sales.reduce((sum, sale) => {
    const costPerLot = application.pricePerLot || 0;
    const profit = (sale.pricePerLot - costPerLot) * sale.lots;
    return sum + profit;
  }, 0);
}

/**
 * IPO total invested across all applications
 */
export function calcTotalIpoInvested(applications) {
  return applications.reduce((sum, a) => sum + (a.investedAmount || 0), 0);
}

/**
 * IPO total profit across all applications
 */
export function calcTotalIpoProfit(applications) {
  return applications.reduce((sum, a) => sum + calcIpoProfit(a), 0);
}

/**
 * Current week's spending for a week record
 */
export function calcWeekSpending(week) {
  return (week.entries || []).reduce((sum, e) => sum + (e.amount || 0), 0);
}

/**
 * Current week's remaining budget
 */
export function calcWeekRemaining(week) {
  return (week.weeklyBudget || 0) - calcWeekSpending(week);
}

/**
 * Get week number within a period (1-indexed)
 */
export function getWeekNumberInPeriod(startDate, targetDate) {
  const start = new Date(startDate + 'T00:00:00');
  const target = new Date(targetDate + 'T00:00:00');
  const diffDays = Math.floor((target - start) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

/**
 * Get the date range of a week within a period
 */
export function getWeekDateRange(periodStartDate, weekNumber) {
  const start = new Date(periodStartDate + 'T00:00:00');
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + (weekNumber - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const fmt = (d) => d.toISOString().split('T')[0];
  return { weekStart: fmt(weekStart), weekEnd: fmt(weekEnd) };
}
