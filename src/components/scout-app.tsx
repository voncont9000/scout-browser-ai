import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Bookmark, ChartNoAxesCombined, Check, ChevronRight,
  CircleHelp, Filter, Heart, ListFilter, Menu, Search, Settings, ShieldCheck,
  SlidersHorizontal, Sparkles, Star, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { categories, countries, demoListings, periods, sources, type TriState } from "@/lib/scout-data";
import { saveScreeningProfile } from "@/lib/scout.functions";
import { useServerFn } from "@tanstack/react-start";

type View = "feed" | "shortlist" | "screening" | "lab" | "settings";

const nav = [
  { id: "feed" as const, label: "Discover", icon: Search },
  { id: "shortlist" as const, label: "Shortlist", icon: Bookmark },
  { id: "screening" as const, label: "Screening", icon: ShieldCheck },
  { id: "lab" as const, label: "Ranker Lab", icon: ChartNoAxesCombined },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

function Brand() {
  return <div className="flex items-center gap-3"><div className="grid size-9 place-items-center border border-primary bg-primary text-primary-foreground"><span className="font-display text-xl">S</span></div><div><div className="font-display text-xl leading-none">Scout</div><div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Dealer intelligence</div></div></div>;
}

function TriStateControl({ value, onChange }: { value: TriState; onChange: (value: TriState) => void }) {
  const next: Record<TriState, TriState> = { neutral: "include", include: "exclude", exclude: "neutral" };
  return <Button type="button" variant="ghost" size="icon" aria-label={`Set preference, currently ${value}`} onClick={(event) => { event.stopPropagation(); onChange(next[value]); }} className={cn("size-8 rounded-full border", value === "include" && "border-success bg-success text-success-foreground hover:bg-success/90", value === "exclude" && "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90", value === "neutral" && "border-border bg-background text-muted-foreground")}>{value === "include" ? <Check /> : value === "exclude" ? <X /> : <CircleHelp />}</Button>;
}

export function ScoutApp() {
  const [view, setView] = useState<View>("feed");
  const [index, setIndex] = useState(0);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [detail, setDetail] = useState(false);
  const [profile, setProfile] = useState<Record<string, TriState>>({ "Art Deco": "include", "Mid Century Modern": "include", Victorian: "exclude", Armchairs: "include", Sideboards: "include", Lighting: "neutral" });
  const [category, setCategory] = useState<string>("All");
  const [onboarding, setOnboarding] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem("scout-onboarded")) setOnboarding(true);
  }, []);

  const interests = categories.filter((item) => profile[item] === "include");
  const pillCategories = interests.length ? interests : categories;
  const allowed = demoListings.filter((item) => profile[item.source] !== "exclude");
  const deck = category === "All" ? allowed : allowed.filter((item) => item.category === category);
  const listing = deck.length ? deck[index % deck.length] : undefined;

  const chooseCategory = (next: string) => { setCategory(next); setIndex(0); setDetail(false); };

  const advance = (action: "pass" | "like" | "super") => {
    if (!listing) return;
    if (action === "pass") setPassed((current) => [...new Set([...current, listing.id])]);
    if (action === "super") setShortlist((current) => [...new Set([...current, listing.id])]);
    setDetail(false);
    setIndex((current) => (current + 1) % Math.max(deck.length, 1));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (view !== "feed" || detail) return;
      if (event.key === "ArrowLeft") advance("pass");
      if (event.key === "ArrowRight") advance("like");
      if (event.key === "ArrowUp") advance("super");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-sidebar px-5 py-6 lg:flex lg:flex-col">
        <Brand />
        <nav className="mt-12 space-y-1">{nav.map((item) => <Button key={item.id} variant="ghost" onClick={() => setView(item.id)} className={cn("w-full justify-start px-3 text-muted-foreground", view === item.id && "bg-accent text-foreground")}><item.icon />{item.label}{item.id === "shortlist" && shortlist.length > 0 && <span className="ml-auto text-xs">{shortlist.length}</span>}</Button>)}</nav>
        <div className="mt-auto border-t border-border pt-5"><div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Screening active</div><div className="mt-2 flex items-center gap-2 text-sm"><span className="size-2 rounded-full bg-success" /> 9 sources monitored</div><a href="/auth" className="mt-4 block text-sm text-primary underline-offset-4 hover:underline">Sign in to sync</a></div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:ml-64 lg:px-8"><div className="lg:hidden"><Brand /></div><div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex"><Sparkles className="size-4 text-primary" /> 27 new matches since yesterday</div><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Choose categories" onClick={() => setOnboarding(true)}><Filter /></Button><Button variant="outline" className="hidden sm:inline-flex" asChild><a href="/auth">Sign in</a></Button></div></header>

      <main className="pb-24 lg:ml-64 lg:pb-8">
        {view === "feed" && <><CategoryPills listings={allowed} items={pillCategories} active={category} onChange={chooseCategory} onEdit={() => setOnboarding(true)} />{listing ? <Feed listing={listing} index={index % deck.length} total={deck.length} onAction={advance} onDetail={() => setDetail(true)} /> : <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8"><Empty icon={Search} title={`No ${category.toLowerCase()} yet`} body="Scout will add matching finds here as new listings pass screening." /></div>}</>}
        {view === "shortlist" && <Shortlist ids={shortlist} onOpen={(id) => { setIndex(demoListings.findIndex((item) => item.id === id)); setView("feed"); setDetail(true); }} />}
        {view === "screening" && <Screening />}
        {view === "lab" && <RankerLab />}
        {view === "settings" && <SettingsView profile={profile} setProfile={setProfile} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">{nav.map((item) => <Button key={item.id} variant="ghost" onClick={() => setView(item.id)} className={cn("h-14 flex-col gap-1 rounded-none px-1 text-[10px] text-muted-foreground", view === item.id && "text-primary")}><item.icon className="size-5" />{item.label.replace("Ranker ", "")}</Button>)}</nav>

      {onboarding && <Onboarding profile={profile} setProfile={setProfile} onDone={() => { window.localStorage.setItem("scout-onboarded", "1"); setOnboarding(false); chooseCategory("All"); }} />}
      {detail && listing ? <Detail listing={listing} onClose={() => setDetail(false)} onSave={() => advance("super")} /> : null}
    </div>
  );
}

function Feed({ listing, index, total, onAction, onDetail }: { listing: (typeof demoListings)[number]; index: number; total: number; onAction: (action: "pass" | "like" | "super") => void; onDetail: () => void }) {
  return <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8 lg:py-8"><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow">Curated for your profile</p><h1 className="mt-1 font-display text-3xl sm:text-4xl">Today’s finds</h1></div><span className="text-sm text-muted-foreground">{index + 1} / {total}</span></div><div className="grid gap-6 lg:grid-cols-[minmax(0,640px)_1fr]"><article className="overflow-hidden border border-border bg-card shadow-catalogue"><button type="button" onClick={onDetail} className="group relative block aspect-[4/5] w-full overflow-hidden text-left"><img src={listing.image} alt={listing.title} width={1200} height={1504} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" /><div className="absolute left-4 top-4 flex items-center gap-2"><span className="bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur">{listing.flag} {listing.source}</span><span className="bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground">{listing.marginPercent} margin</span></div><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-overlay via-overlay/50 to-transparent p-5 pt-24 text-overlay-foreground"><div className="flex items-end justify-between gap-4"><div><p className="text-sm opacity-80">{listing.location}</p><h2 className="mt-1 font-display text-3xl">{listing.title}</h2></div><div className="text-right"><div className="text-2xl font-semibold">{listing.priceLabel}</div><div className="text-xs opacity-75">asking price</div></div></div></div></button><div className="grid grid-cols-3 border-t border-border"><Button variant="ghost" onClick={() => onAction("pass")} className="h-16 rounded-none border-r border-border text-destructive"><ArrowLeft /> Pass</Button><Button variant="ghost" onClick={() => onAction("super")} className="h-16 rounded-none border-r border-border text-primary"><Star /> Save</Button><Button variant="ghost" onClick={() => onAction("like")} className="h-16 rounded-none text-success"><Heart /> Like <ArrowRight /></Button></div></article><aside className="space-y-6 lg:pt-2"><div><p className="eyebrow">Scout estimate</p><div className="mt-2 flex items-baseline justify-between border-b border-border pb-4"><span className="font-display text-3xl">{listing.resale}</span><span className="text-sm text-muted-foreground">resale</span></div><div className="flex items-baseline justify-between py-4"><span className="text-sm text-muted-foreground">Estimated margin</span><span className="text-xl font-semibold text-success">{listing.margin}</span></div></div><div className="flex flex-wrap gap-2"><span className="tag">{listing.period}</span><span className="tag">{listing.style}</span><span className="tag">{listing.confidence}% confidence</span></div><div className="border-l-2 border-primary pl-4"><p className="eyebrow">Dealer note</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{listing.note}</p></div><Button variant="outline" onClick={onDetail} className="w-full justify-between">Inspect listing <ChevronRight /></Button><p className="text-center text-xs text-muted-foreground">Use ← to pass, ↑ to save, → to like</p></aside></div></div>;
}

function Detail({ listing, onClose, onSave }: { listing: (typeof demoListings)[number]; onClose: () => void; onSave: () => void }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-background"><div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-8"><Button variant="ghost" onClick={onClose}><ArrowLeft /> Back</Button><Button onClick={onSave}><Bookmark /> Save</Button></div><div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]"><img src={listing.image} alt={listing.title} width={1200} height={1504} className="w-full border border-border object-cover" /><div><p className="eyebrow">{listing.flag} {listing.source} · {listing.location}</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">{listing.title}</h1><div className="mt-6 grid grid-cols-2 gap-px bg-border border border-border"><div className="bg-background p-4"><p className="eyebrow">Listed</p><p className="mt-2 text-2xl font-semibold">{listing.priceLabel}</p></div><div className="bg-background p-4"><p className="eyebrow">Resale</p><p className="mt-2 text-2xl font-semibold">{listing.resale}</p></div></div><div className="mt-6 flex flex-wrap gap-2"><span className="tag">{listing.period}</span><span className="tag">{listing.style}</span><span className="tag">{listing.confidence}% confidence</span></div><section className="mt-8 border-t border-border pt-6"><p className="eyebrow">Scout’s assessment</p><p className="mt-3 leading-7">{listing.note}</p></section><section className="mt-8 border-t border-border pt-6"><p className="eyebrow">Check before buying</p><ul className="mt-3 space-y-3">{listing.redFlags.map((flag) => <li key={flag} className="flex gap-3 text-sm"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-warning" />{flag}</li>)}</ul></section><Button className="mt-8 w-full" disabled title="Sample listing">Original link available on live listings</Button><p className="mt-2 text-center text-xs text-muted-foreground">This is a sample find. Live finds open the seller’s page.</p></div></div></div>;
}

function Shortlist({ ids, onOpen }: { ids: string[]; onOpen: (id: string) => void }) { const items = demoListings.filter((item) => ids.includes(item.id)); return <Page title="Shortlist" eyebrow="Saved opportunities"><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{items.length ? items.map((item) => <button key={item.id} onClick={() => onOpen(item.id)} className="group border border-border bg-card text-left"><div className="aspect-[4/3] overflow-hidden"><img src={item.image} alt={item.title} width={1200} height={1504} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></div><div className="p-4"><p className="eyebrow">{item.source} · {item.flag}</p><h2 className="mt-2 font-display text-2xl">{item.title}</h2><div className="mt-4 flex justify-between text-sm"><span>{item.priceLabel}</span><span className="font-semibold text-success">{item.margin}</span></div></div></button>) : <Empty icon={Bookmark} title="Your shortlist is ready" body="Save standout finds from Discover and they’ll collect here." />}</div></Page>; }

function Screening() { const stats = [{ label: "Fetched", value: 418, percent: 100 }, { label: "Passed text", value: 126, percent: 30 }, { label: "Passed vision", value: 43, percent: 10 }, { label: "Maybe", value: 11, percent: 3 }, { label: "In feed", value: 32, percent: 8 }]; return <Page title="Screening funnel" eyebrow="Last 24 hours"><div className="grid gap-8 xl:grid-cols-[1fr_360px]"><section className="border-t border-border">{stats.map((stat, i) => <div key={stat.label} className="grid grid-cols-[110px_1fr_54px] items-center gap-4 border-b border-border py-5"><span className="text-sm">{stat.label}</span><div className="h-2 bg-muted"><div className={cn("h-full", i < 2 ? "bg-primary" : i === 3 ? "bg-warning" : "bg-success")} style={{ width: `${Math.max(stat.percent, 3)}%` }} /></div><strong className="text-right tabular-nums">{stat.value}</strong></div>)}</section><aside className="border border-border bg-card p-5"><p className="eyebrow">Accuracy check</p><p className="mt-3 font-display text-3xl">89.7%</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Listings removed before vision screening, keeping the feed focused and model costs controlled.</p><Button variant="outline" className="mt-5 w-full">Review 6 overrides</Button></aside></div><h2 className="mt-12 font-display text-2xl">By source</h2><div className="mt-4 overflow-x-auto border border-border"><table className="w-full min-w-[600px] text-sm"><thead className="bg-muted text-left text-muted-foreground"><tr><th className="p-3 font-medium">Source</th><th>Fetched</th><th>Passed</th><th>Maybe</th><th>Pass rate</th></tr></thead><tbody>{sources.slice(0, 5).map((source, i) => <tr key={source} className="border-t border-border"><td className="p-3 font-medium">{source}</td><td>{80 - i * 9}</td><td>{14 - i}</td><td>{i + 1}</td><td>{17 - i}%</td></tr>)}</tbody></table></div></Page>; }

function RankerLab() { return <Page title="Ranker Lab" eyebrow="Learning from 184 swipes"><div className="grid gap-px border border-border bg-border sm:grid-cols-2"><Metric title="Attribute ranker" auc="0.74" precision="70%" active /><Metric title="Embedding ranker" auc="0.68" precision="60%" /></div><section className="mt-8 border-t border-border pt-6"><div className="flex items-center justify-between"><div><p className="eyebrow">AUC over time</p><h2 className="mt-2 font-display text-2xl">Preference prediction</h2></div><span className="tag">Batches of 10</span></div><div className="mt-8 flex h-64 items-end gap-2 border-b border-l border-border px-4">{[38,45,43,54,57,61,59,66,69,74,72,76].map((height, i) => <div key={i} className="flex-1 bg-primary/80" style={{ height: `${height}%` }} />)}</div><div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>20 swipes</span><span>184 swipes</span></div></section></Page>; }

function Metric({ title, auc, precision, active = false }: { title: string; auc: string; precision: string; active?: boolean }) { return <div className="bg-background p-6"><div className="flex items-center justify-between"><p className="eyebrow">{title}</p>{active && <span className="text-xs text-success">Leading</span>}</div><div className="mt-8 grid grid-cols-2 gap-6"><div><div className="font-display text-4xl">{auc}</div><div className="mt-1 text-xs text-muted-foreground">AUC</div></div><div><div className="font-display text-4xl">{precision}</div><div className="mt-1 text-xs text-muted-foreground">Precision at 10</div></div></div></div>; }

function SettingsView({ profile, setProfile }: { profile: Record<string, TriState>; setProfile: React.Dispatch<React.SetStateAction<Record<string, TriState>>> }) { const saveProfile = useServerFn(saveScreeningProfile); const [price, setPrice] = useState([0, 5000]); const [margin, setMargin] = useState([250]); const [hideRepros, setHideRepros] = useState(true); const [status, setStatus] = useState(""); const count = useMemo(() => Object.values(profile).filter((value) => value === "include").length, [profile]); const minimumPrice = price[0] ?? 0; const maximumPrice = price[1] ?? 5000; const minimumMargin = margin[0] ?? 250; const save = async () => { setStatus("Saving…"); try { const periodMap = Object.fromEntries(periods.map((item) => [item, profile[item] ?? "neutral"])); const categoryMap = Object.fromEntries(categories.map((item) => [item, profile[item] ?? "neutral"])); await saveProfile({ data: { periods: periodMap, categories: categoryMap, countries: Object.fromEntries(countries.map((item) => [item, "neutral"])), sources: Object.fromEntries(sources.map((item) => [item, profile[item] ?? "neutral"])), minPrice: minimumPrice, maxPrice: maximumPrice, minMargin: minimumMargin, hideReproductions: hideRepros } }); setStatus("Profile saved"); } catch { setStatus("Sign in to save this profile"); } }; return <Page title="Screening profile" eyebrow={`${count} active preferences`}><div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4"><div className="flex gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-success" /> Include</span><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-destructive" /> Exclude</span><span className="flex items-center gap-2"><span className="size-2 rounded-full border border-border" /> Neutral</span>{status && <span role="status">{status}</span>}</div><Button onClick={save}>Save profile</Button></div><PreferenceSection title="Periods & styles" items={periods} profile={profile} setProfile={setProfile} /><PreferenceSection title="Categories" items={categories} profile={profile} setProfile={setProfile} /><PreferenceSection title="Sources" items={sources} profile={profile} setProfile={setProfile} /><p className="-mt-8 mb-12 text-xs text-muted-foreground">Excluded marketplaces are never searched for your feed.</p><section className="mt-12 grid gap-8 border-t border-border pt-8 lg:grid-cols-2"><div><h2 className="font-display text-2xl">Price & margin</h2><label className="mt-6 block text-sm">Price range <span className="float-right text-muted-foreground">£{minimumPrice} — £{maximumPrice.toLocaleString()}</span></label><Slider className="mt-4" value={price} max={10000} step={100} onValueChange={setPrice} /><label className="mt-8 block text-sm">Minimum margin <span className="float-right text-muted-foreground">£{minimumMargin}</span></label><Slider className="mt-4" value={margin} max={2000} step={50} onValueChange={setMargin} /></div><div><h2 className="font-display text-2xl">Quality controls</h2><div className="mt-6 flex items-center justify-between border-y border-border py-5"><div><p className="text-sm font-medium">Hide reproductions</p><p className="mt-1 text-xs text-muted-foreground">Also hides “in the style of” listings</p></div><Switch checked={hideRepros} onCheckedChange={setHideRepros} /></div><h3 className="mt-8 text-sm font-medium">Countries</h3><div className="mt-3 flex flex-wrap gap-2">{countries.map((country) => <span className="tag" key={country}>{country}</span>)}</div></div></section></Page>; }

function PreferenceSection({ title, items, profile, setProfile }: { title: string; items: string[]; profile: Record<string, TriState>; setProfile: React.Dispatch<React.SetStateAction<Record<string, TriState>>> }) { return <section className="mb-12"><h2 className="font-display text-2xl">{title}</h2><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">{items.map((item) => { const value = profile[item] ?? "neutral"; return <div key={item} className={cn("flex min-h-20 items-center justify-between gap-2 border p-3 transition-colors", value === "include" && "border-success bg-success/5", value === "exclude" && "border-destructive bg-destructive/5", value === "neutral" && "border-border bg-card")}><span className="text-sm leading-5">{item}</span><TriStateControl value={value} onChange={(next) => setProfile((current) => ({ ...current, [item]: next }))} /></div>; })}</div></section>; }

function Page({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) { return <div className="mx-auto max-w-6xl px-4 py-7 sm:px-8 lg:py-10"><p className="eyebrow">{eyebrow}</p><h1 className="mt-2 mb-8 font-display text-4xl sm:text-5xl">{title}</h1>{children}</div>; }
function Empty({ icon: Icon, title, body }: { icon: typeof Bookmark; title: string; body: string }) { return <div className="col-span-full grid min-h-80 place-items-center border border-dashed border-border p-8 text-center"><div><Icon className="mx-auto size-7 text-muted-foreground" /><h2 className="mt-4 font-display text-2xl">{title}</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">{body}</p></div></div>; }

function CategoryPills({ listings, items, active, onChange, onEdit }: { listings: typeof demoListings; items: string[]; active: string; onChange: (value: string) => void; onEdit: () => void }) {
  const all = ["All", ...items];
  return <div className="sticky top-16 z-10 border-b border-border bg-background/95 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-8" role="tablist" aria-label="Filter by category">{all.map((item) => { const count = item === "All" ? listings.length : listings.filter((listing) => listing.category === item).length; const selected = active === item; return <button key={item} type="button" role="tab" aria-selected={selected} onClick={() => onChange(item)} className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors", selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground")}>{item}<span className={cn("text-xs tabular-nums", selected ? "opacity-80" : "opacity-60")}>{count}</span></button>; })}<button type="button" onClick={onEdit} className="ml-1 flex shrink-0 items-center gap-1.5 px-2 py-1.5 text-sm text-primary underline-offset-4 hover:underline"><SlidersHorizontal className="size-4" /> Edit</button></div></div>;
}

function Onboarding({ profile, setProfile, onDone }: { profile: Record<string, TriState>; setProfile: React.Dispatch<React.SetStateAction<Record<string, TriState>>>; onDone: () => void }) {
  const saveProfile = useServerFn(saveScreeningProfile);
  const [saving, setSaving] = useState(false);
  const selected = categories.filter((item) => profile[item] === "include");
  const toggle = (item: string) => setProfile((current) => ({ ...current, [item]: current[item] === "include" ? "neutral" : "include" }));
  const finish = async () => {
    setSaving(true);
    try {
      await saveProfile({ data: { periods: Object.fromEntries(periods.map((item) => [item, profile[item] ?? "neutral"])), categories: Object.fromEntries(categories.map((item) => [item, profile[item] ?? "neutral"])), countries: Object.fromEntries(countries.map((item) => [item, "neutral"])), sources: Object.fromEntries(sources.map((item) => [item, profile[item] ?? "neutral"])), minPrice: 0, maxPrice: 5000, minMargin: 250, hideReproductions: true } });
    } catch { /* signed-out visitors keep choices locally */ }
    setSaving(false);
    onDone();
  };
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-background" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><div className="mx-auto max-w-4xl px-4 pb-32 pt-10 sm:px-8"><Brand /><p className="eyebrow mt-12">Step 1 · Your stock</p><h1 id="onboarding-title" className="mt-2 font-display text-4xl sm:text-5xl">What do you buy?</h1><p className="mt-3 max-w-lg text-muted-foreground">Pick the furniture you trade. Scout will focus your finds on these, and you can change them any time.</p><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">{categories.map((item) => { const on = profile[item] === "include"; return <button key={item} type="button" aria-pressed={on} onClick={() => toggle(item)} className={cn("relative flex min-h-24 items-end border p-4 text-left transition-colors", on ? "border-primary bg-primary/5" : "border-border bg-card hover:border-foreground/30")}><span className="font-display text-xl">{item}</span><span className={cn("absolute right-3 top-3 grid size-6 place-items-center rounded-full border", on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{on && <Check className="size-3.5" />}</span></button>; })}</div></div><div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur"><div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-8"><span className="text-sm text-muted-foreground">{selected.length ? `${selected.length} selected` : "Nothing selected shows everything"}</span><Button onClick={finish} disabled={saving}>{saving ? "Saving…" : "Start scouting"} <ArrowRight /></Button></div></div></div>;
}
