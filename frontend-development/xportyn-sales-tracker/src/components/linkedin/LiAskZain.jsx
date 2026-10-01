import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuPlus, LuTrash2, LuCircleCheck, LuTriangleAlert } from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { formatDateTime } from '../../utils/date';
import Spinner from '../Spinner';

/**
 * Ask Zain — wo sawal jin ka jawab khud nahi dena.
 *
 * Playbook saaf kehti hai: qeemat, shipping, discount ya guarantee kabhi khud
 * se na batayein. Jo sawal yahan Pending hain wo hafte wali report ke
 * "Needs Zain" me khud chale jate hain.
 */
const LiAskZain = ({ onChanged }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');

  const [form, setForm] = useState({ question: '', buyerName: '', topic: '' });
  const [adding, setAdding] = useState(false);
  const [answers, setAnswers] = useState({});

  const load = useCallback(() => {
    linkedinApi
      .questions({ status: filter })
      .then((res) => setRows(res.data.data))
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load')))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(load, [load]);

  const add = async () => {
    if (!form.question.trim()) {
      toast.error('Sawal likhein');
      return;
    }

    setAdding(true);

    try {
      await linkedinApi.createQuestion(form);
      toast.success('Added');
      setForm({ question: '', buyerName: '', topic: '' });
      load();
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not add'));
    } finally {
      setAdding(false);
    }
  };

  const answer = async (id) => {
    const text = (answers[id] || '').trim();
    if (!text) {
      toast.error('Jawab likhein');
      return;
    }

    try {
      await linkedinApi.answerQuestion(id, { answer: text });
      toast.success('Saved');
      setAnswers((a) => ({ ...a, [id]: '' }));
      load();
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save'));
    }
  };

  const remove = async (id, q) => {
    if (!window.confirm('Delete this question?\n\n' + q)) return;

    try {
      await linkedinApi.deleteQuestion(id);
      toast.success('Deleted');
      load();
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Delete failed'));
    }
  };

  return (
    <div className="space-y-4">
      {/* ---------- Naya sawal ---------- */}
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-bold text-slate-800">Zain se poochhna hai</h3>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="label">Question *</label>
            <input
              className="input"
              placeholder="15 kits ki qeemat kya hogi?"
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
          </div>

          <div>
            <label className="label">Buyer</label>
            <input
              className="input"
              placeholder="Bev Suggett"
              value={form.buyerName}
              onChange={(e) => setForm((f) => ({ ...f, buyerName: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Topic</label>
            <select
              className="input"
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            >
              <option value="">—</option>
              <option value="qeemat">Qeemat</option>
              <option value="shipping">Shipping</option>
              <option value="discount">Discount</option>
              <option value="guarantee">Guarantee</option>
              <option value="delivery">Delivery date</option>
            </select>
          </div>
        </div>

        <button type="button" onClick={add} disabled={adding} className="btn-primary mt-3 py-1.5 text-xs">
          <LuPlus className="h-4 w-4" />
          {adding ? 'Adding...' : 'Add question'}
        </button>
      </div>

      {/* ---------- List ---------- */}
      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-800">
            {filter === 'Pending' ? 'Jawab ke intezar me' : filter === 'Answered' ? 'Jawab mil gaya' : 'Sab'}
            <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">
              {rows.length}
            </span>
          </h3>

          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-brand-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="Answered">Answered</option>
            <option value="All">All</option>
          </select>
        </div>

        {loading ? (
          <Spinner label="Loading..." />
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            {filter === 'Pending' ? 'Koi sawal jawab ke intezar me nahi' : 'Kuch nahi mila'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {rows.map((q) => (
              <li key={q._id} className={`p-4 ${q.isStale ? 'bg-amber-50/60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">{q.question}</p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {q.buyerName || 'koi buyer nahi'}
                      {q.topic ? ' · ' + q.topic : ''} · {formatDateTime(q.createdAt)}
                    </p>

                    {q.isStale && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-700">
                        <LuTriangleAlert className="h-3.5 w-3.5" />
                        Ek din se ziyada intezar — Zain ko yaad dilayein
                      </p>
                    )}

                    {q.status === 'Answered' && (
                      <p className="mt-2 flex items-start gap-1.5 rounded bg-green-50 p-2 text-sm text-green-900">
                        <LuCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {q.answer}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(q._id, q.question)}
                    title="Delete"
                    className="shrink-0 text-slate-400 hover:text-red-600"
                  >
                    <LuTrash2 className="h-4 w-4" />
                  </button>
                </div>

                {q.status === 'Pending' && (
                  <div className="mt-2 flex gap-2">
                    <input
                      className="input py-1.5 text-sm"
                      placeholder="Zain ka jawab..."
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q._id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && answer(q._id)}
                    />
                    <button type="button" onClick={() => answer(q._id)} className="btn-secondary shrink-0 py-1.5 text-xs">
                      Save
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LiAskZain;
