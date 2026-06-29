import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, X, TrendingUp, TrendingDown, ArrowRightLeft,
  BarChart3, CheckCircle2, Clock, Unlink, Calendar, RefreshCw, Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, todayStr } from '../utils/formatters';
import {
  calcIpoProfit, calcTotalIpoInvested, calcTotalIpoProfit,
  calcIpoRefund, calcIpoLockedAmount, calcIpoActualInvestedAmount,
} from '../utils/calculations';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const statusInfo = {
  bekliyor:    { label: 'Bekliyor',    badge: 'badge-warning', icon: Clock },
  halka_acildi:{ label: 'Halka Açıldı',badge: 'badge-info',   icon: BarChart3 },
  satildi:     { label: 'Satıldı',     badge: 'badge-success', icon: CheckCircle2 },
};

// ─── Add Application Modal ──────────────────────────────────────────────────
function AddApplicationModal({ onClose }) {
  const { addIpoApplication } = useApp();
  const [form, setForm] = useState({
    company: '',
    applicationDate: todayStr(),
    estimatedReturnDate: '',
    pricePerLot: '',
    estimatedLots: '',
  });
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const price = parseFloat(form.pricePerLot) || 0;
  const lots  = parseFloat(form.estimatedLots) || 0;
  const committedAmount = price * lots;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.company || !form.pricePerLot || !form.estimatedLots) return;
    addIpoApplication({
      company: form.company,
      applicationDate: form.applicationDate,
      estimatedReturnDate: form.estimatedReturnDate || null,
      pricePerLot: price,
      estimatedLots: lots,
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
          <h3 className="text-lg font-bold text-white">IPO Başvurusu</h3>
          <button id="close-ipo-modal" onClick={onClose} className="btn-secondary !px-2 !py-2">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Şirket Adı</label>
            <input id="ipo-company" type="text" className="input-field" value={form.company}
              onChange={e => update('company', e.target.value)} placeholder="XYZ A.Ş." required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Başvuru Tarihi</label>
              <input id="ipo-date" type="date" className="input-field" value={form.applicationDate}
                onChange={e => update('applicationDate', e.target.value)} />
            </div>
            <div>
              <label className="label">
                Tahmini Dönüş Tarihi
                <span className="text-white/30 ml-1 text-[10px] normal-case font-normal">(isteğe bağlı)</span>
              </label>
              <input id="ipo-return-date" type="date" className="input-field" value={form.estimatedReturnDate}
                onChange={e => update('estimatedReturnDate', e.target.value)} />
            </div>
          </div>

          {!form.estimatedReturnDate && (
            <p className="text-white/25 text-xs -mt-2">
              ⚠ Dönüş tarihi girilmezse yükümlülük çakışma kontrolü yapılamaz
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Lot Fiyatı (₺)</label>
              <input id="ipo-price" type="number" className="input-field" value={form.pricePerLot}
                onChange={e => update('pricePerLot', e.target.value)} placeholder="0.00" inputMode="decimal" required />
            </div>
            <div>
              <label className="label">Talep Edilen Lot</label>
              <input id="ipo-estimated-lots" type="number" className="input-field" value={form.estimatedLots}
                onChange={e => update('estimatedLots', e.target.value)} placeholder="0" inputMode="decimal" required />
            </div>
          </div>

          {/* Committed amount preview */}
          {committedAmount > 0 && (
            <div className="glass-card p-4 border-accent-blue/20">
              <p className="text-white/40 text-xs mb-1">Taahhüt Edilen Tutar</p>
              <p className="text-accent-blue font-bold text-2xl tabular-nums">{formatCurrency(committedAmount)}</p>
              <p className="text-white/25 text-xs mt-1">{lots} lot × {formatCurrency(price)}</p>
            </div>
          )}

          <button id="submit-ipo" type="submit" className="w-full btn-primary py-4">
            <Plus size={18} /> Başvuru Kaydet
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Add Sale Modal ──────────────────────────────────────────────────────────
function AddSaleModal({ application, onClose }) {
  const { addIpoSale } = useApp();
  const [form, setForm] = useState({ date: todayStr(), lots: '', pricePerLot: '' });
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
              <p className="text-white/50 text-xs mb-1">Tahmini Kâr/Zarar</p>
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

// ─── Allocation Modal (partial fill) ─────────────────────────────────────────
function AllocationModal({ application, onClose }) {
  const { setIpoAllocatedLots } = useApp();
  const estimated = application.estimatedLots ?? application.lotsReceived ?? 0;
  const [allocated, setAllocated] = useState('');

  const allocatedNum = parseFloat(allocated) || 0;
  const refundLots = estimated - allocatedNum;
  const refundAmount = refundLots > 0 ? refundLots * (application.pricePerLot || 0) : 0;
  const isValid = allocatedNum >= 0 && allocatedNum <= estimated;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    setIpoAllocatedLots(application.id, allocatedNum);
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
          <h3 className="text-lg font-bold text-white">Tahsis Sonucu</h3>
          <button id="close-allocation-modal" onClick={onClose} className="btn-secondary !px-2 !py-2">
            <X size={18} />
          </button>
        </div>
        <p className="text-white/40 text-sm mb-5">{application.company} — {estimated} lot talep edilmişti</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tahsis Edilen Lot</label>
            <input
              id="allocation-lots"
              type="number"
              className="input-field text-xl font-bold"
              value={allocated}
              onChange={e => setAllocated(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              min="0"
              max={estimated}
              required
            />
            {!isValid && allocatedNum > estimated && (
              <p className="text-rose-400 text-xs mt-1">Tahsis, talep edilen ({estimated}) lottan fazla olamaz</p>
            )}
          </div>

          {allocatedNum >= 0 && allocated !== '' && (
            <div className={`glass-card p-4 space-y-2 ${refundAmount > 0 ? 'border-emerald-500/20' : 'border-white/[0.06]'}`}>
              <div className="flex justify-between items-center">
                <p className="text-white/50 text-sm">Tahsis edilen</p>
                <p className="text-white font-semibold tabular-nums">{allocatedNum} lot = {formatCurrency(allocatedNum * (application.pricePerLot || 0))}</p>
              </div>
              {refundLots > 0 && (
                <div className="flex justify-between items-center">
                  <p className="text-emerald-400/80 text-sm">Hesabına dönecek</p>
                  <p className="text-emerald-400 font-bold tabular-nums">+{formatCurrency(refundAmount)}</p>
                </div>
              )}
              {refundLots === 0 && allocatedNum === estimated && (
                <p className="text-white/30 text-sm">Tam tahsis — iade yok</p>
              )}
              {allocatedNum === 0 && (
                <p className="text-amber-400 text-sm">Tüm tutar iade olacak ({formatCurrency(estimated * (application.pricePerLot || 0))})</p>
              )}
            </div>
          )}

          <button id="submit-allocation" type="submit" disabled={!isValid || !allocated}
            className={`w-full btn-primary py-4 ${!isValid || !allocated ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <RefreshCw size={18} /> Tahsisi Kaydet
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── IPO Card ─────────────────────────────────────────────────────────────────
function IpoCard({ application, isActive }) {
  const { deleteIpoApplication, updateIpoApplication, transferIpoProfitToIncome,
    transferIpoRefundToIncome, clearObligationIpoEarmark, obligations } = useApp();
  const today = todayStr();
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingReturnDate, setEditingReturnDate] = useState(false);
  const [returnDateDraft, setReturnDateDraft] = useState(application.estimatedReturnDate || '');

  const totalProfit = calcIpoProfit(application);
  const isProfitable = totalProfit > 0;
  const actualInvested = calcIpoActualInvestedAmount(application);
  const roi = actualInvested > 0 ? (totalProfit / actualInvested) * 100 : 0;
  const status = statusInfo[application.status] || statusInfo.bekliyor;
  const StatusIcon = status.icon;
  const refundAmount = calcIpoRefund(application);

  // Backward compat: estimatedLots or lotsReceived
  const estimatedLots = application.estimatedLots ?? application.lotsReceived ?? 0;
  const allocatedLots = application.allocatedLots ?? null;
  const hasAllocationResult = allocatedLots !== null;

  // Days until return
  const daysUntilReturn = application.estimatedReturnDate
    ? Math.round((new Date(application.estimatedReturnDate + 'T00:00:00') - new Date(today + 'T00:00:00')) / (1000 * 60 * 60 * 24))
    : null;

  // Obligations parked in this IPO
  const parkedObligations = obligations.filter(
    o => o.linkedIpoAppId === application.id && o.ipoEarmarked && !o.isPaid
  );
  const parkedTotal = parkedObligations.reduce((s, o) => s + o.amount, 0);

  const cycleStatus = () => {
    const statuses = ['bekliyor', 'halka_acildi', 'satildi'];
    const current = statuses.indexOf(application.status);
    const next = statuses[(current + 1) % statuses.length];
    updateIpoApplication(application.id, { status: next });
  };

  const saveReturnDate = () => {
    updateIpoApplication(application.id, { estimatedReturnDate: returnDateDraft || null });
    setEditingReturnDate(false);
  };

  return (
    <>
      <div className="glass-card overflow-hidden">
        {/* Card header — tap to expand */}
        <div className="p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base truncate">{application.company}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <button
                  id={`status-${application.id}`}
                  onClick={e => { e.stopPropagation(); cycleStatus(); }}
                  className={`${status.badge}`}
                >
                  <StatusIcon size={10} />
                  {status.label}
                </button>
                <p className="text-white/40 text-xs">{formatDate(application.applicationDate)}</p>
                {/* Return date badge */}
                {application.estimatedReturnDate && (
                  <p className={`text-xs ${daysUntilReturn != null && daysUntilReturn < 0 ? 'text-rose-400' : daysUntilReturn != null && daysUntilReturn <= 5 ? 'text-amber-400' : 'text-white/30'}`}>
                    → {formatDate(application.estimatedReturnDate)}
                    {daysUntilReturn != null && ` (${daysUntilReturn >= 0 ? daysUntilReturn + ' gün' : 'geçti'})`}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-white font-semibold tabular-nums">{formatCurrency(actualInvested)}</p>
              <p className="text-white/30 text-xs">yatırıldı</p>
            </div>
          </div>

          {/* Summary row */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {estimatedLots > 0 && (
              <div>
                <p className="text-white/50 text-sm">
                  {hasAllocationResult
                    ? <><span className="text-white/25 line-through">{estimatedLots}</span> → <span className="text-accent-blue">{allocatedLots}</span> lot</>
                    : <span>{estimatedLots} lot (tahmini)</span>
                  }
                </p>
                <p className="text-white/30 text-xs">@ {formatCurrency(application.pricePerLot)}</p>
              </div>
            )}
            {totalProfit !== 0 && (
              <div>
                <p className={`font-bold text-sm tabular-nums ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isProfitable ? '+' : ''}{formatCurrency(totalProfit)}
                </p>
                <p className="text-white/30 text-xs">kâr ({roi >= 0 ? '+' : ''}{roi.toFixed(1)}%)</p>
              </div>
            )}
          </div>
        </div>

        {/* Refund banner — shown when there is a pending refund */}
        {refundAmount > 0 && !application.refundTransferred && isActive && (
          <div className="px-4 pb-3">
            <div className="glass-card p-3 border-emerald-500/25 flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-sm font-semibold">
                  +{formatCurrency(refundAmount)} iade
                </p>
                <p className="text-white/30 text-xs">
                  {(estimatedLots - (allocatedLots ?? 0))} lot iade · hesabınıza geçince onaylayın
                </p>
              </div>
              <button
                id={`transfer-refund-${application.id}`}
                onClick={() => transferIpoRefundToIncome(application.id)}
                className="btn-success text-xs !py-2 !px-3 flex-shrink-0"
              >
                <ArrowRightLeft size={13} /> Hesaba Aktar
              </button>
            </div>
          </div>
        )}
        {application.refundTransferred && (
          <div className="px-4 pb-2">
            <p className="text-emerald-400/50 text-xs flex items-center gap-1">
              <CheckCircle2 size={11} /> İade hesaba aktarıldı
            </p>
          </div>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <div className="p-4 space-y-4">

                {/* Estimated return date editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Tahmini Dönüş Tarihi</p>
                    {!editingReturnDate && (
                      <button id={`edit-return-date-${application.id}`} onClick={() => setEditingReturnDate(true)}
                        className="text-white/30 hover:text-white/60 transition-colors">
                        <Edit3 size={13} />
                      </button>
                    )}
                  </div>
                  {editingReturnDate ? (
                    <div className="flex gap-2">
                      <input type="date" className="input-field flex-1 !py-2 text-sm" value={returnDateDraft}
                        onChange={e => setReturnDateDraft(e.target.value)} />
                      <button onClick={saveReturnDate} className="btn-primary !py-2 !px-3 text-sm">Kaydet</button>
                      <button onClick={() => setEditingReturnDate(false)} className="btn-secondary !py-2 !px-3 text-sm">İptal</button>
                    </div>
                  ) : (
                    <p className={`text-sm ${application.estimatedReturnDate ? 'text-white/70' : 'text-white/25'}`}>
                      {application.estimatedReturnDate ? formatDate(application.estimatedReturnDate) : 'Girilmedi'}
                    </p>
                  )}
                </div>

                {/* Allocation section — only for halka_acildi without result yet */}
                {application.status === 'halka_acildi' && !hasAllocationResult && isActive && (
                  <div>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Tahsis Sonucu</p>
                    <button
                      id={`enter-allocation-${application.id}`}
                      onClick={() => setShowAllocationModal(true)}
                      className="w-full glass-card p-3 flex items-center justify-between hover:border-accent-blue/30 transition-all"
                    >
                      <div>
                        <p className="text-white/60 text-sm">Tahsis edilen lot girilmedi</p>
                        <p className="text-white/30 text-xs">{estimatedLots} lot talep edildi</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-accent-blue text-sm font-medium">
                        <RefreshCw size={14} /> Gir
                      </div>
                    </button>
                  </div>
                )}

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

                {/* Parked obligations */}
                {parkedObligations.length > 0 && (
                  <div className="glass-card p-3 border-amber-500/20">
                    <p className="text-amber-400/80 text-xs font-medium uppercase tracking-wider mb-2">Rezerve Yükümlülükler</p>
                    {parkedObligations.map(o => (
                      <div key={o.id} className="flex items-center justify-between py-1.5">
                        <div>
                          <p className="text-white/70 text-sm">{o.name}</p>
                          {o.dueDate && <p className="text-white/30 text-xs">{formatDate(o.dueDate)}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-amber-400 font-semibold text-sm tabular-nums">{formatCurrency(o.amount)}</p>
                          {isActive && (
                            <button id={`unpark-from-ipo-${o.id}`} onClick={() => clearObligationIpoEarmark(o.id)}
                              title="Park'ı Kaldır"
                              className="w-6 h-6 rounded-lg bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60 flex items-center justify-center transition-all">
                              <Unlink size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-white/[0.06] flex justify-between">
                      <p className="text-white/30 text-xs">Toplam rezerve</p>
                      <p className="text-amber-400 font-semibold text-sm tabular-nums">{formatCurrency(parkedTotal)}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {isActive && application.status !== 'bekliyor' && (
                    <button id={`add-sale-${application.id}`} onClick={() => setShowSaleModal(true)}
                      className="flex-1 btn-secondary text-sm !py-2">
                      <Plus size={13} /> Satış Ekle
                    </button>
                  )}
                  {isActive && totalProfit > 0 && !application.transferredToIncome && (
                    <button id={`transfer-profit-${application.id}`}
                      onClick={() => transferIpoProfitToIncome(application.id)}
                      className="flex-1 btn-success text-sm !py-2">
                      <ArrowRightLeft size={13} /> Kârı Aktar
                    </button>
                  )}
                  {application.transferredToIncome && (
                    <span className="badge badge-success text-xs">
                      <CheckCircle2 size={11} /> Kâr Aktarıldı
                    </span>
                  )}
                  {isActive && (
                    <button id={`delete-ipo-${application.id}`} onClick={() => deleteIpoApplication(application.id)}
                      className="btn-danger text-sm !py-2 !px-3">
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
        {showAllocationModal && <AllocationModal application={application} onClose={() => setShowAllocationModal(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
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
