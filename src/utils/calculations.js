/**
 * Budget calculations — date-aware, projection-based
 * All functions that need "today" accept it as a parameter (YYYY-MM-DD string)
 * so they remain pure and testable.
 */

// ─────────────────────────────────────────────
// INCOME — split by today
// ─────────────────────────────────────────────

/**
 * "Eldeki Nakit" — income entries dated today or earlier.
 * This is money actually in hand.
 */
export function calcCashOnHand(incomes, periodId, today) {
  return incomes
    .filter(i => i.periodId === periodId && i.date <= today)
    .reduce((sum, i) => sum + (i.amount || 0), 0);
}

/**
 * "Yaklaşan Gelir" — income entries dated after today.
 * Not yet received; must NEVER be added to cash on hand.
 */
export function calcUpcomingIncome(incomes, periodId, today) {
  return incomes
    .filter(i => i.periodId === periodId && i.date > today)
    .reduce((sum, i) => sum + (i.amount || 0), 0);
}

// ─────────────────────────────────────────────
// OBLIGATIONS
// ─────────────────────────────────────────────

/**
 * All obligations for a period (for display totals only).
 */
export function calcTotalObligations(obligations, periodId) {
  return obligations
    .filter(o => o.periodId === periodId && !o.ipoEarmarked)
    .reduce((sum, o) => sum + (o.amount || 0), 0);
}

/**
 * Paid obligations total.
 */
export function calcPaidObligations(obligations, periodId) {
  return obligations
    .filter(o => o.periodId === periodId && o.isPaid)
    .reduce((sum, o) => sum + (o.amount || 0), 0);
}

/**
 * IPO-earmarked obligations total (reserved in an IPO, not freely disposable).
 */
export function calcEarmarkedObligations(obligations, periodId) {
  return obligations
    .filter(o => o.periodId === periodId && !o.isPaid && o.ipoEarmarked)
    .reduce((sum, o) => sum + (o.amount || 0), 0);
}

// ─────────────────────────────────────────────
// SOCIAL SPENDING
// ─────────────────────────────────────────────

/**
 * Total social spending logged (all entries, all weeks) for a period.
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
 * Total weekly budget allocated for a period.
 */
export function calcTotalSocialBudget(socialWeeks, periodId) {
  return socialWeeks
    .filter(w => w.periodId === periodId)
    .reduce((sum, w) => sum + (w.weeklyBudget || 0), 0);
}

// ─────────────────────────────────────────────
// SAVINGS
// ─────────────────────────────────────────────

/**
 * Total savings allocated this period.
 */
export function calcPeriodSavings(savings, periodId) {
  return savings
    .filter(s => s.periodId === periodId)
    .reduce((sum, s) => sum + (s.amount || 0), 0);
}

/**
 * All-time cumulative savings.
 */
export function calcCumulativeSavings(savings) {
  return savings.reduce((sum, s) => sum + (s.amount || 0), 0);
}

// ─────────────────────────────────────────────
// PROJECTION — core algorithm
// ─────────────────────────────────────────────

/**
 * Projection-based cash flow analysis.
 *
 * Starting balance = cashOnHand - socialSpentSoFar - savedAmount
 * (social spending and savings are already gone from the cash pile)
 *
 * Then walk forward through:
 *   • Future income entries (positive events at their date)
 *   • Unpaid, non-earmarked obligations WITH a dueDate (negative events)
 *
 * The LOWEST point the running balance reaches is the real "safe to allocate"
 * amount — going below it means an obligation couldn't be paid.
 *
 * Obligations WITHOUT a dueDate are excluded and returned as `undatedObligations`
 * for a separate warning UI.
 *
 * @returns {Object} projection result
 */
export function calcProjection(incomes, obligations, socialWeeks, savings, periodId, today) {
  const cashOnHand = calcCashOnHand(incomes, periodId, today);
  const socialSpent = calcTotalSocialSpending(socialWeeks, periodId);
  const savedAmount = calcPeriodSavings(savings, periodId);

  // Actual balance right now (before projecting future events)
  const startBalance = cashOnHand - socialSpent - savedAmount;

  // Build the event list
  const events = [];

  // Future income entries
  incomes
    .filter(i => i.periodId === periodId && i.date > today)
    .forEach(i => events.push({
      id: i.id,
      date: i.date,
      amount: i.amount || 0,
      label: i.source || 'Gelir',
      type: 'income',
    }));

  // Unpaid, non-earmarked obligations that have a due date
  obligations
    .filter(o => o.periodId === periodId && !o.isPaid && !o.ipoEarmarked && o.dueDate)
    .forEach(o => events.push({
      id: o.id,
      date: o.dueDate,
      amount: -(o.amount || 0),
      label: o.name || 'Gider',
      type: 'obligation',
      category: o.category,
    }));

  // Sort chronologically
  events.sort((a, b) => a.date.localeCompare(b.date));

  // Walk forward
  let runningBalance = startBalance;
  let minBalance = startBalance;
  let minDate = today;

  const timeline = events.map(event => {
    runningBalance += event.amount;
    if (runningBalance < minBalance) {
      minBalance = runningBalance;
      minDate = event.date;
    }
    return { ...event, balance: runningBalance };
  });

  // Obligations without a due date → warning list
  const undatedObligations = obligations.filter(
    o => o.periodId === periodId && !o.isPaid && !o.ipoEarmarked && !o.dueDate
  );

  // IPO-earmarked obligations → informational
  const earmarkedObligations = obligations.filter(
    o => o.periodId === periodId && !o.isPaid && o.ipoEarmarked
  );

  return {
    cashOnHand,       // gross income in hand → "Eldeki Nakit"
    startBalance,     // cashOnHand minus social spending and savings
    minBalance,       // lowest projected balance → "Ayırılabilir"
    minDate,          // date when minimum occurs
    endBalance: runningBalance,  // projected balance after all events
    timeline,         // [{date, amount, label, type, balance}]
    undatedObligations,
    earmarkedObligations,
  };
}

// ─────────────────────────────────────────────
// IPO
// ─────────────────────────────────────────────

/**
 * Actual invested amount for one application.
 * Priority: allocatedLots * price > estimatedLots * price > legacy investedAmount
 */
export function calcIpoActualInvestedAmount(application) {
  const price = application.pricePerLot || 0;
  if (price > 0) {
    if (application.allocatedLots != null) return application.allocatedLots * price;
    const estLots = application.estimatedLots ?? application.lotsReceived ?? null;
    if (estLots != null) return estLots * price;
  }
  return application.investedAmount || 0;
}

/**
 * Money currently locked in this IPO (0 if sold).
 */
export function calcIpoLockedAmount(application) {
  if (application.status === 'satildi') return 0;
  return calcIpoActualInvestedAmount(application);
}

/**
 * Total locked across all non-sold applications.
 */
export function calcTotalIpoLocked(applications) {
  return applications
    .filter(a => a.status !== 'satildi')
    .reduce((sum, a) => sum + calcIpoLockedAmount(a), 0);
}

/**
 * Refund from partial fill: (estimatedLots - allocatedLots) * pricePerLot.
 * Returns 0 if allocatedLots is not yet set or there is no difference.
 */
export function calcIpoRefund(application) {
  if (application.allocatedLots == null) return 0;
  const estimated = application.estimatedLots ?? application.lotsReceived ?? 0;
  const diff = estimated - application.allocatedLots;
  if (diff <= 0) return 0;
  return diff * (application.pricePerLot || 0);
}

/**
 * Profit from sales for one application (unchanged logic).
 * Cost basis is pricePerLot at application time.
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
 * Total invested across all applications (uses actual invested amount).
 */
export function calcTotalIpoInvested(applications) {
  return applications.reduce((sum, a) => sum + calcIpoActualInvestedAmount(a), 0);
}

export function calcTotalIpoProfit(applications) {
  return applications.reduce((sum, a) => sum + calcIpoProfit(a), 0);
}

// ─────────────────────────────────────────────
// SOCIAL WEEK HELPERS
// ─────────────────────────────────────────────

export function calcWeekSpending(week) {
  return (week.entries || []).reduce((sum, e) => sum + (e.amount || 0), 0);
}

export function calcWeekRemaining(week) {
  return (week.weeklyBudget || 0) - calcWeekSpending(week);
}

export function getWeekNumberInPeriod(startDate, targetDate) {
  const start = new Date(startDate + 'T00:00:00');
  const target = new Date(targetDate + 'T00:00:00');
  const diffDays = Math.floor((target - start) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

export function getWeekDateRange(periodStartDate, weekNumber) {
  const start = new Date(periodStartDate + 'T00:00:00');
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + (weekNumber - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const fmt = (d) => d.toISOString().split('T')[0];
  return { weekStart: fmt(weekStart), weekEnd: fmt(weekEnd) };
}
