import { Header } from "@/components/Header";
import { useParams, Link } from "react-router-dom";
import { getRoyalById, getHouseById, allRoyals } from "@/data/royals";
import { fixWikimediaUrl } from "@/lib/imageUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Crown, Skull, Swords, Award, Users, BookOpen } from "lucide-react";

const RoyalProfilePage = () => {
  const { houseId, royalId } = useParams<{ houseId: string; royalId: string }>();
  const royal = getRoyalById(royalId || "");
  const house = getHouseById(houseId || "");

  if (!royal || !house) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 pb-16 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-display text-foreground">Royal not found</h1>
          <Link to="/royals" className="text-primary mt-4 inline-block">← Back to Royal Archive</Link>
        </div>
      </div>
    );
  }

  // Find prev/next in house
  const idx = house.members.findIndex((m) => m.id === royal.id);
  const prev = idx > 0 ? house.members[idx - 1] : null;
  const next = idx < house.members.length - 1 ? house.members[idx + 1] : null;

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex gap-2 py-1.5 border-b border-border/50 last:border-0">
        <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
        <span className="text-sm text-foreground">{value}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to={`/royals/${houseId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to {house.name}
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Hero */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <div className="w-32 h-40 sm:w-40 sm:h-52 rounded-xl overflow-hidden bg-secondary shrink-0 shadow-card">
                <img
                  src={fixWikimediaUrl(royal.imageUrl, royal.sourceLinks)}
                  alt={`Portrait of ${royal.name}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-5 w-5" style={{ color: `hsl(${house.color})` }} />
                  <span className="text-xs font-medium" style={{ color: `hsl(${house.color})` }}>{house.name}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">{royal.name}</h1>
                {royal.nicknames.length > 0 && (
                  <p className="text-sm text-accent italic mt-1">"{royal.nicknames.join('", "')}"</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {royal.titles.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                      {t.title} ({t.from}–{t.to})
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">{royal.description}</p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-secondary/50 p-1">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="reign" className="text-xs">Reign</TabsTrigger>
                <TabsTrigger value="impact" className="text-xs">Impact</TabsTrigger>
                <TabsTrigger value="violence" className="text-xs">Wars & Violence</TabsTrigger>
                <TabsTrigger value="legacy" className="text-xs">Legacy</TabsTrigger>
                <TabsTrigger value="family" className="text-xs">Family</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Section title="Life" icon={<BookOpen className="h-4 w-4 text-primary" />}>
                  <div className="bg-card-gradient border border-border rounded-lg p-4">
                    <InfoRow label="Born" value={`${royal.born}, ${royal.birthPlace}`} />
                    <InfoRow label="Died" value={royal.died === "Living" ? "Living" : `${royal.died}, ${royal.deathPlace}`} />
                    <InfoRow label="Age at Death" value={royal.ageAtDeath?.toString()} />
                    <InfoRow label="Cause of Death" value={`${royal.causeOfDeath}${royal.causeOfDeathDisputed ? " (disputed)" : ""}`} />
                    <InfoRow label="Burial" value={royal.burialPlace} />
                    <InfoRow label="House" value={house.name} />
                    {royal.successionPosition && <InfoRow label="Succession Position" value={`#${royal.successionPosition} in ${house.name}`} />}
                  </div>
                </Section>

                <Section title="Major Milestones" icon={<Award className="h-4 w-4 text-primary" />}>
                  <ul className="space-y-1.5">
                    {royal.milestones.map((m, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-primary mt-1">•</span> {m}
                      </li>
                    ))}
                  </ul>
                </Section>
              </TabsContent>

              <TabsContent value="reign" className="mt-6">
                {royal.isMonarch ? (
                  <Section title="Reign Information" icon={<Crown className="h-4 w-4 text-primary" />}>
                    <div className="bg-card-gradient border border-border rounded-lg p-4 mb-4">
                      <InfoRow label="Accession" value={royal.reignStart} />
                      <InfoRow label="Reign End" value={royal.reignEnd} />
                      <InfoRow label="Reign Length" value={royal.reignLength} />
                      <InfoRow label="Coronation" value={royal.coronationDate} />
                      <InfoRow label="How Gained Power" value={royal.howGainedPower} />
                      <InfoRow label="How Reign Ended" value={royal.howReignEnded} />
                    </div>
                    {royal.majorActions.length > 0 && (
                      <>
                        <h4 className="font-display text-sm font-semibold text-foreground mb-2">Key Actions & Decisions</h4>
                        <ul className="space-y-1.5">
                          {royal.majorActions.map((a, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary mt-1">•</span> {a}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </Section>
                ) : (
                  <p className="text-muted-foreground">This person was not a reigning monarch.</p>
                )}
              </TabsContent>

              <TabsContent value="impact" className="mt-6">
                <Section title="Achievements" icon={<Award className="h-4 w-4 text-green-500" />}>
                  <ul className="space-y-1.5">
                    {royal.achievements.map((a, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-green-500 mt-1">✓</span> {a}
                      </li>
                    ))}
                  </ul>
                </Section>
                <Section title="Failures" icon={<Skull className="h-4 w-4 text-destructive" />}>
                  <ul className="space-y-1.5">
                    {royal.failures.map((f, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-destructive mt-1">✗</span> {f}
                      </li>
                    ))}
                  </ul>
                </Section>
              </TabsContent>

              <TabsContent value="violence" className="mt-6">
                <Section title="Wars, Violence & Death Responsibility" icon={<Swords className="h-4 w-4 text-destructive" />}>
                  {royal.warsAndViolence.length > 0 ? (
                    <div className="space-y-3">
                      {royal.warsAndViolence.map((w, i) => (
                        <div key={i} className="bg-card-gradient border border-border rounded-lg p-4">
                          <p className="text-sm text-foreground">{w.description}</p>
                          {w.estimatedDeaths && (
                            <p className="text-xs text-destructive mt-1 font-medium">Estimated casualties: {w.estimatedDeaths}</p>
                          )}
                          {w.disclaimer && (
                            <p className="text-xs text-muted-foreground mt-1 italic">⚠ {w.disclaimer}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No significant wars or violence recorded during this person's reign or lifetime.</p>
                  )}
                </Section>
              </TabsContent>

              <TabsContent value="legacy" className="mt-6">
                <Section title="Reputation & Legacy" icon={<BookOpen className="h-4 w-4 text-primary" />}>
                  <div className="space-y-4">
                    <div className="bg-card-gradient border border-border rounded-lg p-4">
                      <h4 className="text-xs text-muted-foreground mb-1">During Their Lifetime</h4>
                      <p className="text-sm text-foreground">{royal.reputationLifetime}</p>
                    </div>
                    <div className="bg-card-gradient border border-border rounded-lg p-4">
                      <h4 className="text-xs text-muted-foreground mb-1">Modern Historical View</h4>
                      <p className="text-sm text-foreground">{royal.reputationModern}</p>
                    </div>
                    {royal.controversies.length > 0 && (
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-2">Controversies</h4>
                        <ul className="space-y-1">
                          {royal.controversies.map((c, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-accent mt-1">⚡</span> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Section>
              </TabsContent>

              <TabsContent value="family" className="mt-6">
                <Section title="Family Connections" icon={<Users className="h-4 w-4 text-primary" />}>
                  {[...royal.parentIds, ...royal.spouseIds, ...royal.childIds].length > 0 ? (
                    <div className="space-y-3">
                      {royal.parentIds.length > 0 && (
                        <div>
                          <h4 className="text-xs text-muted-foreground mb-1">Parents</h4>
                          <div className="flex flex-wrap gap-2">
                            {royal.parentIds.map((pid) => {
                              const parent = allRoyals.find((r) => r.id === pid);
                              return parent ? (
                                <Link key={pid} to={`/royals/${parent.house}/${parent.id}`} className="text-sm text-primary hover:underline">
                                  {parent.name}
                                </Link>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      {royal.childIds.length > 0 && (
                        <div>
                          <h4 className="text-xs text-muted-foreground mb-1">Children</h4>
                          <div className="flex flex-wrap gap-2">
                            {royal.childIds.map((cid) => {
                              const child = allRoyals.find((r) => r.id === cid);
                              return child ? (
                                <Link key={cid} to={`/royals/${child.house}/${child.id}`} className="text-sm text-primary hover:underline">
                                  {child.name}
                                </Link>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No family connections recorded in the database.</p>
                  )}
                </Section>
              </TabsContent>
            </Tabs>

            {/* Source Links */}
            {royal.sourceLinks.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Sources</h3>
                <div className="flex flex-wrap gap-2">
                  {royal.sourceLinks.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Prev / Next Navigation */}
            <div className="mt-8 flex justify-between">
              {prev ? (
                <Link to={`/royals/${houseId}/${prev.id}`} className="text-sm text-muted-foreground hover:text-foreground">
                  ← {prev.name}
                </Link>
              ) : <span />}
              {next ? (
                <Link to={`/royals/${houseId}/${next.id}`} className="text-sm text-muted-foreground hover:text-foreground">
                  {next.name} →
                </Link>
              ) : <span />}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoyalProfilePage;
