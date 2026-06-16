import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Coffee, X, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, todayStr } from '../utils/formatters';
import {
  calcWeekSpending, calcWeekRemaining, calcTotalSocialSpending,
  calcTotalSocialBudget, getWeekDateRange
} from '../utils/calculations';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function AddEntryModal({ week, onClose }) {
  const { addSocialEntry } = useApp();
  const [form, setForm] = useState({ date: todayStr(), description: '', amount: '' });
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    addSocialEntry(week.id, form);
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
          <h3 className="text-lg font-bold text-white">Harcama Ekle</h3>
          <button id="close-entry-modal" onClick={onClose} className="btn-secondary !px-2 !py-2">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tarih</label>
            <input id="entry-date" type="date" className="input-field" value={form.date} onChange={e => update('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Açıklama</label>
            <input
              id="entry-description"
              type="text"
              className="input-field"
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Akşam yemeği, Sinema..."
            />
          </div>
          <div>
            <label className="label">Tutar (₺)</label>
            <input
              id="entry-amount"
              type="number"
              className="input-field text-xl font-bold"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              placeholder="0"
              inputMode="decimal"
              required
            />
            {form.amount && (
              <p className="text-amber-400 text-sm mt-1.5 font-medium">
                {formatCurrency(parseFloat(form.amount) || 0)}
              </p>
            )}
          </div>
          <button id="submit-entry" type="submit" className="w-full btn-primary !bg-amber-500 hover:!bg-amber-400 mt-2 py-4">
            <Plus size={18} /> Harcama Kaydet
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function SetBudgetModal({ weekNumber, current, onClose }) {
  const { addOrUpdateSocialWeek } = useApp();
  const [budget, setBudget] = useState(current?.toString() || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!budget || parseFloat(budget) <= 0) return;
    addOrUpdateSocialWeek(weekNumber, parseFloat(budget));
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
          <h3 className="text-lg font-bold text-white">{weekNumber}. Hafta Bütçesi</h3>
          <button id="close-budget-modal" onClick={onClose} className="btn-secondary !px-2 !py-2">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Haftalık Bütçe (₺)</label>
            <input
              id="weekly-budget-input"
              type="number"
              className="input-field text-xl font-bold"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              autoFocus
              required
            />
            {budget && (
              <p className="text-amber-400 text-sm mt-1.5 font-medium">
                {formatCurrency(parseFloat(budget) || 0)}
              </p>
            )}
          </div>
          <button id="submit-budget" type="submit" className="w-full btn-primary !bg-amber-500 hover:!bg-amber-400 py-4">
            Bütçeyi Ayarla
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function WeekCard({ week, periodStartDate, isActive }) {
  const { deleteSocialEntry } = useApp();
  const [expanded, setExpanded] = useState(week.weekNumber === getWeekNumberFromStart(periodStartDate));
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showSetBudget, setShowSetBudget] = useState(false);

  const spending = calcWeekSpending(week);
  const remaining = calcWeekRemaining(week);
  const progress = week.weeklyBudget > 0 ? Math.min(100, (spending / week.weeklyBudget) * 100) : 0;
  const isOverBudget = remaining < 0;
  const { weekStart, weekEnd } = getWeekDateRange(periodStartDate, week.weekNumber);

  return (
    <>
      <div className={`glass-card overflow-hidden ${isOverBudget ? 'border-rose-500/20' : ''}`}>
        {/* Week header */}
        <button
          id={`week-${week.weekNumber}-header`}
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOverBudget ? 'bg-rose-500/15' : 'bg-amber-500/10'}`}>
              <Coffee size={16} className={isOverBudget ? 'text-rose-400' : 'text-amber-400'} />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">{week.weekNumber}. Hafta</p>
              <p className="text-white/30 text-xs">{formatDate(weekStart)} – {formatDate(weekEnd)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={`font-bold tabular-nums text-sm ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isOverBudget ? '-' : '+'}{formatCurrency(Math.abs(remaining))}
              </p>
              <p className="text-white/30 text-xs">{isOverBudget ? 'aşıldı' : 'kalan'}</p>
            </div>
            {expanded ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
          </div>
        </button>

        {/* Progress */}
        <div className="px-4 pb-3">
          <div className="flex justify-between text-xs text-white/30 mb-1.5">
            <span>{formatCurrency(spending)} harcandı</span>
            <span>Bütçe: {formatCurrency(week.weeklyBudget)}</span>
          </div>
          <div className="progress-bar h-2">
            <div
              className={`progress-fill ${progress >= 100 ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {/* Expanded entries */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <div className="p-4 space-y-2">
                {(week.entries || []).length === 0 ? (
                  <p className="text-white/25 text-sm text-center py-2">Henüz harcama yok</p>
                ) : (
                  [...(week.entries || [])].sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => (
                    <div key={entry.id} className="flex items-center justify-between py-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm truncate">{entry.description || 'Harcama'}</p>
                        <p className="text-white/30 text-xs">{formatDate(entry.date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-amber-400 font-medium text-sm tabular-nums">{formatCurrency(entry.amount)}</p>
                        {isActive && (
                          <button
                            id={`delete-entry-${entry.id}`}
                            onClick={() => deleteSocialEntry(week.id, entry.id)}
                            className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-400/60 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-all"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {isActive && (
                  <div className="flex gap-2 pt-2">
                    <button
                      id={`add-entry-week-${week.weekNumber}`}
                      onClick={() => setShowAddEntry(true)}
                      className="flex-1 btn-secondary text-sm !py-2"
                    >
                      <Plus size={14} /> Harcama
                    </button>
                    <button
                      id={`set-budget-week-${week.weekNumber}`}
                      onClick={() => setShowSetBudget(true)}
                      className="flex-1 btn-secondary text-sm !py-2"
                    >
                      <Edit3 size={14} /> Bütçe
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddEntry && <AddEntryModal week={week} onClose={() => setShowAddEntry(false)} />}
        {showSetBudget && (
          <SetBudgetModal
            weekNumber={week.weekNumber}
            current={week.weeklyBudget}
            onClose={() => setShowSetBudget(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function getWeekNumberFromStart(startDate) {
  const start = new Date(startDate + 'T00:00:00');
  const today = new Date();
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return Math.floor(diff / 7) + 1;
}

function AddWeekSection({ activePeriod, existingWeeks }) {
  const { addOrUpdateSocialWeek } = useApp();
  const [showModal, setShowModal] = useState(false);

  const maxWeek = existingWeeks.length > 0 ? Math.max(...existingWeeks.map(w => w.weekNumber)) : 0;
  const currentWeek = getWeekNumberFromStart(activePeriod.startDate);
  const nextWeekToAdd = Math.max(currentWeek, maxWeek + 1);

  // Check if current week already exists
  const currentWeekExists = existingWeeks.some(w => w.weekNumber === currentWeek);

  if (currentWeekExists && existingWeeks.length > 0) return null;

  return (
    <>
      <button
        id="add-new-week"
        onClick={() => setShowModal(true)}
        className="w-full glass-card p-4 flex items-center justify-center gap-2 border-dashed border-white/[0.08] hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
      >
        <Plus size={18} className="text-amber-400" />
        <span className="text-amber-400/80 font-medium text-sm">
          {currentWeekExists ? `${nextWeekToAdd}. Haftayı Ekle` : `${currentWeek}. Haftayı Başlat`}
        </span>
      </button>

      <AnimatePresence>
        {showModal && (
          <SetBudgetModal
            weekNumber={currentWeekExists ? nextWeekToAdd : currentWeek}
            current={existingWeeks[existingWeeks.length - 1]?.weeklyBudget}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function Social() {
  const { activePeriod, socialWeeks } = useApp();
  const pid = activePeriod?.id;
  const weeks = socialWeeks.filter(w => w.periodId === pid).sort((a, b) => b.weekNumber - a.weekNumber);

  const totalBudget = calcTotalSocialBudget(socialWeeks, pid);
  const totalSpending = calcTotalSocialSpending(socialWeeks, pid);
  const totalRemaining = totalBudget - totalSpending;
  const overallProgress = totalBudget > 0 ? Math.min(100, (totalSpending / totalBudget) * 100) : 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <h1 className="page-title">Sosyal Bütçe</h1>
        <p className="text-white/40 text-sm mt-0.5">Haftalık değişken harcamalar</p>
      </motion.div>

      {/* Period summary */}
      <motion.div variants={fadeUp} className="glass-card p-5 bg-gradient-to-br from-amber-500/15 to-transparent border-amber-500/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="stat-label mb-1">Dönem Toplamı</p>
            <p className="text-3xl font-bold text-white tabular-nums">{formatCurrency(totalSpending)}</p>
          </div>
          <div className="text-right">
            <p className={`font-semibold tabular-nums ${totalRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(Math.abs(totalRemaining))}
            </p>
            <p className="text-white/30 text-xs">{totalRemaining >= 0 ? 'kalan' : 'aşıldı'}</p>
          </div>
        </div>
        <div className="progress-bar h-2">
          <div
            className={`progress-fill ${overallProgress >= 100 ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-white/40 text-xs">{Math.round(overallProgress)}% kullanıldı</p>
          <p className="text-white/40 text-xs">Bütçe: {formatCurrency(totalBudget)}</p>
        </div>
      </motion.div>

      {/* Add week */}
      {activePeriod && (
        <motion.div variants={fadeUp}>
          <AddWeekSection activePeriod={activePeriod} existingWeeks={weeks} />
        </motion.div>
      )}

      {/* Week cards */}
      {weeks.length === 0 ? (
        <motion.div variants={fadeUp} className="glass-card p-10 text-center">
          <Coffee size={36} className="text-white/15 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Henüz hafta bütçesi girilmedi</p>
          <p className="text-white/20 text-xs mt-1">Yukarıdan yeni hafta başlatın</p>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-3">
          {weeks.map(week => (
            <WeekCard
              key={week.id}
              week={week}
              periodStartDate={activePeriod?.startDate}
              isActive={!!activePeriod}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
