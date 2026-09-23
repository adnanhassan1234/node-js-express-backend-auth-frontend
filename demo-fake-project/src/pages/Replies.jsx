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

  /**
   * Modal se kuch badle to section ko bata dete hain.
   *
   * Pehle yahan ek `refreshKey` tha jo `key` prop me jata tha. Uska nateeja
   * ye nikla ke RepliesSection har check ke baad DOBARA MOUNT hota tha, aur
   * mount par phir check chalti thi -- yani ek na khatam hone wala chakkar.
   * Ab section apna data khud sambhalta hai; sirf isharaa bhejte hain.
   */
  const [reloadSignal, setReloadSignal] = useState(0);

  const refresh = () => setReloadSignal((n) => n + 1);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Clients ke Replies</h2>
        <p className="text-sm text-slate-500">
          Replies read from your mailbox and matched to your contacts
        </p>
      </div>

      {/* key prop jaan boojh kar nahi hai -- wo remount ka chakkar bana deta tha */}
      <RepliesSection onOpenContact={setSelectedId} reloadSignal={reloadSignal} />

      {/* Madad — khaas taur par spam wale mamle ke liye */}
      <div className="card p-5">
        <h3 className="mb-2 text-sm font-bold text-slate-800">Not seeing a reply?</h3>

        <ul className="space-y-1.5 text-xs leading-relaxed text-slate-600">
          <li>
            • <strong>The app checks your mailbox on its own</strong> (every few minutes). When a
            reply arrives, this list and the bell in the navbar update by themselves — no refresh
            needed. To check right away, press &quot;Check Replies&quot;.
          </li>
          <li>
            • <strong>The Spam folder is checked too.</strong> If your outgoing email landed in
            spam, the reply often does as well — the app reads both folders and flags anything that
            came from spam.
          </li>
          <li>
              • <strong>Did they reply from another address?</strong> The app matches a reply to a
              contact by their email address. If they answered from a different address (a personal
              one, for example) it will not be matched.
          </li>
          <li>
            • <strong>Older than 14 days?</strong> The app only looks at the last 14 days. Increase
            <code className="rounded bg-slate-100 px-1">INBOX_SCAN_DAYS</code> if you need a longer
            window.
          </li>
          <li>
            • <strong>Is IMAP enabled in Gmail?</strong> Gmail Settings → Forwarding and POP/IMAP →
            IMAP must be turned on.
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
