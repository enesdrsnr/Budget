import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, TrendingUp, Calendar, X, ChevronDown, Edit3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, formatDateLong, todayStr, daysUntil } from '../utils/formatters';
import { calcTotalIncome } from '../utils/calculations';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const incomeTypes = {
  regular: { label: 'Düzenli', color: 'badge-info' },
  ipo_profit: { label: 'IPO Kârı', color: 'badge-success' },
  bonus: { label: 'Bonus', color: 'badge-warning' },
  other: { label: 'Diğer', color: 'badge-neutral' },
};

const sourceOptions = ['Maaş', 'Serbest Meslek', 'Kira Geliri', 'Satış', 'IPO Kârı', 'Diğer'];

function AddIncomeModal({ onClose }) {
  const { addIncome } = useApp();
  const [form, setForm] = useState({
    date: todayStr(),
    source: 'Maaş',
    customSource: '',
    amount: '',
    type: 'regular',
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [showCustom, setShowCustom] = useState(false);

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
                    !showCustom && form.source === s
                      ? 'bg-accent-blue text-white'
                      : 'glass-card text-white/50 hover:text-white/80'
                  }`}
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                id="source-custom"
                onClick={() => setShowCustom(true)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  showCustom ? 'bg-accent-blue text-white' : 'glass-card text-white/50'
                }`}
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
              <p className="text-emerald-400 text-sm mt-1.5 font-medium">
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

function ExpectedIncomeSection() {
  const { activePeriod, updatePeriodExpectedIncome } = useApp();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(activePeriod?.expectedNextIncomeDate || '');
  const [amount, setAmount] = useState(activePeriod?.expectedNextIncomeAmount || '');

  if (!activePeriod) return null;

  const daysLeft = activePeriod.expectedNextIncomeDate
    ? daysUntil(activePeriod.expectedNextIncomeDate)
    : null;

  const handleSave = () => {
    updatePeriodExpectedIncome(activePeriod.id, date || null, parseFloat(amount) || null);
    setEditing(false);
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title">Sonraki Gelir Beklentisi</h3>
        <button
          id="edit-expected-income"
          onClick={() => setEditing(!editing)}
          className="btn-secondary !px-3 !py-1.5 text-xs"
        >
          <Edit3 size={13} /> Düzenle
        </button>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="label">Beklenen Tarih</label>
            <input id="expected-date" type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Tahmini Tutar (₺)</label>
            <input id="expected-amount" type="number" className="input-field" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" inputMode="decimal" />
          </div>
          <div className="flex gap-2">
            <button id="save-expected" onClick={handleSave} className="flex-1 btn-primary !py-2.5 text-sm">Kaydet</button>
            <button id="cancel-expected" onClick={() => setEditing(false)} className="btn-secondary !py-2.5 text-sm">İptal</button>
          </div>
        </div>
      ) : activePeriod.expectedNextIncomeDate ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">{formatDateLong(activePeriod.expectedNextIncomeDate)}</p>
            {activePeriod.expectedNextIncomeAmount && (
              <p className="text-emerald-400 text-sm mt-0.5">~{formatCurrency(activePeriod.expectedNextIncomeAmount)}</p>
            )}
          </div>
          {daysLeft !== null && (
            <div className={`px-3 py-2 rounded-xl text-center ${daysLeft <= 7 ? 'bg-rose-500/15' : 'bg-accent-blue/10'}`}>
              <p className={`text-xl font-bold tabular-nums ${daysLeft <= 7 ? 'text-rose-400' : 'text-accent-blue'}`}>
                {Math.max(0, daysLeft)}
              </p>
              <p className="text-white/30 text-[10px]">gün kaldı</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-white/30 text-sm">Henüz beklenti girilmedi</p>
      )}
    </div>
  );
}

export default function Income() {
  const { activePeriod, incomes, deleteIncome, periods } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [viewPeriodId, setViewPeriodId] = useState(activePeriod?.id || null);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const currentPeriodId = viewPeriodId || activePeriod?.id;
  const periodIncomes = incomes.filter(i => i.periodId === currentPeriodId);
  const totalIncome = calcTotalIncome(incomes, currentPeriodId);
  const viewedPeriod = periods.find(p => p.id === currentPeriodId);
  const isActive = currentPeriodId === activePeriod?.id;

  const sorted = [...periodIncomes].sort((a, b) => new Date(b.date) - new Date(a.date));

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

      {/* Total */}
      <motion.div variants={fadeUp} className="glass-card p-5 bg-gradient-to-br from-emerald-500/15 to-transparent border-emerald-500/10">
        <p className="stat-label mb-1">Dönem Toplam Gelir</p>
        <p className="text-3xl font-bold text-emerald-400 tabular-nums">{formatCurrency(totalIncome)}</p>
        <p className="text-white/30 text-xs mt-1">{periodIncomes.length} gelir kaydı</p>
      </motion.div>

      {/* Expected income */}
      {isActive && (
        <motion.div variants={fadeUp}>
          <ExpectedIncomeSection />
        </motion.div>
      )}

      {/* Income list */}
      <motion.div variants={fadeUp} className="space-y-2">
        <h3 className="section-title">Gelir Geçmişi</h3>
        {sorted.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <TrendingUp size={32} className="text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Henüz gelir kaydı yok</p>
          </div>
        ) : (
          <AnimatePresence>
            {sorted.map(income => {
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
