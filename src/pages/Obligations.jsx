import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle2, Circle, X, Home, Zap, CreditCard, Repeat, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, todayStr } from '../utils/formatters';
import { calcTotalObligations, calcPaidObligations } from '../utils/calculations';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const categories = [
  { key: 'kira', label: 'Kira', icon: Home, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { key: 'fatura', label: 'Fatura', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { key: 'kredi', label: 'Kredi', icon: CreditCard, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { key: 'abonelik', label: 'Abonelik', icon: Repeat, color: 'text-accent-glow', bg: 'bg-accent-blue/10' },
  { key: 'diger', label: 'Diğer', icon: MoreHorizontal, color: 'text-white/50', bg: 'bg-white/5' },
];

const getCategoryInfo = (key) => categories.find(c => c.key === key) || categories[4];

function AddObligationModal({ onClose }) {
  const { addObligation } = useApp();
  const [form, setForm] = useState({
    name: '',
    amount: '',
    dueDate: '',
    category: 'kira',
  });
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.amount || parseFloat(form.amount) <= 0) return;
    addObligation(form);
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
          <h3 className="text-lg font-bold text-white">Gider Ekle</h3>
          <button id="close-obligation-modal" onClick={onClose} className="btn-secondary !px-2 !py-2">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Kategori</label>
            <div className="grid grid-cols-5 gap-2">
              {categories.map(({ key, label, icon: Icon, color, bg }) => (
                <button
                  key={key}
                  type="button"
                  id={`cat-${key}`}
                  onClick={() => update('category', key)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-150 border ${
                    form.category === key
                      ? 'border-accent-blue/50 bg-accent-blue/10'
                      : 'border-transparent glass-card'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon size={14} className={color} />
                  </div>
                  <span className={`text-[10px] font-medium ${form.category === key ? 'text-accent-blue' : 'text-white/40'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Gider Adı</label>
            <input
              id="obligation-name"
              type="text"
              className="input-field"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Kira, Elektrik faturası..."
              required
            />
          </div>

          <div>
            <label className="label">Tutar (₺)</label>
            <input
              id="obligation-amount"
              type="number"
              className="input-field text-xl font-bold"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              placeholder="0"
              inputMode="decimal"
              required
            />
            {form.amount && (
              <p className="text-rose-400 text-sm mt-1.5 font-medium">
                {formatCurrency(parseFloat(form.amount) || 0)}
              </p>
            )}
          </div>

          <div>
            <label className="label">Son Ödeme Tarihi (isteğe bağlı)</label>
            <input
              id="obligation-due-date"
              type="date"
              className="input-field"
              value={form.dueDate}
              onChange={e => update('dueDate', e.target.value)}
            />
          </div>

          <button id="submit-obligation" type="submit" className="w-full btn-primary mt-2 py-4">
            <Plus size={18} />
            Gider Kaydet
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function ObligationItem({ obligation, isActive, onToggle, onDelete }) {
  const catInfo = getCategoryInfo(obligation.category);
  const Icon = catInfo.icon;
  const today = todayStr();
  const isOverdue = obligation.dueDate && !obligation.isPaid && obligation.dueDate < today;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`glass-card p-4 transition-all duration-300 ${obligation.isPaid ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3">
        {isActive && (
          <button
            id={`toggle-obligation-${obligation.id}`}
            onClick={() => onToggle(obligation.id)}
            className={`transition-all duration-200 flex-shrink-0 ${obligation.isPaid ? 'text-emerald-400' : 'text-white/20 hover:text-white/40'}`}
          >
            {obligation.isPaid
              ? <CheckCircle2 size={22} />
              : <Circle size={22} />
            }
          </button>
        )}
        <div className={`w-9 h-9 rounded-xl ${catInfo.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={catInfo.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium truncate ${obligation.isPaid ? 'line-through text-white/40' : 'text-white'}`}>
              {obligation.name}
            </p>
            {isOverdue && (
              <span className="badge badge-danger flex-shrink-0 text-[10px]">
                <AlertTriangle size={9} /> Geçti
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`badge ${catInfo.bg.replace('bg-', 'bg-').replace('/10', '/15')} ${catInfo.color} border-0 text-[10px]`}>
              {catInfo.label}
            </span>
            {obligation.dueDate && (
              <p className="text-white/30 text-xs">{formatDate(obligation.dueDate)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className={`font-bold tabular-nums text-sm ${obligation.isPaid ? 'text-white/30' : 'text-white'}`}>
            {formatCurrency(obligation.amount)}
          </p>
          {isActive && (
            <button
              id={`delete-obligation-${obligation.id}`}
              onClick={() => onDelete(obligation.id)}
              className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400/60 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-all"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Obligations() {
  const { activePeriod, obligations, toggleObligationPaid, deleteObligation } = useApp();
  const [showModal, setShowModal] = useState(false);

  const pid = activePeriod?.id;
  const periodObligations = obligations.filter(o => o.periodId === pid);
  const total = calcTotalObligations(obligations, pid);
  const paid = calcPaidObligations(obligations, pid);
  const remaining = total - paid;
  const progress = total > 0 ? (paid / total) * 100 : 0;

  const unpaid = periodObligations.filter(o => !o.isPaid).sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
  const paidList = periodObligations.filter(o => o.isPaid);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <h1 className="page-title">Yükümlülükler</h1>
        {activePeriod && (
          <button id="open-add-obligation" onClick={() => setShowModal(true)} className="btn-primary !py-2 !px-4 text-sm">
            <Plus size={16} /> Ekle
          </button>
        )}
      </motion.div>

      {/* Summary card */}
      <motion.div variants={fadeUp} className="glass-card p-5 bg-gradient-to-br from-rose-500/15 to-transparent border-rose-500/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="stat-label mb-1">Toplam Rezerve</p>
            <p className="text-3xl font-bold text-white tabular-nums">{formatCurrency(total)}</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-400 font-semibold tabular-nums">{formatCurrency(paid)}</p>
            <p className="text-white/30 text-xs">ödendi</p>
          </div>
        </div>
        <div className="progress-bar h-2">
          <div
            className="progress-fill bg-gradient-to-r from-emerald-500 to-emerald-400"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-white/40 text-xs">{Math.round(progress)}% ödendi</p>
          <p className="text-rose-400 text-xs tabular-nums">{formatCurrency(remaining)} kalan</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {categories.map(cat => {
            const catTotal = periodObligations.filter(o => o.category === cat.key).reduce((s, o) => s + o.amount, 0);
            if (catTotal === 0) return null;
            return (
              <div key={cat.key} className="text-center">
                <p className={`text-sm font-semibold tabular-nums ${cat.color}`}>{formatCurrency(catTotal)}</p>
                <p className="text-white/30 text-[10px] mt-0.5">{cat.label}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Unpaid */}
      {unpaid.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-2">
          <h3 className="section-title">Bekleyen ({unpaid.length})</h3>
          <AnimatePresence>
            {unpaid.map(o => (
              <ObligationItem
                key={o.id}
                obligation={o}
                isActive={!!activePeriod && o.periodId === activePeriod?.id}
                onToggle={toggleObligationPaid}
                onDelete={deleteObligation}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Paid */}
      {paidList.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-2">
          <h3 className="section-title text-white/40">Ödenenler ({paidList.length})</h3>
          <AnimatePresence>
            {paidList.map(o => (
              <ObligationItem
                key={o.id}
                obligation={o}
                isActive={!!activePeriod && o.periodId === activePeriod?.id}
                onToggle={toggleObligationPaid}
                onDelete={deleteObligation}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {periodObligations.length === 0 && (
        <motion.div variants={fadeUp} className="glass-card p-10 text-center">
          <CheckCircle2 size={36} className="text-white/15 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Henüz gider eklenmedi</p>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && <AddObligationModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
