"use client";

import { useEffect, useState } from "react";

interface AddressSnapshot {
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
}

export function AddressSnapshotBlock() {
  const [addressSnapshot, setAddressSnapshot] = useState<AddressSnapshot | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("tinceram.last-order");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.address) {
          setAddressSnapshot(parsed.address as AddressSnapshot);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!addressSnapshot) return null;

  return (
    <div className="mt-6 rounded-xl border border-char/10 bg-char/5 p-4 text-right dark:border-white/10 dark:bg-white/5">
      <h2 className="mb-2 text-sm font-bold">آدرس تحویل</h2>
      <p className="text-sm">{addressSnapshot.recipient_name}</p>
      <p className="num-latin text-sm" dir="ltr">{addressSnapshot.phone}</p>
      <p className="text-sm">{addressSnapshot.address}</p>
      <p className="text-sm">
        {addressSnapshot.city}، {addressSnapshot.province} — {" "}
        <span className="num-latin" dir="ltr">{addressSnapshot.postal_code}</span>
      </p>
    </div>
  );
}
