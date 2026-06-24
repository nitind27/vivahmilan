'use client';

import { Plus, Trash2, GripVertical, HelpCircle } from 'lucide-react';

const EMPTY_FAQ = { question: '', answer: '', sortOrder: 0 };

export default function BlogPostFaqEditor({ faqs, onChange }) {
  const list = Array.isArray(faqs) ? faqs : [];

  const update = (index, patch) => {
    const next = list.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange(next);
  };

  const add = () => {
    onChange([...list, { ...EMPTY_FAQ, sortOrder: list.length }]);
  };

  const remove = (index) => {
    onChange(list.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-2xl border border-gray-600 bg-gray-900/40 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-900/30 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Article FAQs</h4>
            <p className="text-xs text-gray-500">Questions &amp; answers shown only on this blog post page</p>
          </div>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white"
        >
          <Plus className="w-3.5 h-3.5" /> Add FAQ
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6 border border-dashed border-gray-700 rounded-xl">
          No FAQs yet. Add questions readers might have about this article.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((faq, index) => (
            <div key={faq.id || `new-${index}`} className="rounded-xl border border-gray-700 bg-gray-800/80 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <GripVertical className="w-3.5 h-3.5" /> FAQ {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg"
                  title="Remove FAQ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Question</label>
                <input
                  value={faq.question}
                  onChange={(e) => update(index, { question: e.target.value })}
                  placeholder="e.g. How long does profile verification take?"
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Answer</label>
                <textarea
                  value={faq.answer}
                  onChange={(e) => update(index, { answer: e.target.value })}
                  rows={3}
                  placeholder="Clear, helpful answer for readers…"
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
