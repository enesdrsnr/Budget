import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, CheckCircle2, Circle, X, Home, Zap, CreditCard,
  Repeat, MoreHorizontal, AlertTriangle, BarChart3, Unlink, Link
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, todayStr } from '../utils/formatters';
import { calcTotalObligations, calcPaidObligations, calcEarmarkedObligations } from '../utils/calculations';

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

// ─── Add Obligation Modal ───────────────────────────────────────────────────
function AddObligationModal({ onClose }) {
  const { addObligation } = useApp();
  const [form, setForm] = useState({ name: '', amount: '', dueDate: '', category: 'kira' });
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
                    form.category === key ? 'border-accent-blue/50 bg-accent-blue/10' : 'border-transparent glass-card'
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
            <label className="label">
              Vade Tarihi
              <span className="text-rose-400 ml-1 normal-case font-normal">(projeksiyon için gerekli)</span>
            </label>
            <input
              id="obligation-due-date"
              type="date"
              className="input-field"
              value={form.dueDate}
              onChange={e => update('dueDate', e.target.value)}
            />
            {!form.dueDate && (
              <p className="text-amber-400/70 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle size={11} /> Tarih girilmezse nakit projeksiyonuna dahil edilmez
              </p>
            )}
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

// ─── IPO Park Modal ─────────────────────────────────────────────────────────
function IpoParkModal({ obligation, ipoApplications, onClose }) {
  const { setObligationIpoEarmark } = useApp();
  const [selectedApp, setSelectedApp] = useState(null);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [conflictDays, setConflictDays] = useState(0);

  const available = ipoApplications.filter(a => a.status !== 'satildi' || !a.transferredToIncome);

  /**
   * Conflict check:
   * - diff = ipoReturnDate - obligationDueDate (in days)
   * - diff <= 3  → OK (silent, money arrives close enough to due date)
   * - diff > 3   → WARNING
   * Returns null if no conflict, or the positive day count if conflict.
   */
  const getConflictDays = (appId) => {
    if (!obligation.dueDate) return null;
    const app = available.find(a => a.id === appId);
    if (!app || !app.estimatedReturnDate) return null;
    const due = new Date(obligation.dueDate + 'T00:00:00');
    const ret = new Date(app.estimatedReturnDate + 'T00:00:00');
    const diff = Math.round((ret - due) / (1000 * 60 * 60 * 24));
    return diff > 3 ? diff : null;
  };

  const handleSelectApp = (appId) => {
    setSelectedApp(appId);
    setShowConflictWarning(false); // reset if they change selection
  };

  const handleConfirmClick = () => {
    if (!selectedApp) return;
    const conflict = getConflictDays(selectedApp);
    if (conflict) {
      setConflictDays(conflict);
      setShowConflictWarning(true);
    } else {
      // No conflict — park immediately
      setObligationIpoEarmark(obligation.id, selectedApp);
      onClose();
    }
  };

  const handleForceConfirm = () => {
    setObligationIpoEarmark(obligation.id, selectedApp);
    onClose();
  };

  const selectedAppData = selectedApp ? available.find(a => a.id === selectedApp) : null;

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
          <h3 className="text-lg font-bold text-white">IPO'ya Park Et</h3>
          <button id="close-ipo-park-modal" onClick={onClose} className="btn-secondary !px-2 !py-2">
            <X size={18} />
          </button>
        </div>
        <p className="text-white/40 text-sm mb-5">
          <span className="text-white font-medium">{obligation.name}</span> için ayrılan{' '}
          <span className="text-rose-400 font-semibold">{formatCurrency(obligation.amount)}</span>{' '}
          hangi IPO'da park edilsin?
        </p>

        {/* Conflict warning — shown after user clicks "Park Et" */}
        <AnimatePresence>
          {showConflictWarning && selectedAppData && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass-card p-4 border-rose-500/30 mb-4 bg-rose-500/5"
            >
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-rose-400 font-semibold text-sm">Zamanlama Riski</p>
                </div>
              </div>
              <div className="space-y-1.5 mb-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-white/50">Ödeme son tarihi</p>
                  <p className="text-white font-medium">{formatDate(obligation.dueDate)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/50">Tahmini para dönüşü</p>
                  <p className="text-rose-400 font-medium">{formatDate(selectedAppData.estimatedReturnDate)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/50">Gecikme</p>
                  <p className="text-rose-400 font-bold">{conflictDays} gün</p>
                </div>
              </div>
              <p className="text-white/40 text-xs mb-4">
                Bu ödemeyi en az <span className="text-rose-400 font-semibold">{conflictDays} gün</span> ertelemen gerekir — bu sağlıksız olabilir.
              </p>
              <div className="flex gap-2">
                <button
                  id="conflict-cancel"
                  onClick={() => setShowConflictWarning(false)}
                  className="flex-1 btn-secondary !py-2.5 text-sm"
                >
                  İptal
                </button>
                <button
                  id="conflict-force-confirm"
                  onClick={handleForceConfirm}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 font-semibold text-sm transition-all"
                >
                  Yine de Park Et
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showConflictWarning && (
          <>
            {available.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-4">Aktif IPO başvurusu bulunamadı</p>
            ) : (
              <div className="space-y-2 mb-5">
                {available.map(app => {
                  const hasReturnDate = !!app.estimatedReturnDate;
                  const conflict = getConflictDays(app.id);
                  const isSelected = selectedApp === app.id;
                  const actualInvested = (app.estimatedLots ?? app.lotsReceived ?? 0) * (app.pricePerLot || 0) || app.investedAmount || 0;

                  return (
                    <button
                      key={app.id}
                      id={`ipo-park-select-${app.id}`}
                      onClick={() => handleSelectApp(app.id)}
                      className={`w-full glass-card p-3.5 flex items-start justify-between transition-all ${
                        isSelected ? 'border-accent-blue/50 bg-accent-blue/10' : ''
                      }`}
                    >
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{app.company}</p>
                        <p className="text-white/30 text-xs mt-0.5">{formatDate(app.applicationDate)} · {formatCurrency(actualInvested)}</p>
                        {/* Return date + conflict indicator */}
                        {hasReturnDate ? (
                          <p className={`text-xs mt-1 flex items-center gap-1 ${conflict ? 'text-rose-400' : 'text-emerald-400/70'}`}>
                            {conflict
                              ? <><AlertTriangle size={10} /> Dönüş {formatDate(app.estimatedReturnDate)} — {conflict} gün geç</>
                              : <>✓ Dönüş {formatDate(app.estimatedReturnDate)} — zamanında</>
                            }
                          </p>
                        ) : (
                          <p className="text-white/20 text-xs mt-1">Dönüş tarihi girilmemiş — çakışma kontrolü yapılamaz</p>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ml-3 flex-shrink-0 mt-0.5 ${
                        isSelected ? 'border-accent-blue bg-accent-blue' : 'border-white/20'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="glass-card p-3 mb-4 border-amber-500/15">
              <p className="text-amber-400 text-xs">
                ⚠ Bu para nakit projeksiyonundan çıkarılır ve IPO'ya "rezerve" olarak işaretlenir.
                IPO satıldığında veya park kaldırıldığında projeksiyon'a geri döner.
              </p>
            </div>

            <button
              id="confirm-ipo-park"
              onClick={handleConfirmClick}
              disabled={!selectedApp}
              className={`w-full btn-primary py-3 ${!selectedApp ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <BarChart3 size={16} />
              IPO'ya Park Et
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}


// ─── Obligation Item ─────────────────────────────────────────────────────────
function ObligationItem({ obligation, isActive, ipoApplications, onToggle, onDelete }) {
  const { clearObligationIpoEarmark } = useApp();
  const [showIpoModal, setShowIpoModal] = useState(false);
  const catInfo = getCategoryInfo(obligation.category);
  const Icon = catInfo.icon;
  const today = todayStr();
  const isOverdue = obligation.dueDate && !obligation.isPaid && obligation.dueDate < today;
  const isEarmarked = obligation.ipoEarmarked;

  const linkedApp = isEarmarked && obligation.linkedIpoAppId
    ? ipoApplications.find(a => a.id === obligation.linkedIpoAppId)
    : null;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className={`glass-card p-4 transition-all duration-300 ${obligation.isPaid ? 'opacity-60' : ''} ${isEarmarked ? 'border-amber-500/20' : ''}`}
      >
        <div className="flex items-center gap-3">
          {isActive && !isEarmarked && (
            <button
              id={`toggle-obligation-${obligation.id}`}
              onClick={() => onToggle(obligation.id)}
              className={`transition-all duration-200 flex-shrink-0 ${obligation.isPaid ? 'text-emerald-400' : 'text-white/20 hover:text-white/40'}`}
            >
              {obligation.isPaid ? <CheckCircle2 size={22} /> : <Circle size={22} />}
            </button>
          )}
          {isEarmarked && (
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <BarChart3 size={14} className="text-amber-400" />
            </div>
          )}
          <div className={`w-9 h-9 rounded-xl ${catInfo.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={16} className={catInfo.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-medium truncate ${obligation.isPaid ? 'line-through text-white/40' : 'text-white'}`}>
                {obligation.name}
              </p>
              {isOverdue && !isEarmarked && (
                <span className="badge badge-danger flex-shrink-0 text-[10px]">
                  <AlertTriangle size={9} /> Geçti
                </span>
              )}
              {isEarmarked && (
                <span className="badge badge-warning text-[10px]">
                  <BarChart3 size={9} /> IPO'da
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`badge ${catInfo.bg} ${catInfo.color} border-0 text-[10px]`}>{catInfo.label}</span>
              {obligation.dueDate ? (
                <p className="text-white/30 text-xs">{formatDate(obligation.dueDate)}</p>
              ) : (
                <p className="text-amber-400/60 text-xs flex items-center gap-1">
                  <AlertTriangle size={9} /> Tarih yok
                </p>
              )}
              {isEarmarked && linkedApp && (
                <p className="text-amber-400/70 text-xs">{linkedApp.company}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
            <p className={`font-bold tabular-nums text-sm ${obligation.isPaid ? 'text-white/30' : isEarmarked ? 'text-amber-400' : 'text-white'}`}>
              {formatCurrency(obligation.amount)}
            </p>
            {isActive && !obligation.isPaid && !isEarmarked && (
              <button
                id={`park-ipo-${obligation.id}`}
                onClick={() => setShowIpoModal(true)}
                title="IPO'ya Park Et"
                className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400/60 hover:bg-amber-500/20 hover:text-amber-400 flex items-center justify-center transition-all"
              >
                <Link size={12} />
              </button>
            )}
            {isActive && isEarmarked && (
              <button
                id={`unpark-ipo-${obligation.id}`}
                onClick={() => clearObligationIpoEarmark(obligation.id)}
                title="Park'ı Kaldır"
                className="w-7 h-7 rounded-lg bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60 flex items-center justify-center transition-all"
              >
                <Unlink size={12} />
              </button>
            )}
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

      <AnimatePresence>
        {showIpoModal && (
          <IpoParkModal
            obligation={obligation}
            ipoApplications={ipoApplications}
            onClose={() => setShowIpoModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Obligations() {
  const { activePeriod, obligations, ipoApplications, toggleObligationPaid, deleteObligation } = useApp();
  const [showModal, setShowModal] = useState(false);

  const pid = activePeriod?.id;
  const periodObligations = obligations.filter(o => o.periodId === pid);

  const total = calcTotalObligations(obligations, pid);
  const paid = calcPaidObligations(obligations, pid);
  const earmarked = calcEarmarkedObligations(obligations, pid);
  const remaining = total - paid;
  const progress = total > 0 ? (paid / total) * 100 : 0;

  // Split into groups
  const undated = periodObligations.filter(o => !o.isPaid && !o.ipoEarmarked && !o.dueDate);
  const earmarkedList = periodObligations.filter(o => !o.isPaid && o.ipoEarmarked);
  const unpaid = periodObligations
    .filter(o => !o.isPaid && !o.ipoEarmarked && o.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
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
            <p className="stat-label mb-1">Toplam Yükümlülük</p>
            <p className="text-3xl font-bold text-white tabular-nums">{formatCurrency(total)}</p>
          </div>
          <div className="text-right space-y-1">
            <div>
              <p className="text-emerald-400 font-semibold tabular-nums text-sm">{formatCurrency(paid)}</p>
              <p className="text-white/30 text-xs">ödendi</p>
            </div>
            {earmarked > 0 && (
              <div>
                <p className="text-amber-400 font-semibold tabular-nums text-sm">{formatCurrency(earmarked)}</p>
                <p className="text-white/30 text-xs">IPO'da</p>
              </div>
            )}
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
      </motion.div>

      {/* Undated warning */}
      {undated.length > 0 && (
        <motion.div variants={fadeUp} className="glass-card p-4 border-amber-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-400" />
            <h3 className="text-amber-400 font-semibold text-sm">Tarihi Girilmemiş ({undated.length})</h3>
          </div>
          <p className="text-white/30 text-xs mb-3">Bu giderler nakit projeksiyonuna dahil edilmiyor. Vade tarihi ekleyin.</p>
          <div className="space-y-2">
            {undated.map(o => (
              <ObligationItem
                key={o.id}
                obligation={o}
                isActive={!!activePeriod}
                ipoApplications={ipoApplications}
                onToggle={toggleObligationPaid}
                onDelete={deleteObligation}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* IPO earmarked */}
      {earmarkedList.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-amber-400" />
            <h3 className="section-title text-amber-400">IPO'da Park ({earmarkedList.length})</h3>
          </div>
          <AnimatePresence>
            {earmarkedList.map(o => (
              <ObligationItem
                key={o.id}
                obligation={o}
                isActive={!!activePeriod}
                ipoApplications={ipoApplications}
                onToggle={toggleObligationPaid}
                onDelete={deleteObligation}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Unpaid (dated) */}
      {unpaid.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-2">
          <h3 className="section-title">Bekleyen ({unpaid.length})</h3>
          <AnimatePresence>
            {unpaid.map(o => (
              <ObligationItem
                key={o.id}
                obligation={o}
                isActive={!!activePeriod}
                ipoApplications={ipoApplications}
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
                isActive={!!activePeriod}
                ipoApplications={ipoApplications}
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
