import React, { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { todayStr } from '../utils/formatters';
import { calcIpoRefund } from '../utils/calculations';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [periods, setPeriods] = useLocalStorage('nakit_periods', []);
  const [incomes, setIncomes] = useLocalStorage('nakit_incomes', []);
  const [obligations, setObligations] = useLocalStorage('nakit_obligations', []);
  const [socialWeeks, setSocialWeeks] = useLocalStorage('nakit_social_weeks', []);
  const [ipoApplications, setIpoApplications] = useLocalStorage('nakit_ipo', []);
  const [savings, setSavings] = useLocalStorage('nakit_savings', []);

  // === Active period ===
  const activePeriod = periods.find(p => p.isActive) || null;

  // === Period actions ===
  const startNewPeriod = useCallback((data) => {
    // Deactivate all existing periods
    setPeriods(prev => prev.map(p => ({ ...p, isActive: false })));

    const newPeriod = {
      id: uuidv4(),
      startDate: data.startDate || todayStr(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setPeriods(prev => [...prev, newPeriod]);

    // Optionally add first income entry
    if (data.initialIncomeAmount && data.initialIncomeAmount > 0) {
      const firstIncome = {
        id: uuidv4(),
        periodId: newPeriod.id,
        date: data.startDate || todayStr(),
        source: data.initialIncomeSource || 'Gelir',
        amount: data.initialIncomeAmount,
        type: 'regular',
        createdAt: new Date().toISOString(),
      };
      setIncomes(prev => [...prev, firstIncome]);
    }

    return newPeriod;
  }, [setPeriods, setIncomes]);

  // === Income actions ===
  const addIncome = useCallback((data) => {
    if (!activePeriod) return;
    const income = {
      id: uuidv4(),
      periodId: activePeriod.id,
      date: data.date || todayStr(),
      source: data.source || 'Gelir',
      amount: parseFloat(data.amount) || 0,
      type: data.type || 'regular',
      createdAt: new Date().toISOString(),
    };
    setIncomes(prev => [...prev, income]);
    return income;
  }, [activePeriod, setIncomes]);

  const deleteIncome = useCallback((id) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
  }, [setIncomes]);

  // === Obligation actions ===
  const addObligation = useCallback((data) => {
    if (!activePeriod) return;
    const obligation = {
      id: uuidv4(),
      periodId: activePeriod.id,
      name: data.name || '',
      amount: parseFloat(data.amount) || 0,
      dueDate: data.dueDate || null,
      isPaid: false,
      category: data.category || 'diger',
      ipoEarmarked: false,
      linkedIpoAppId: null,
      createdAt: new Date().toISOString(),
    };
    setObligations(prev => [...prev, obligation]);
    return obligation;
  }, [activePeriod, setObligations]);

  const toggleObligationPaid = useCallback((id) => {
    setObligations(prev => prev.map(o =>
      o.id === id
        ? { ...o, isPaid: !o.isPaid, paidAt: !o.isPaid ? new Date().toISOString() : null }
        : o
    ));
  }, [setObligations]);

  const deleteObligation = useCallback((id) => {
    setObligations(prev => prev.filter(o => o.id !== id));
  }, [setObligations]);

  /**
   * Mark an obligation as "parked in an IPO" — excluded from projection.
   */
  const setObligationIpoEarmark = useCallback((obligationId, ipoAppId) => {
    setObligations(prev => prev.map(o =>
      o.id === obligationId
        ? { ...o, ipoEarmarked: true, linkedIpoAppId: ipoAppId }
        : o
    ));
  }, [setObligations]);

  /**
   * Remove the IPO earmark from an obligation — re-enters projection.
   */
  const clearObligationIpoEarmark = useCallback((obligationId) => {
    setObligations(prev => prev.map(o =>
      o.id === obligationId
        ? { ...o, ipoEarmarked: false, linkedIpoAppId: null }
        : o
    ));
  }, [setObligations]);

  // === Social week actions ===
  const addOrUpdateSocialWeek = useCallback((weekNumber, weeklyBudget) => {
    if (!activePeriod) return;
    setSocialWeeks(prev => {
      const existing = prev.find(w => w.periodId === activePeriod.id && w.weekNumber === weekNumber);
      if (existing) {
        return prev.map(w =>
          w.id === existing.id ? { ...w, weeklyBudget: parseFloat(weeklyBudget) || 0 } : w
        );
      }
      return [...prev, {
        id: uuidv4(),
        periodId: activePeriod.id,
        weekNumber,
        weeklyBudget: parseFloat(weeklyBudget) || 0,
        entries: [],
        createdAt: new Date().toISOString(),
      }];
    });
  }, [activePeriod, setSocialWeeks]);

  const addSocialEntry = useCallback((weekId, entry) => {
    setSocialWeeks(prev => prev.map(w =>
      w.id === weekId
        ? {
            ...w,
            entries: [...(w.entries || []), {
              id: uuidv4(),
              date: entry.date || todayStr(),
              description: entry.description || '',
              amount: parseFloat(entry.amount) || 0,
              createdAt: new Date().toISOString(),
            }]
          }
        : w
    ));
  }, [setSocialWeeks]);

  const deleteSocialEntry = useCallback((weekId, entryId) => {
    setSocialWeeks(prev => prev.map(w =>
      w.id === weekId
        ? { ...w, entries: (w.entries || []).filter(e => e.id !== entryId) }
        : w
    ));
  }, [setSocialWeeks]);

  // === IPO actions ===
  const addIpoApplication = useCallback((data) => {
    const estimatedLots = parseFloat(data.estimatedLots) || 0;
    const pricePerLot = parseFloat(data.pricePerLot) || 0;
    // Compute investedAmount for backward compat storage
    const investedAmount = estimatedLots > 0 && pricePerLot > 0
      ? estimatedLots * pricePerLot
      : parseFloat(data.investedAmount) || 0;

    const app = {
      id: uuidv4(),
      company: data.company || '',
      applicationDate: data.applicationDate || todayStr(),
      estimatedLots,
      allocatedLots: null,           // set after IPO allocation result
      pricePerLot,
      investedAmount,                // kept for backward compat
      estimatedReturnDate: data.estimatedReturnDate || null,
      status: 'bekliyor',
      sales: [],
      transferredToIncome: false,
      refundTransferred: false,
      createdAt: new Date().toISOString(),
    };
    setIpoApplications(prev => [...prev, app]);
    return app;
  }, [setIpoApplications]);

  const updateIpoApplication = useCallback((id, updates) => {
    setIpoApplications(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, [setIpoApplications]);

  const deleteIpoApplication = useCallback((id) => {
    setIpoApplications(prev => prev.filter(a => a.id !== id));
  }, [setIpoApplications]);

  /**
   * Record the actual lots received after allocation.
   * If fewer than estimated, a refund becomes available.
   */
  const setIpoAllocatedLots = useCallback((appId, allocatedLots) => {
    setIpoApplications(prev => prev.map(a =>
      a.id === appId
        ? { ...a, allocatedLots: parseFloat(allocatedLots) }
        : a
    ));
  }, [setIpoApplications]);

  /**
   * Transfer the partial-fill refund to income (cash on hand).
   */
  const transferIpoRefundToIncome = useCallback((appId) => {
    if (!activePeriod) return;
    const application = ipoApplications.find(a => a.id === appId);
    if (!application) return;

    const refund = calcIpoRefund(application);
    if (refund <= 0) return;

    const income = {
      id: uuidv4(),
      periodId: activePeriod.id,
      date: todayStr(),
      source: `IPO İadesi — ${application.company}`,
      amount: refund,
      type: 'ipo_refund',
      ipoAppId: appId,
      createdAt: new Date().toISOString(),
    };

    setIncomes(prev => [...prev, income]);
    setIpoApplications(prev => prev.map(a =>
      a.id === appId ? { ...a, refundTransferred: true } : a
    ));
    return income;
  }, [activePeriod, ipoApplications, setIncomes, setIpoApplications]);

  const addIpoSale = useCallback((appId, saleData) => {
    const application = ipoApplications.find(a => a.id === appId);
    if (!application) return;

    const costPerLot = application.pricePerLot || 0;
    const lots = parseFloat(saleData.lots) || 0;
    const salePrice = parseFloat(saleData.pricePerLot) || 0;
    const profit = (salePrice - costPerLot) * lots;

    const sale = {
      id: uuidv4(),
      date: saleData.date || todayStr(),
      lots,
      pricePerLot: salePrice,
      profit,
      createdAt: new Date().toISOString(),
    };

    setIpoApplications(prev => prev.map(a =>
      a.id === appId
        ? { ...a, sales: [...(a.sales || []), sale], status: 'satildi' }
        : a
    ));

    return sale;
  }, [ipoApplications, setIpoApplications]);

  const transferIpoProfitToIncome = useCallback((appId) => {
    if (!activePeriod) return;
    const application = ipoApplications.find(a => a.id === appId);
    if (!application) return;

    const totalProfit = (application.sales || []).reduce((sum, s) => sum + (s.profit || 0), 0);
    if (totalProfit <= 0) return;

    const income = {
      id: uuidv4(),
      periodId: activePeriod.id,
      date: todayStr(),
      source: `IPO Kârı — ${application.company}`,
      amount: totalProfit,
      type: 'ipo_profit',
      ipoAppId: appId,
      createdAt: new Date().toISOString(),
    };

    setIncomes(prev => [...prev, income]);
    setIpoApplications(prev => prev.map(a =>
      a.id === appId ? { ...a, transferredToIncome: true } : a
    ));

    return income;
  }, [activePeriod, ipoApplications, setIncomes, setIpoApplications]);

  // === Savings actions ===
  const addSavings = useCallback((amount, note) => {
    if (!activePeriod) return;
    const cumulative = savings.reduce((sum, s) => sum + (s.amount || 0), 0) + (parseFloat(amount) || 0);

    const saving = {
      id: uuidv4(),
      periodId: activePeriod.id,
      date: todayStr(),
      amount: parseFloat(amount) || 0,
      note: note || '',
      cumulativeTotal: cumulative,
      createdAt: new Date().toISOString(),
    };
    setSavings(prev => [...prev, saving]);
    return saving;
  }, [activePeriod, savings, setSavings]);

  const deleteSaving = useCallback((id) => {
    setSavings(prev => prev.filter(s => s.id !== id));
  }, [setSavings]);

  // === Reset ===
  const resetAll = useCallback(() => {
    setPeriods([]);
    setIncomes([]);
    setObligations([]);
    setSocialWeeks([]);
    setIpoApplications([]);
    setSavings([]);
  }, [setPeriods, setIncomes, setObligations, setSocialWeeks, setIpoApplications, setSavings]);

  const value = {
    // State
    periods,
    incomes,
    obligations,
    socialWeeks,
    ipoApplications,
    savings,
    activePeriod,

    // Period
    startNewPeriod,

    // Income
    addIncome,
    deleteIncome,

    // Obligations
    addObligation,
    toggleObligationPaid,
    deleteObligation,
    setObligationIpoEarmark,
    clearObligationIpoEarmark,

    // Social
    addOrUpdateSocialWeek,
    addSocialEntry,
    deleteSocialEntry,

    // IPO
    addIpoApplication,
    updateIpoApplication,
    deleteIpoApplication,
    setIpoAllocatedLots,
    transferIpoRefundToIncome,
    addIpoSale,
    transferIpoProfitToIncome,

    // Savings
    addSavings,
    deleteSaving,

    // Dev
    resetAll,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
