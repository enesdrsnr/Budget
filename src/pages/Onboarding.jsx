import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowRight, Calendar, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, todayStr } from '../utils/formatters';

const steps = [
  {
    id: 'welcome',
    title: 'NaKit\'e Hoş Geldiniz',
    subtitle: 'Düzensiz gelirinizi dönem bazlı yönetin',
  },
  {
    id: 'income',
    title: 'Bu Dönem Ne Kadar Aldınız?',
    subtitle: 'Bugün veya son aldığınız gelir bilgisini girin',
  },
];

export default function Onboarding({ onComplete }) {
  const { startNewPeriod } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    startDate: todayStr(),
    initialIncomeAmount: '',
    initialIncomeSource: 'Maaş',
  });

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    startNewPeriod({
      startDate: form.startDate,
      initialIncomeAmount: parseFloat(form.initialIncomeAmount) || 0,
      initialIncomeSource: form.initialIncomeSource,
    });
    onComplete?.();
  };

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return form.initialIncomeAmount && parseFloat(form.initialIncomeAmount) > 0;
    return true; // next income step is optional
  };

  const slideVariants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  };

  return (
    <div className="animated-bg min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-10 flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-violet-500 flex items-center justify-center mb-4 glow-blue">
          <Wallet size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gradient">NaKit</h1>
        <p className="text-white/40 text-sm mt-1">Kişisel Bütçe Yönetimi</p>
      </motion.div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i <= step ? 'bg-accent-blue w-8' : 'bg-white/15 w-4'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-white mb-2">{steps[step].title}</h2>
              <p className="text-white/50 text-sm">{steps[step].subtitle}</p>
            </div>

            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="glass-card p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-accent-blue/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Calendar size={16} className="text-accent-blue" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Dönem Bazlı Yönetim</p>
                      <p className="text-white/40 text-xs mt-0.5">Her gelir alışınızda yeni bir dönem başlatırsınız</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Gelir & Gider Takibi</p>
                      <p className="text-white/40 text-xs mt-0.5">Zorunlu giderler, sosyal bütçe ve IPO takibi</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Wallet size={16} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Akıllı Tasarruf</p>
                      <p className="text-white/40 text-xs mt-0.5">Otomatik hesaplanan tasarrufa ayırılabilir tutar</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-4">
                  <label className="label">Dönem Başlangıç Tarihi</label>
                  <input
                    id="onboarding-start-date"
                    type="date"
                    className="input-field"
                    value={form.startDate}
                    onChange={e => updateForm('startDate', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 1: Income */}
            {step === 1 && (
              <div className="glass-card p-5 space-y-4">
                <div>
                  <label className="label">Gelir Kaynağı</label>
                  <input
                    id="onboarding-income-source"
                    type="text"
                    className="input-field"
                    value={form.initialIncomeSource}
                    onChange={e => updateForm('initialIncomeSource', e.target.value)}
                    placeholder="Maaş, Serbest Meslek..."
                  />
                </div>
                <div>
                  <label className="label">Tutar (₺)</label>
                  <input
                    id="onboarding-income-amount"
                    type="number"
                    className="input-field text-lg font-semibold"
                    value={form.initialIncomeAmount}
                    onChange={e => updateForm('initialIncomeAmount', e.target.value)}
                    placeholder="0"
                    inputMode="decimal"
                  />
                  {form.initialIncomeAmount && (
                    <p className="text-accent-blue/80 text-sm mt-2 font-medium">
                      {formatCurrency(parseFloat(form.initialIncomeAmount) || 0)}
                    </p>
                  )}
                </div>
              </div>
            )}


          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <button
            id={`onboarding-next-${step}`}
            onClick={handleNext}
            disabled={!canProceed()}
            className={`w-full btn-primary text-base py-4 ${!canProceed() ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {step === steps.length - 1 ? 'Dönemi Başlat' : 'Devam Et'}
            {step === steps.length - 1 ? <Wallet size={18} /> : <ArrowRight size={18} />}
          </button>


        </div>
      </div>
    </div>
  );
}
