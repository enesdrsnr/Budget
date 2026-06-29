import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Clock, Wallet, AlertCircle,
  ChevronRight, Plus, PiggyBank, Target, AlertTriangle,
  ArrowDown, ArrowUp, Calendar, BarChart3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calcCashOnHand, calcUpcomingIncome, calcProjection,
  calcTotalSocialSpending, calcPeriodSavings, calcCumulativeSavings,
  calcWeekRemaining, calcPaidObligations,
  calcIpoLockedAmount, calcTotalIpoLocked,
} from '../utils/calculations';
import { formatCurrency, formatDate, formatDateLong, todayStr } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ─────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Projection timeline
// ─────────────────────────────────────────────
function ProjectionTimeline({ timeline, startBalance, undatedObligations }) {
  if (timeline.length === 0 && undatedObligations.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-1">Nakit Projeksiyonu</h3>
      <p className="text-white/30 text-xs mb-4">Yaklaşan gelir ve yükümlülükler sırasıyla</p>

      {/* Starting balance row */}
      <div className="flex items-center justify-between py-2 border-b border-white/[0.06] mb-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
            <Wallet size={12} className="text-white/40" />
          </div>
          <span className="text-white/50 text-sm">Bugünkü bakiye</span>
        </div>
        <span className={`font-semibold text-sm tabular-nums ${startBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
          {formatCurrency(startBalance)}
        </span>
      </div>

      {/* Events */}
      <div className="space-y-1">
        {timeline.map((event, i) => {
          const isIncome = event.type === 'income';
          return (
            <div key={event.id || i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                  {isIncome
                    ? <ArrowUp size={12} className="text-emerald-400" />
                    : <ArrowDown size={12} className="text-rose-400" />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-white/70 text-sm truncate">{event.label}</p>
                  <p className="text-white/30 text-xs">{formatDate(event.date)}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className={`text-sm font-medium tabular-nums ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(Math.abs(event.amount))}
                </p>
                <p className={`text-xs tabular-nums ${event.balance >= 0 ? 'text-white/30' : 'text-rose-400'}`}>
                  = {formatCurrency(event.balance)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Undated warnings */}
      {undatedObligations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} className="text-amber-400" />
            <p className="text-amber-400 text-xs font-medium">Tarihi girilmemiş yükümlülükler</p>
          </div>
          {undatedObligations.map(o => (
            <div key={o.id} className="flex items-center justify-between py-1.5">
              <p className="text-white/50 text-sm">{o.name}</p>
              <p className="text-amber-400 text-sm tabular-nums">{formatCurrency(o.amount)}</p>
            </div>
          ))}
          <p className="text-white/25 text-xs mt-2">Bu giderler projeksiyon dışında. Vade tarihi ekleyin.</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// IPO Locked Money Card
// ─────────────────────────────────────────────
function IpoLockedCard({ applications, today, onNavigate }) {
  const totalLocked = calcTotalIpoLocked(applications);
  const active = applications.filter(a => a.status !== 'satildi');
  if (active.length === 0) return null;

  return (
    <div
      id="dash-ipo-locked-card"
      onClick={onNavigate}
      className="glass-card p-5 cursor-pointer hover:border-accent-blue/25 transition-all border-accent-blue/10 bg-gradient-to-br from-accent-blue/10 to-violet-500/5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <BarChart3 size={15} className="text-accent-blue" />
          </div>
          <h3 className="text-white/60 text-sm font-medium">IPO'da Kilitli</h3>
        </div>
        <p className="text-accent-blue font-bold tabular-nums text-lg">{formatCurrency(totalLocked)}</p>
      </div>

      <div className="space-y-2">
        {active.map(app => {
          const locked = calcIpoLockedAmount(app);
          const daysAway = app.estimatedReturnDate
            ? Math.round((new Date(app.estimatedReturnDate + 'T00:00:00') - new Date(today + 'T00:00:00')) / (1000 * 60 * 60 * 24))
            : null;
          return (
            <div key={app.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-white/70 text-sm font-medium truncate">{app.company}</p>
                {app.estimatedReturnDate ? (
                  <p className="text-white/30 text-xs">
                    {formatDate(app.estimatedReturnDate)}
                    {daysAway != null && (
                      <span className={`ml-1.5 ${daysAway < 0 ? 'text-rose-400' : daysAway <= 5 ? 'text-amber-400' : 'text-white/30'}`}>
                        {daysAway < 0 ? `${Math.abs(daysAway)} gün geçti` : daysAway === 0 ? '· bugün!' : `· ${daysAway} gün`}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-white/20 text-xs">Dönüş tarihi belirsiz</p>
                )}
              </div>
              <p className="text-accent-blue/80 font-semibold tabular-nums text-sm ml-3">{formatCurrency(locked)}</p>
            </div>
          );
        })}
      </div>

      <p className="text-white/20 text-[11px] mt-3 pt-3 border-t border-white/[0.05]">
        Bu para nakit projeksiyonuna dahil değil · IPO sekmesi →
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main dashboard
// ─────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { activePeriod, incomes, obligations, socialWeeks, savings, ipoApplications } = useApp();
  const today = todayStr();

  if (!activePeriod) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle size={48} className="text-white/20" />
        <p className="text-white/40">Aktif dönem bulunamadı</p>
      </div>
    );
  }

  const pid = activePeriod.id;

  // Split income
  const cashOnHand = calcCashOnHand(incomes, pid, today);
  const upcomingIncome = calcUpcomingIncome(incomes, pid, today);

  // Projection
  const projection = calcProjection(incomes, obligations, socialWeeks, savings, pid, today);

  // Supporting numbers
  const totalSocial = calcTotalSocialSpending(socialWeeks, pid);
  const periodSavings = calcPeriodSavings(savings, pid);
  const cumulativeSavings = calcCumulativeSavings(savings);
  const paidOblig = calcPaidObligations(obligations, pid);

  // Current week's social
  const currentWeek = socialWeeks
    .filter(w => w.periodId === pid)
    .sort((a, b) => b.weekNumber - a.weekNumber)[0];
  const weekRemaining = currentWeek ? calcWeekRemaining(currentWeek) : null;

  // Next upcoming income (nearest future-dated income entry)
  const nextIncome = incomes
    .filter(i => i.periodId === pid && i.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const daysUntilNext = nextIncome
    ? Math.round((new Date(nextIncome.date + 'T00:00:00') - new Date(today + 'T00:00:00')) / (1000 * 60 * 60 * 24))
    : null;

  const safeToAllocate = projection.minBalance;

  // Active (non-sold) IPO applications for locked money card
  const activeIpos = ipoApplications.filter(a => a.status !== 'satildi');

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Merhaba 👋</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Dönem başlangıcı: {formatDate(activePeriod.startDate)}
          </p>
        </div>
        {daysUntilNext !== null && (
          <div className={`badge ${daysUntilNext <= 7 ? 'badge-danger' : daysUntilNext <= 14 ? 'badge-warning' : 'badge-info'}`}>
            <Clock size={11} />
            {daysUntilNext === 0 ? 'Bugün gelir!' : `${daysUntilNext} gün`}
          </div>
        )}
      </motion.div>

      {/* Primary: Eldeki Nakit */}
      <motion.div
        variants={fadeUp}
        className="glass-card p-5 bg-gradient-to-br from-accent-blue/15 to-violet-500/5 border-accent-blue/10"
      >
        <p className="stat-label mb-2">Eldeki Nakit</p>
        <p className="text-4xl font-bold text-white tabular-nums">{formatCurrency(cashOnHand)}</p>
        <p className="text-white/30 text-xs mt-1">Bugün ve öncesinde alınan gelirler</p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-amber-400 font-semibold text-sm tabular-nums">{formatCurrency(totalSocial)}</p>
            <p className="text-white/30 text-xs mt-0.5">Sosyal</p>
          </div>
          <div className="text-center border-x border-white/[0.06]">
            <p className="text-violet-400 font-semibold text-sm tabular-nums">{formatCurrency(periodSavings)}</p>
            <p className="text-white/30 text-xs mt-0.5">Tasarruf</p>
          </div>
          <div className="text-center">
            <p className={`font-semibold text-sm tabular-nums ${projection.startBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(projection.startBalance)}
            </p>
            <p className="text-white/30 text-xs mt-0.5">Mevcut</p>
          </div>
        </div>

        {/* Upcoming income strip */}
        {upcomingIncome > 0 && (
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-accent-glow" />
              <span className="text-white/50 text-xs">
                {nextIncome ? formatDate(nextIncome.date) : ''} yaklaşan gelir
              </span>
            </div>
            <span className="text-accent-glow font-semibold text-sm tabular-nums">
              +{formatCurrency(upcomingIncome)}
            </span>
          </div>
        )}
      </motion.div>

      {/* Safe to allocate — the key number */}
      <motion.div
        variants={fadeUp}
        id="dash-safe-allocate"
        onClick={() => navigate('/tasarruf')}
        className={`glass-card p-5 cursor-pointer transition-all ${safeToAllocate >= 0 ? 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/15' : 'bg-gradient-to-br from-rose-500/15 to-rose-500/5 border-rose-500/15'}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="stat-label mb-2">Güvenle Ayırılabilir</p>
            <p className={`text-3xl font-bold tabular-nums ${safeToAllocate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(safeToAllocate)}
            </p>
            {projection.minDate !== today && projection.timeline.length > 0 && (
              <p className="text-white/30 text-xs mt-1">
                {safeToAllocate < projection.startBalance
                  ? `En düşük: ${formatDateLong(projection.minDate)}`
                  : 'Tüm yükümlülükler karşılandıktan sonra'}
              </p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${safeToAllocate >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
            <Target size={20} className={safeToAllocate >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
          </div>
        </div>
        <p className="text-white/25 text-xs mt-3">
          Tüm yükümlülükler ödendikten sonraki en düşük bakiye • Tasarrufa git →
        </p>
      </motion.div>

      {/* IPO Locked Money Card — only when there are active IPOs */}
      {activeIpos.length > 0 && (
        <motion.div variants={fadeUp}>
          <IpoLockedCard
            applications={activeIpos}
            today={today}
            onNavigate={() => navigate('/ipo')}
          />
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          id="dash-obligations-card"
          label="Ödenen Gider"
          value={formatCurrency(paidOblig)}
          sub="bu dönem"
          color="red"
          icon={TrendingDown}
          onClick={() => navigate('/yükümler')}
        />
        <StatCard
          id="dash-social-card"
          label="Bu Hafta Sosyal"
          value={weekRemaining !== null ? formatCurrency(Math.max(0, weekRemaining)) : '—'}
          sub={weekRemaining !== null && weekRemaining < 0 ? `${formatCurrency(Math.abs(weekRemaining))} aşıldı` : 'kalan bütçe'}
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
        {upcomingIncome > 0 ? (
          <StatCard
            id="dash-upcoming-income-card"
            label="Yaklaşan Gelir"
            value={formatCurrency(upcomingIncome)}
            sub={nextIncome ? formatDate(nextIncome.date) : ''}
            color="blue"
            icon={TrendingUp}
            onClick={() => navigate('/gelir')}
          />
        ) : (
          <StatCard
            id="dash-income-card"
            label="Bu Dönem Gelir"
            value={formatCurrency(cashOnHand)}
            sub="eldeki toplam"
            color="green"
            icon={Wallet}
            onClick={() => navigate('/gelir')}
          />
        )}
      </div>

      {/* Projection timeline */}
      <motion.div variants={fadeUp}>
        <ProjectionTimeline
          timeline={projection.timeline}
          startBalance={projection.startBalance}
          undatedObligations={projection.undatedObligations}
        />
      </motion.div>

      {/* Quick add income */}
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
