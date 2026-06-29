import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, PiggyBank, X, TrendingUp, Target } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { calcProjection, calcCumulativeSavings, calcPeriodSavings } from '../utils/calculations';
import { todayStr } from '../utils/formatters';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function AddSavingsModal({ availableToSave, onClose }) {
  const { addSavings } = useApp();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    addSavings(val, note);
    onClose();
  };

  const quickAmounts = availableToSave > 0
    ? [
        Math.round(availableToSave * 0.25),
        Math.round(availableToSave * 0.5),
        Math.round(availableToSave * 0.75),
        Math.round(availableToSave),
      ].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
    : [];

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
          <h3 className="text-lg font-bold text-white">Tasarrufa Ekle</h3>
          <button id="close-savings-modal" onClick={onClose} className="btn-secondary !px-2 !py-2">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {quickAmounts.length > 0 && (
            <div>
              <label className="label">Hızlı Seç</label>
              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    id={`quick-save-${i}`}
                    onClick={() => setAmount(q.toString())}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all text-left ${
                      amount === q.toString() ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300' : 'glass-card text-white/60'
                    }`}
                  >
                    <span className="block font-semibold text-white">{formatCurrency(q)}</span>
                    <span className="text-white/30 text-xs">
                      {i === 0 ? '%25' : i === 1 ? '%50' : i === 2 ? '%75' : '%100'} ({i === 3 ? 'tamamı' : ''})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Tutar (₺)</label>
            <input
              id="savings-amount"
              type="number"
              className="input-field text-xl font-bold"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              required
            />
            {amount && (
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-violet-400 text-sm font-medium">{formatCurrency(parseFloat(amount) || 0)}</p>
                {availableToSave > 0 && parseFloat(amount) > availableToSave && (
                  <p className="text-amber-400 text-xs">⚠ Mevcut bakiyenizi aşıyor</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="label">Not (isteğe bağlı)</label>
            <input
              id="savings-note"
              type="text"
              className="input-field"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Bu dönem birikimi..."
            />
          </div>

          <button id="submit-savings" type="submit" className="w-full py-4 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/20 text-violet-300 font-semibold flex items-center justify-center gap-2 transition-all">
            <PiggyBank size={18} /> Tasarrufa Ekle
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <p className="text-white/50 mb-1">{label}</p>
        <p className="text-violet-300 font-bold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

export default function Savings() {
  const { activePeriod, savings, deleteSaving, incomes, obligations, socialWeeks } = useApp();
  const [showModal, setShowModal] = useState(false);

  const pid = activePeriod?.id;
  const today = todayStr();
  const projection = calcProjection(incomes, obligations, socialWeeks, savings, pid, today);
  const availableToSave = projection.minBalance;
  const periodSavings = calcPeriodSavings(savings, pid);
  const cumulative = calcCumulativeSavings(savings);

  // Chart data
  const chartData = savings
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .reduce((acc, s, i) => {
      const prev = acc[i - 1]?.total || 0;
      acc.push({
        name: formatDate(s.date),
        total: prev + s.amount,
        amount: s.amount,
      });
      return acc;
    }, []);

  const sorted = [...savings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tasarruf</h1>
          <p className="text-white/40 text-sm mt-0.5">Birikimlerinizi yönetin</p>
        </div>
        {activePeriod && (
          <button
            id="open-add-savings"
            onClick={() => setShowModal(true)}
            className="py-2 px-4 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/20 text-violet-300 font-semibold text-sm flex items-center gap-1.5 transition-all"
          >
            <Plus size={16} /> Ekle
          </button>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div variants={fadeUp} className="glass-card p-4 bg-gradient-to-br from-violet-500/20 to-violet-500/5 border-violet-500/15">
          <p className="stat-label mb-2">Toplam Birikim</p>
          <p className="text-2xl font-bold text-violet-300 tabular-nums">{formatCurrency(cumulative)}</p>
          <p className="text-white/30 text-xs mt-1">tüm zamanlar</p>
        </motion.div>
        <motion.div variants={fadeUp} className="glass-card p-4 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/10">
          <p className="stat-label mb-2">Ayırılabilir</p>
          <p className={`text-2xl font-bold tabular-nums ${availableToSave > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(Math.max(0, availableToSave))}
          </p>
          <p className="text-white/30 text-xs mt-1">bu dönem</p>
        </motion.div>
      </div>

      {/* Available to save prompt */}
      {activePeriod && availableToSave > 0 && (
        <motion.div variants={fadeUp}>
          <button
            id="prompt-add-savings"
            onClick={() => setShowModal(true)}
            className="w-full glass-card p-4 flex items-center justify-between border-emerald-500/15 hover:border-emerald-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Target size={18} className="text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium text-sm">Tasarrufa ayır</p>
                <p className="text-emerald-400 text-xs mt-0.5">{formatCurrency(availableToSave)} ayırılabilir</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-all">
              <Plus size={16} className="text-violet-400" />
            </div>
          </button>
        </motion.div>
      )}

      {/* Chart */}
      {chartData.length >= 2 && (
        <motion.div variants={fadeUp} className="glass-card p-5">
          <h3 className="section-title mb-4">Birikim Büyümesi</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₺${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={2} fill="url(#savingsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* History */}
      <motion.div variants={fadeUp} className="space-y-2">
        <h3 className="section-title">Birikim Geçmişi</h3>
        {sorted.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <PiggyBank size={36} className="text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Henüz tasarruf kaydı yok</p>
          </div>
        ) : (
          <AnimatePresence>
            {sorted.map(saving => {
              const isCurrent = saving.periodId === pid;
              return (
                <motion.div
                  key={saving.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  className="glass-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCurrent ? 'bg-violet-500/15' : 'bg-white/5'}`}>
                        <PiggyBank size={18} className={isCurrent ? 'text-violet-400' : 'text-white/30'} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{saving.note || 'Tasarruf'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-white/40 text-xs">{formatDate(saving.date)}</p>
                          {isCurrent && <span className="badge badge-info text-[10px]">Bu dönem</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <p className="text-violet-300 font-bold tabular-nums">{formatCurrency(saving.amount)}</p>
                      {isCurrent && activePeriod && (
                        <button
                          id={`delete-saving-${saving.id}`}
                          onClick={() => deleteSaving(saving.id)}
                          className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400/60 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <span className="text-white/20 text-xs tabular-nums">Kümülatif: {formatCurrency(saving.cumulativeTotal)}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <AddSavingsModal
            availableToSave={availableToSave}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
