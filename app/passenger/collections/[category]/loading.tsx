export default function LoadingCollection() {
  return <main className="page-shell space-y-6 py-12" aria-busy="true"><p role="status" className="text-lg font-semibold">Tur koleksiyonu yükleniyor…</p><div className="grid gap-5 md:grid-cols-3">{[0, 1, 2].map((index) => <div className="h-80 animate-pulse rounded-2xl bg-slate-200" aria-hidden="true" key={index} />)}</div></main>;
}
