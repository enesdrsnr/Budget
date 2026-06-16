import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Clock, Wallet, AlertCircle,
  ChevronRight, Plus, PiggyBank, Target
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calcTotalIncome, calcTotalObligations, calcTotalSocialSpending,
  calcAvailableToSave, calcPeriodSavings, calcCumulativeSavings,
  calcPaidObligations, calcWeekRemaining
} from '../utils/calculations';
import { formatCurrency, formatDate, daysUntil, formatDateLong } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function StatCard({ label, value, sub, color = 'blue', icon: Icon, onClick, id }) {
  const colors = {
    blue: 'from-accent-blue/20 to-accent-blue/5 border-accent-blue/15',
    green: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/15',
    red: 'from-rose-500/20 to-rose-500/5 border-rose-500/15',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/15',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/15',
  };
  const iconColors = {
    blue: 'text-accent-blue bg-accent-blue/10',
    green: 'text-emerald-400 bg-emerald-400/10',
    red: 'text-rose-400 bg-rose-400/10',
    violet: 'text-violet-400 bg-violet-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
  };

  return (
    <motion.div
      id={id}
      variants={fadeUp}
      onClick={onClick}
      className={`glass-card bg-gradient-to-br ${colors[color]} p-4 ${onClick ? 'cursor-pointer active:scale-98' : ''} transition-transform`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="stat-label mb-2">{label}</p>
          <p className="stat-value truncate">{value}</p>
          {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${iconColors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      {onClick && (
        <div className="flex items-center gap-1 mt-3 text-white/30 text-xs">
          <span>Detay</span>
          <ChevronRight size={12} />
        </div>
      )}
    </motion.div>
  );
}

function CashFlowBar({ income, obligations, social, savings, free }) {
  const total = income || 1;
  const obligPct = Math.min(100, (obligations / total) * 100);
  const socialPct = Math.min(100, (social / total) * 100);
  const savingsPct = Math.min(100, (savings / total) * 100);
  const freePct = Math.max(0, Math.min(100, (free / total) * 100));

  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-4">Nakit Akışı</h3>
      <div className="space-y-3">
        <FlowRow label="Toplam Gelir" amount={income} color="bg-emerald-500" pct={100} />
        <FlowRow label="Zorunlu Giderler" amount={-obligations} color="bg-rose-500" pct={obligPct} negative />
        <FlowRow label="Sosyal Harcamalar" amount={-social} color="bg-amber-500" pct={socialPct} negative />
        <FlowRow label="Tasarruf" amount={-savings} color="bg-violet-500" pct={savingsPct} negative />
        <div className="divider" />
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold ${free >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Serbest Bakiye
          </span>
          <span className={`font-bold text-lg tabular-nums ${free >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(free)}
          </span>
        </div>
      </div>
    </div>
  );
}

function FlowRow({ label, amount, color, pct, negative }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-white/60 text-sm">{label}</span>
        </div>
        <span className={`text-sm font-medium tabular-nums ${negative ? 'text-white/60' : 'text-emerald-400'}`}>
          {negative && amount !== 0 ? '-' : ''}{formatCurrency(Math.abs(amount))}
        </span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { activePeriod, incomes, obligations, socialWeeks, savings } = useApp();

  if (!activePeriod) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle size={48} className="text-white/20" />
        <p className="text-white/40">Aktif dönem bulunamadı</p>
      </div>
    );
  }

  const pid = activePeriod.id;
  const totalIncome = calcTotalIncome(incomes, pid);
  const totalOblig = calcTotalObligations(obligations, pid);
  const paidOblig = calcPaidObligations(obligations, pid);
  const totalSocial = calcTotalSocialSpending(socialWeeks, pid);
  const periodSavings = calcPeriodSavings(savings, pid);
  const availableToSave = calcAvailableToSave(incomes, obligations, socialWeeks, savings, pid);
  const cumulativeSavings = calcCumulativeSavings(savings);
  const freeCash = totalIncome - totalOblig - totalSocial - periodSavings;

  const daysLeft = activePeriod.expectedNextIncomeDate
    ? daysUntil(activePeriod.expectedNextIncomeDate)
    : null;

  // Current week's social
  const currentWeek = socialWeeks
    .filter(w => w.periodId === pid)
    .sort((a, b) => b.weekNumber - a.weekNumber)[0];
  const weekRemaining = currentWeek ? calcWeekRemaining(currentWeek) : null;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Merhaba 👋</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Dönem: {formatDate(activePeriod.startDate)}
            {activePeriod.expectedNextIncomeDate && ` – ${formatDate(activePeriod.expectedNextIncomeDate)}`}
          </p>
        </div>
        {daysLeft !== null && (
          <div className={`badge ${daysLeft <= 7 ? 'badge-danger' : daysLeft <= 14 ? 'badge-warning' : 'badge-info'}`}>
            <Clock size={11} />
            {daysLeft > 0 ? `${daysLeft} gün` : daysLeft === 0 ? 'Bugün!' : 'Geçti'}
          </div>
        )}
      </motion.div>

      {/* Primary balance */}
      <motion.div
        variants={fadeUp}
        className="glass-card p-5 bg-gradient-to-br from-accent-blue/15 to-violet-500/5 border-accent-blue/10"
      >
        <p className="stat-label mb-2">Toplam Gelir</p>
        <p className="text-4xl font-bold text-white tabular-nums">{formatCurrency(totalIncome)}</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-rose-400 font-semibold text-sm tabular-nums">{formatCurrency(totalOblig)}</p>
            <p className="text-white/30 text-xs mt-0.5">Yükümlülükler</p>
          </div>
          <div className="text-center border-x border-white/[0.06]">
            <p className="text-amber-400 font-semibold text-sm tabular-nums">{formatCurrency(totalSocial)}</p>
            <p className="text-white/30 text-xs mt-0.5">Sosyal</p>
          </div>
          <div className="text-center">
            <p className={`font-semibold text-sm tabular-nums ${freeCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(freeCash)}
            </p>
            <p className="text-white/30 text-xs mt-0.5">Serbest</p>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          id="dash-obligations-card"
          label="Ödenen Gider"
          value={formatCurrency(paidOblig)}
          sub={`${formatCurrency(totalOblig - paidOblig)} kalan`}
          color="red"
          icon={TrendingDown}
          onClick={() => navigate('/yükümler')}
        />
        <StatCard
          id="dash-social-card"
          label="Bu Hafta Sosyal"
          value={weekRemaining !== null ? formatCurrency(Math.max(0, weekRemaining)) : '—'}
          sub={weekRemaining !== null && weekRemaining < 0 ? `₺${Math.abs(weekRemaining).toFixed(0)} aşıldı` : 'kalan bütçe'}
          color={weekRemaining !== null && weekRemaining < 0 ? 'red' : 'amber'}
          icon={TrendingUp}
          onClick={() => navigate('/sosyal')}
        />
        <StatCard
          id="dash-savings-card"
          label="Toplam Birikim"
          value={formatCurrency(cumulativeSavings)}
          sub="tüm zamanlar"
          color="violet"
          icon={PiggyBank}
          onClick={() => navigate('/tasarruf')}
        />
        <StatCard
          id="dash-available-save-card"
          label="Ayırılabilir"
          value={formatCurrency(Math.max(0, availableToSave))}
          sub="tasarrufa eklenebilir"
          color="green"
          icon={Target}
          onClick={() => navigate('/tasarruf')}
        />
      </div>

      {/* Cash flow breakdown */}
      <motion.div variants={fadeUp}>
        <CashFlowBar
          income={totalIncome}
          obligations={totalOblig}
          social={totalSocial}
          savings={periodSavings}
          free={freeCash}
        />
      </motion.div>

      {/* Next income countdown */}
      {activePeriod.expectedNextIncomeDate && (
        <motion.div variants={fadeUp} className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="stat-label mb-1">Sonraki Gelir</p>
            <p className="text-white font-semibold text-sm">{formatDateLong(activePeriod.expectedNextIncomeDate)}</p>
            {activePeriod.expectedNextIncomeAmount && (
              <p className="text-emerald-400 text-sm font-medium mt-0.5">
                ~{formatCurrency(activePeriod.expectedNextIncomeAmount)}
              </p>
            )}
          </div>
          <div className={`text-center px-4 py-3 rounded-xl ${daysLeft <= 7 ? 'bg-rose-500/15' : 'bg-accent-blue/10'}`}>
            <p className={`text-2xl font-bold tabular-nums ${daysLeft <= 7 ? 'text-rose-400' : 'text-accent-blue'}`}>
              {daysLeft !== null ? Math.max(0, daysLeft) : '—'}
            </p>
            <p className="text-white/30 text-xs">gün</p>
          </div>
        </motion.div>
      )}

      {/* Quick add income button */}
      <motion.div variants={fadeUp}>
        <button
          id="dash-quick-add-income"
          onClick={() => navigate('/gelir')}
          className="w-full btn-success"
        >
          <Plus size={18} />
          Gelir Ekle
        </button>
      </motion.div>
    </motion.div>
  );
}
