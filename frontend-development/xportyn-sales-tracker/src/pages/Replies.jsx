import { useState } from 'react';

import RepliesSection from '../components/RepliesSection';
import ContactModal from '../components/ContactModal';

/**
 * Clients ke jawab — poora page.
 *
 * Modal ke bajaye alag page is liye ke emails lambi hoti hain aur yahan
 * aaram se parhi ja sakti hain.
 */
const Replies = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Clients ke Replies</h2>
        <p className="text-sm text-slate-500">
          Aap ke mailbox se parh kar contacts ke sath joray gaye jawab
        </p>
      </div>

      <RepliesSection key={refreshKey} onOpenContact={setSelectedId} onChanged={refresh} />

      {/* Madad — khaas taur par spam wale mamle ke liye */}
      <div className="card p-5">
        <h3 className="mb-2 text-sm font-bold text-slate-800">Reply nazar nahi aa raha?</h3>

        <ul className="space-y-1.5 text-xs leading-relaxed text-slate-600">
          <li>
            • <strong>"Check Replies" dabaya?</strong> App khud ba khud nahi dekhti — button
            dabane par aap ka mailbox parhti hai.
          </li>
          <li>
            • <strong>Spam folder bhi parha jata hai.</strong> Agar aap ki bheji hui email spam
            me gayi thi to jawab bhi aksar spam me aata hai — app dono jagah dekhti hai aur spam
            wale par nishan laga deti hai.
          </li>
          <li>
            • <strong>Jawab kisi aur address se aaya?</strong> App reply ko contact ke email se
            milati hai. Agar unhone kisi doosre address se jawab diya (maslan personal email) to
            match nahi hoga.
          </li>
          <li>
            • <strong>14 din se purana?</strong> App pichle 14 din ki emails dekhti hai. Ziyada
            chahiye to <code className="rounded bg-slate-100 px-1">INBOX_SCAN_DAYS</code> barha
            dein.
          </li>
          <li>
            • <strong>Gmail me IMAP on hai?</strong> Gmail Settings → Forwarding and POP/IMAP →
            IMAP enable hona zaroori hai.
          </li>
        </ul>
      </div>

      {selectedId && (
        <ContactModal
          contactId={selectedId}
          onClose={() => setSelectedId(null)}
          onSaved={refresh}
          onDeleted={refresh}
        />
      )}
    </div>
  );
};

export default Replies;
