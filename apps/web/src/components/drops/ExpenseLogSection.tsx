'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X as IconX,
  Loader2 as IconLoader,
  PhilippinePeso as IconPeso,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSubmitExpenseLog } from '@/hooks/mutations/use-drop-mutations';

export function AddExpenseLogModal({ dropId, isOpen, onClose }: { dropId: string; isOpen: boolean; onClose: () => void }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const submit = useSubmitExpenseLog(dropId);

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setAmount('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!description.trim() || isNaN(val) || val <= 0) return;
    try {
      await submit.mutateAsync({ description: description.trim(), amount: val });
      toast.success('EXPENSE LOGGED — PENDING CHIEF APPROVAL');
      onClose();
    } catch {
      toast.error('FAILED TO LOG EXPENSE');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-tok-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm overflow-hidden rounded-sm border-[3px] border-tok-black bg-tok-cream shadow-[12px_12px_0px_#1C1C1A]"
      >
        <div className="flex items-center justify-between bg-tok-black px-6 py-4">
          <div>
            <p className="font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-cream/40">Expense Log</p>
            <h3 className="font-passion text-lg font-bold uppercase tracking-wider text-tok-cream leading-none">Log an Expense</h3>
          </div>
          <button onClick={onClose} className="text-tok-cream/50 hover:text-tok-cream transition-colors">
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="mb-4 font-passion text-[11px] font-bold uppercase tracking-widest text-tok-black/40">
            Chief reviews before it enters the cost split.
          </p>

          <div className="mb-4">
            <label className="mb-1.5 block font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
              What was bought?
            </label>
            <input
              autoFocus
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beer, chips, ice…"
              maxLength={200}
              className="h-11 w-full rounded-sm border-2 border-tok-black bg-white px-4 font-passion text-base font-bold text-tok-black outline-none focus:border-tok-teal placeholder:text-tok-black/20"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block font-passion text-[10px] font-bold uppercase tracking-[2px] text-tok-black/40">
              How much?
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tok-black/40">
                <IconPeso size={18} strokeWidth={3} />
              </div>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                placeholder="0.00"
                className="h-14 w-full rounded-sm border-2 border-tok-black bg-white pl-11 pr-4 font-passion text-2xl font-bold text-tok-black outline-none focus:border-tok-teal [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-sm border-2 border-tok-black bg-white py-3 font-passion text-xs font-bold uppercase tracking-widest text-tok-black transition-all hover:bg-tok-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submit.isPending || !description.trim() || !amount || parseFloat(amount) <= 0}
              className="flex-1 rounded-sm border-2 border-tok-black bg-amber-400 py-3 font-passion text-xs font-bold uppercase tracking-widest text-tok-black shadow-[4px_4px_0px_#1C1C1A] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1C1C1A] active:translate-y-0 active:shadow-none disabled:opacity-50"
            >
              {submit.isPending ? <IconLoader size={14} className="animate-spin mx-auto" /> : 'Submit'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
