"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type Me = {
  name: string;
  email: string;
  cardNumber: string;
  qr: string;
  stamps: number;
  cycles: number;
  nextLine: string;
  birthday: string | null;
  consent: boolean;
  since: string;
  visits: number;
  rewards: { id: number; type: string; title: string; sub: string; giftFrom: string | null; giftable: boolean }[];
  gifts: { id: number; token: string; created_at: string; type: string }[];
  used: { type: string; redeemed_at: string; gift_from: string | null }[];
  week: { savedThisMonth: boolean; resetRecently: boolean; mondayWarning: boolean };
  claim: { id: number; status: "pending" | "added" | "rejected"; createdAt: string } | null;
  provider: string;
  lang: "pl" | "en";
  notifications: boolean;
  referralCode: string | null;
  history: { id: number; kind: string; count: number; stamps_after: number | null; reward_type: string | null; created_at: string; staff_name: string | null }[];
};

export function useMe(pollMs = 0) {
  const [me, setMe] = useState<Me | null>(null);
  const [change, setChange] = useState<{ added: number; key: number } | null>(null);
  const last = useRef<{ stamps: number; cycles: number; rewards: number } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/guest/me", { cache: "no-store" });
    if (r.status === 401) {
      window.location.href = "/witaj";
      return;
    }
    if (!r.ok) return;
    const data: Me = await r.json();
    const prev = last.current;
    if (prev) {
      const added = data.cycles * 9 + data.stamps - (prev.cycles * 9 + prev.stamps);
      if (added > 0) setChange({ added, key: Date.now() });
    }
    last.current = { stamps: data.stamps, cycles: data.cycles, rewards: data.rewards.length };
    setMe(data);
  }, []);

  useEffect(() => {
    load();
    if (!pollMs) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, pollMs);
    return () => clearInterval(t);
  }, [load, pollMs]);

  return { me, reload: load, change, clearChange: () => setChange(null) };
}
