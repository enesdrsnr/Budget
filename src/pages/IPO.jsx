import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, X, TrendingUp, TrendingDown, ArrowRightLeft,
  BarChart3, CheckCircle2, Clock, DollarSign
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, todayStr } from '../utils/formatters';
import { calcIpoProfit, calcTotalIpoInvested, calcTotalIpoProfit } from '../utils/calculations';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const statusInfo = {
  bekliyor: { label: 'Bekliyor', badge: 'badge-warning', icon: Clock },
  halka_acildi: { label: 'Halka Açıldı', badge: 'badge-info', icon: BarChart3 },
  satildi: { label: 'Satıldı', badge: 'badge-success', icon: CheckCircle2 },
};

function AddApplicationModal({ onClose }) {
  const { addIpoApplication } = useApp();
  const [form, setForm] = useState({
    company: '',
    applicationDate: todayStr(),
    investedAmount: '',
    lotsReceived: '',
    pricePerLot: '',
  });
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.company || !form.investedAmount) return;
    addIpoApplication(form);
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
          <h3 className="text-lg font-bold text-white">IPO Başvurusu</h3>
          <button id="close-ipo-modal" onClick={onClose} className="btn-secondary !px-2 !py-2">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Şirket Adı</label>
            <input id="ipo-company" type="text" className="input-field" value={form.company} onChange={e => update('company', e.target.value)} placeholder="XYZ A.Ş." required />
          </div>
          <div>
            <label className="label">Başvuru Tarihi</label>
            <input id="ipo-date" type="date" className="input-field" value={form.applicationDate} onChange={e => update('applicationDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Yatırılan Tutar (₺)</label>
            <input id="ipo-invested" type="number" className="input-field text-xl font-bold" value={form.investedAmount} onChange={e => update('investedAmount', e.target.value)} placeholder="0" inputMode="decimal" required />
            {form.investedAmount && <p className="text-accent-blue text-sm mt-1 font-medium">{formatCurrency(parseFloat(form.investedAmount) || 0)}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Alınan Lot</label>
              <input id="ipo-lots" type="number" className="input-field" value={form.lotsReceived} onChange={e => update('lotsReceived', e.target.value)} placeholder="0" inputMode="decimal" />
            </div>
            <div>
              <label className="label">Lot Fiyatı (₺)</label>
              <input id="ipo-price" type="number" className="input-field" value={form.pricePerLot} onChange={e => update('pricePerLot', e.target.value)} placeholder="0.00" inputMode="decimal" />
            </div>
          </div>
          <button id="submit-ipo" type="submit" className="w-full btn-primary py-4">
            <Plus size={18} /> Başvuru Kaydet
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AddSaleModal({ application, onClose }) {
  const { addIpoSale } = useApp();
  const [form, setForm] = useState({
    date: todayStr(),
    lots: '',
    pricePerLot: '',
  });
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const lots = parseFloat(form.lots) || 0;
  const salePrice = parseFloat(form.pricePerLot) || 0;
  const profit = (salePrice - (application.pricePerLot || 0)) * lots;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.lots || !form.pricePerLot) return;
    addIpoSale(application.id, form);
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white">Satış Kaydı</h3>
          <button id="close-sale-modal" onClick={onClose} className="btn-secondary !px-2 !py-2">
            <X size={18} />
          </button>
        </div>
        <p className="text-white/40 text-sm mb-6">{application.company} — Lot Fiyatı: {formatCurrency(application.pricePerLot)}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Satış Tarihi</label>
            <input id="sale-date" type="date" className="input-field" value={form.date} onChange={e => update('date', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Satılan Lot</label>
              <input id="sale-lots" type="number" className="input-field" value={form.lots} onChange={e => update('lots', e.target.value)} placeholder="0" inputMode="decimal" required />
            </div>
            <div>
              <label className="label">Satış Fiyatı (₺)</label>
              <input id="sale-price" type="number" className="input-field" value={form.pricePerLot} onChange={e => update('pricePerLot', e.target.value)} placeholder="0.00" inputMode="decimal" required />
            </div>
          </div>

          {lots > 0 && salePrice > 0 && (
            <div className={`glass-card p-4 ${profit >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
              <p className="text-white/50 text-xs mb-1">Tahmini Kar/Zarar</p>
              <p className={`text-2xl font-bold tabular-nums ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
              </p>
            </div>
          )}

          <button id="submit-sale" type="submit" className="w-full btn-success py-4">
            <CheckCircle2 size={18} /> Satış Kaydet
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function IpoCard({ application, isActive }) {
  const { deleteIpoApplication, updateIpoApplication, transferIpoProfitToIncome } = useApp();
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const totalProfit = calcIpoProfit(application);
  const isProfitable = totalProfit > 0;
  const roi = application.investedAmount > 0 ? (totalProfit / application.investedAmount) * 100 : 0;
  const status = statusInfo[application.status] || statusInfo.bekliyor;
  const StatusIcon = status.icon;

  const cycleStatus = () => {
    const statuses = ['bekliyor', 'halka_acildi', 'satildi'];
    const current = statuses.indexOf(application.status);
    const next = statuses[(current + 1) % statuses.length];
    updateIpoApplication(application.id, { status: next });
  };

  return (
    <>
      <div className={`glass-card overflow-hidden ${isProfitable && application.sales?.length > 0 ? 'border-emerald-500/15' : ''}`}>
        <div
          className="p-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          id={`ipo-card-${application.id}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-semibold">{application.company}</p>
                <button
                  id={`ipo-status-${application.id}`}
                  onClick={e => { e.stopPropagation(); cycleStatus(); }}
                  className={`${status.badge}`}
                >
                  <StatusIcon size={10} />
                  {status.label}
                </button>
              </div>
              <p className="text-white/40 text-xs mt-0.5">{formatDate(application.applicationDate)}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-white font-semibold tabular-nums">{formatCurrency(application.investedAmount)}</p>
              <p className="text-white/30 text-xs">yatırıldı</p>
            </div>
          </div>

          {/* Summary row */}
          <div className="flex items-center gap-4 mt-3">
            {application.lotsReceived > 0 && (
              <div>
                <p className="text-accent-blue font-medium text-sm">{application.lotsReceived} lot</p>
                <p className="text-white/30 text-xs">@ {formatCurrency(application.pricePerLot)}</p>
              </div>
            )}
            {application.sales?.length > 0 && (
              <div>
                <p className={`font-bold text-sm tabular-nums ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isProfitable ? '+' : ''}{formatCurrency(totalProfit)}
                </p>
                <p className="text-white/30 text-xs">kar ({roi >= 0 ? '+' : ''}{roi.toFixed(1)}%)</p>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <div className="p-4 space-y-3">
                {/* Sales list */}
                {application.sales?.length > 0 && (
                  <div>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Satışlar</p>
                    {application.sales.map(sale => (
                      <div key={sale.id} className="flex items-center justify-between py-1.5">
                        <div>
                          <p className="text-white/70 text-sm">{sale.lots} lot @ {formatCurrency(sale.pricePerLot)}</p>
                          <p className="text-white/30 text-xs">{formatDate(sale.date)}</p>
                        </div>
                        <p className={`font-semibold text-sm tabular-nums ${sale.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {sale.profit >= 0 ? '+' : ''}{formatCurrency(sale.profit)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {isActive && application.status !== 'bekliyor' && (
                    <button
                      id={`add-sale-${application.id}`}
                      onClick={() => setShowSaleModal(true)}
                      className="flex-1 btn-secondary text-sm !py-2"
                    >
                      <Plus size={13} /> Satış Ekle
                    </button>
                  )}
                  {isActive && totalProfit > 0 && !application.transferredToIncome && (
                    <button
                      id={`transfer-profit-${application.id}`}
                      onClick={() => transferIpoProfitToIncome(application.id)}
                      className="flex-1 btn-success text-sm !py-2"
                    >
                      <ArrowRightLeft size={13} /> Gelire Aktar
                    </button>
                  )}
                  {application.transferredToIncome && (
                    <span className="badge badge-success text-xs">
                      <CheckCircle2 size={11} /> Gelire Aktarıldı
                    </span>
                  )}
                  {isActive && (
                    <button
                      id={`delete-ipo-${application.id}`}
                      onClick={() => deleteIpoApplication(application.id)}
                      className="btn-danger text-sm !py-2 !px-3"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSaleModal && <AddSaleModal application={application} onClose={() => setShowSaleModal(false)} />}
      </AnimatePresence>
    </>
  );
}

export default function IPO() {
  const { activePeriod, ipoApplications } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const totalInvested = calcTotalIpoInvested(ipoApplications);
  const totalProfit = calcTotalIpoProfit(ipoApplications);
  const roi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const filtered = ipoApplications.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  }).sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="page-title">IPO Takip</h1>
          <p className="text-white/40 text-sm mt-0.5">Halka arz yatırımları</p>
        </div>
        <button id="open-add-ipo" onClick={() => setShowModal(true)} className="btn-primary !py-2 !px-4 text-sm">
          <Plus size={16} /> Ekle
        </button>
      </motion.div>

      {/* Summary */}
      <motion.div variants={fadeUp} className="glass-card p-5 bg-gradient-to-br from-accent-blue/15 to-violet-500/5 border-accent-blue/10">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="stat-label mb-1">Toplam Yatırım</p>
            <p className="text-white font-bold tabular-nums">{formatCurrency(totalInvested)}</p>
          </div>
          <div className="border-x border-white/[0.06] px-4">
            <p className="stat-label mb-1">Toplam Kâr</p>
            <p className={`font-bold tabular-nums ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
            </p>
          </div>
          <div>
            <p className="stat-label mb-1">ROI</p>
            <p className={`font-bold tabular-nums ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <motion.div variants={fadeUp} className="flex gap-2 no-scrollbar overflow-x-auto">
        {[
          { key: 'all', label: 'Tümü' },
          { key: 'bekliyor', label: 'Bekliyor' },
          { key: 'halka_acildi', label: 'Açıldı' },
          { key: 'satildi', label: 'Satıldı' },
        ].map(f => (
          <button
            key={f.key}
            id={`ipo-filter-${f.key}`}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0 ${
              filter === f.key ? 'bg-accent-blue text-white' : 'glass-card text-white/50 hover:text-white/80'
            }`}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1 text-xs opacity-60">
                {ipoApplications.filter(a => a.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Applications */}
      {filtered.length === 0 ? (
        <motion.div variants={fadeUp} className="glass-card p-10 text-center">
          <BarChart3 size={36} className="text-white/15 mx-auto mb-3" />
          <p className="text-white/30 text-sm">
            {filter === 'all' ? 'Henüz IPO başvurusu yok' : 'Bu filtrede kayıt yok'}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-3">
          {filtered.map(app => (
            <IpoCard key={app.id} application={app} isActive={!!activePeriod} />
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && <AddApplicationModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
