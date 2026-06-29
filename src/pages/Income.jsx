import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, TrendingUp, Calendar, X, ChevronDown, Edit3, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, todayStr } from '../utils/formatters';
import { calcCashOnHand, calcUpcomingIncome } from '../utils/calculations';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const incomeTypes = {
  regular:    { label: 'Düzenli',    color: 'badge-info' },
  ipo_profit: { label: 'IPO Kârı',   color: 'badge-success' },
  ipo_refund: { label: 'IPO İadesi', color: 'badge-warning' },
  bonus:      { label: 'Bonus',      color: 'badge-warning' },
  other:      { label: 'Diğer',      color: 'badge-neutral' },
};

const sourceOptions = ['Maaş', 'Serbest Meslek', 'Kira Geliri', 'Satış', 'IPO Kârı', 'Diğer'];

function AddIncomeModal({ onClose }) {
  const { addIncome } = useApp();
  const today = todayStr();
  const [form, setForm] = useState({
    date: today,
    source: 'Maaş',
    customSource: '',
    amount: '',
    type: 'regular',
  });
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [showCustom, setShowCustom] = useState(false);

  const isUpcoming = form.date > today;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    addIncome({
      date: form.date,
      source: showCustom ? form.customSource : form.source,
      amount: parseFloat(form.amount),
      type: form.type,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="modal-content"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Gelir Ekle</h3>
          <button id="close-income-modal" onClick={onClose} className="btn-secondary !px-2 !py-2">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tarih</label>
            <input id="income-date" type="date" className="input-field" value={form.date} onChange={e => update('date', e.target.value)} />
            {/* Live preview of on-hand vs upcoming */}
            {isUpcoming ? (
              <p className="flex items-center gap-1.5 text-accent-glow text-xs mt-1.5">
                <Clock size={11} /> Bu gelir bugünden sonraki — "Yaklaşan Gelir" olarak kaydedilecek
              </p>
            ) : (
              <p className="text-emerald-400 text-xs mt-1.5">✓ Eldeki Nakit'e eklenecek</p>
            )}
          </div>

          <div>
            <label className="label">Kaynak</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {sourceOptions.map(s => (
                <button
                  key={s}
                  type="button"
                  id={`source-${s}`}
                  onClick={() => { update('source', s); setShowCustom(false); }}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    !showCustom && form.source === s ? 'bg-accent-blue text-white' : 'glass-card text-white/50 hover:text-white/80'
                  }`}
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                id="source-custom"
                onClick={() => setShowCustom(true)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${showCustom ? 'bg-accent-blue text-white' : 'glass-card text-white/50'}`}
              >
                <Edit3 size={13} className="inline mr-1" />Özel
              </button>
            </div>
            {showCustom && (
              <input
                id="income-source-custom"
                type="text"
                className="input-field mt-2"
                placeholder="Kaynak adı..."
                value={form.customSource}
                onChange={e => update('customSource', e.target.value)}
                autoFocus
              />
            )}
          </div>

          <div>
            <label className="label">Tür</label>
            <div className="flex gap-2">
              {Object.entries(incomeTypes).filter(([k]) => k !== 'ipo_profit').map(([key, { label }]) => (
                <button
                  key={key}
                  type="button"
                  id={`income-type-${key}`}
                  onClick={() => update('type', key)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    form.type === key ? 'bg-accent-blue text-white' : 'glass-card text-white/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Tutar (₺)</label>
            <input
              id="income-amount"
              type="number"
              className="input-field text-xl font-bold"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              placeholder="0"
              inputMode="decimal"
              required
            />
            {form.amount && (
              <p className={`text-sm mt-1.5 font-medium ${isUpcoming ? 'text-accent-glow' : 'text-emerald-400'}`}>
                {formatCurrency(parseFloat(form.amount) || 0)}
              </p>
            )}
          </div>

          <button id="submit-income" type="submit" className="w-full btn-success mt-2 py-4">
            <Plus size={18} />
            Gelir Kaydet
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function Income() {
  const { activePeriod, incomes, deleteIncome, periods } = useApp();
  const today = todayStr();
  const [showModal, setShowModal] = useState(false);
  const [viewPeriodId, setViewPeriodId] = useState(activePeriod?.id || null);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const currentPeriodId = viewPeriodId || activePeriod?.id;
  const periodIncomes = incomes.filter(i => i.periodId === currentPeriodId);
  const viewedPeriod = periods.find(p => p.id === currentPeriodId);
  const isActive = currentPeriodId === activePeriod?.id;

  const cashOnHand = calcCashOnHand(incomes, currentPeriodId, today);
  const upcomingIncome = calcUpcomingIncome(incomes, currentPeriodId, today);

  // Split into past/upcoming for display
  const pastIncomes = [...periodIncomes]
    .filter(i => i.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const futureIncomes = [...periodIncomes]
    .filter(i => i.date > today)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <h1 className="page-title">Gelir</h1>
        {isActive && (
          <button id="open-add-income" onClick={() => setShowModal(true)} className="btn-primary !py-2 !px-4 text-sm">
            <Plus size={16} /> Ekle
          </button>
        )}
      </motion.div>

      {/* Period picker */}
      {periods.length > 1 && (
        <motion.div variants={fadeUp}>
          <button
            id="toggle-period-picker"
            onClick={() => setShowPeriodPicker(!showPeriodPicker)}
            className="w-full glass-card p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-white/40" />
              <span className="text-white/60 text-sm">
                {viewedPeriod ? `Dönem: ${formatDate(viewedPeriod.startDate)}` : 'Dönem seç'}
              </span>
              {isActive && <span className="badge badge-success text-[10px]">Aktif</span>}
            </div>
            <ChevronDown size={16} className={`text-white/40 transition-transform ${showPeriodPicker ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showPeriodPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card mt-1 p-2 space-y-1">
                  {[...periods].reverse().map(p => (
                    <button
                      key={p.id}
                      id={`period-${p.id}`}
                      onClick={() => { setViewPeriodId(p.id); setShowPeriodPicker(false); }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                        p.id === currentPeriodId ? 'bg-accent-blue/15 text-accent-blue' : 'text-white/60 hover:bg-white/5'
                      }`}
                    >
                      {formatDate(p.startDate)}
                      {p.isActive && <span className="ml-2 badge badge-success text-[10px]">Aktif</span>}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Split income summary */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div variants={fadeUp} className="glass-card p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500/15">
          <p className="stat-label mb-1">Eldeki Nakit</p>
          <p className="text-xl font-bold text-emerald-400 tabular-nums">{formatCurrency(cashOnHand)}</p>
          <p className="text-white/30 text-xs mt-1">{pastIncomes.length} kayıt</p>
        </motion.div>
        <motion.div variants={fadeUp} className={`glass-card p-4 bg-gradient-to-br border ${upcomingIncome > 0 ? 'from-accent-blue/20 to-accent-blue/5 border-accent-blue/15' : 'from-white/[0.03] to-transparent border-white/[0.06]'}`}>
          <p className="stat-label mb-1">Yaklaşan Gelir</p>
          <p className={`text-xl font-bold tabular-nums ${upcomingIncome > 0 ? 'text-accent-glow' : 'text-white/20'}`}>
            {formatCurrency(upcomingIncome)}
          </p>
          <p className="text-white/30 text-xs mt-1">{futureIncomes.length} kayıt</p>
        </motion.div>
      </div>

      {/* Upcoming income list */}
      {futureIncomes.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-accent-glow" />
            <h3 className="section-title text-accent-glow">Yaklaşan ({futureIncomes.length})</h3>
          </div>
          <AnimatePresence>
            {futureIncomes.map(income => {
              const typeInfo = incomeTypes[income.type] || incomeTypes.other;
              const daysAway = Math.round((new Date(income.date + 'T00:00:00') - new Date(today + 'T00:00:00')) / (1000 * 60 * 60 * 24));
              return (
                <motion.div
                  key={income.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  className="glass-card p-4 flex items-center justify-between border-accent-blue/10"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-accent-glow" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{income.source}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-white/40 text-xs">{formatDate(income.date)}</p>
                        <span className="badge badge-info text-[10px]">{daysAway} gün</span>
                        <span className={`${typeInfo.color} text-[10px] px-1.5 py-0.5 rounded-full`}>{typeInfo.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <p className="text-accent-glow font-bold tabular-nums">{formatCurrency(income.amount)}</p>
                    {isActive && (
                      <button
                        id={`delete-income-${income.id}`}
                        onClick={() => deleteIncome(income.id)}
                        className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400/60 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Past income list */}
      <motion.div variants={fadeUp} className="space-y-2">
        <h3 className="section-title">Alınan Gelirler</h3>
        {pastIncomes.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <TrendingUp size={32} className="text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Henüz gelir kaydı yok</p>
          </div>
        ) : (
          <AnimatePresence>
            {pastIncomes.map(income => {
              const typeInfo = incomeTypes[income.type] || incomeTypes.other;
              return (
                <motion.div
                  key={income.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  className="glass-card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={18} className="text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{income.source}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-white/40 text-xs">{formatDate(income.date)}</p>
                        <span className={`${typeInfo.color} text-[10px] px-1.5 py-0.5 rounded-full`}>{typeInfo.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <p className="text-emerald-400 font-bold tabular-nums">{formatCurrency(income.amount)}</p>
                    {isActive && (
                      <button
                        id={`delete-income-${income.id}`}
                        onClick={() => deleteIncome(income.id)}
                        className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400/60 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && <AddIncomeModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
