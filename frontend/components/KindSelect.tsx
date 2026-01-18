import { useEffect, useState } from "react";
import { getKinds, KindGroup } from "../lib/api";

type Props = {
  value?: string | null; // kind_code (например, "tm/word")
  onChange: (kindCode: string | null) => void;
};

export default function KindSelect({ value = null, onChange }: Props) {
  const [groups, setGroups] = useState<KindGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getKinds()
      .then((g) => { if (alive) setGroups(Array.isArray(g) ? g : []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const current = (() => {
    for (const g of groups) {
      for (const k of g.kinds || []) {
        if (k.code === value) return k;
      }
    }
    return null;
  })();

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="border rounded-lg px-3 py-2 min-w-[180px] bg-white"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
      >
        {current ? `${current.name}` : "Вид/подвид ИС"}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-80 max-h-72 overflow-auto bg-white border rounded-xl shadow">
          {groups.map((g) => (
            <div key={g.id} className="p-2">
              <div className="text-xs text-slate-500 px-2 py-1">{g.name}</div>
              <ul>
                {(g.kinds || []).map((k) => (
                  <li key={`${g.id}-${k.id}`}>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 hover:bg-emerald-50 ${k.code === value ? "bg-emerald-100" : ""}`}
                      onClick={() => { onChange(k.code || null); setOpen(false); }}
                    >
                      {k.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!groups.length && <div className="p-3 text-sm text-slate-500">Нет данных</div>}
        </div>
      )}
    </div>
  );
}
