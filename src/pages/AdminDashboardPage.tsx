import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminDataTable from "@/components/admin/AdminDataTable";
import AdminBulkImport from "@/components/admin/AdminBulkImport";
import AdminAiGenerator from "@/components/admin/AdminAiGenerator";
import AdminReviewQueue from "@/components/admin/AdminReviewQueue";
import AdminMediaManager from "@/components/admin/AdminMediaManager";
import AdminRelationshipEditor from "@/components/admin/AdminRelationshipEditor";
import AdminDataQuality from "@/components/admin/AdminDataQuality";
import {
  Database, Upload, Sparkles, ClipboardCheck, Image, Link2, ShieldCheck,
  Calendar, Users, Crown, Globe, MapPin, Clock, Film,
} from "lucide-react";

type EntityType = "historical_events" | "historical_figures" | "dynasties" | "civilizations" | "locations" | "time_periods" | "media_assets";

const DATA_TABS: { value: EntityType; label: string; icon: React.ReactNode }[] = [
  { value: "historical_events", label: "Events", icon: <Calendar className="h-4 w-4" /> },
  { value: "historical_figures", label: "Figures", icon: <Users className="h-4 w-4" /> },
  { value: "dynasties", label: "Dynasties", icon: <Crown className="h-4 w-4" /> },
  { value: "civilizations", label: "Civilizations", icon: <Globe className="h-4 w-4" /> },
  { value: "locations", label: "Locations", icon: <MapPin className="h-4 w-4" /> },
  { value: "time_periods", label: "Time Periods", icon: <Clock className="h-4 w-4" /> },
  { value: "media_assets", label: "Media", icon: <Film className="h-4 w-4" /> },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("data");
  const [activeEntity, setActiveEntity] = useState<EntityType>("historical_events");

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Please log in as an admin to access the dashboard.</p>
        </div>
      </div>
    );
  }

  const SECTIONS = [
    { id: "data", label: "Data Management", icon: <Database className="h-4 w-4" /> },
    { id: "import", label: "Bulk Import", icon: <Upload className="h-4 w-4" /> },
    { id: "ai", label: "AI Generator", icon: <Sparkles className="h-4 w-4" /> },
    { id: "review", label: "Review Queue", icon: <ClipboardCheck className="h-4 w-4" /> },
    { id: "media", label: "Media Library", icon: <Image className="h-4 w-4" /> },
    { id: "relationships", label: "Relationships", icon: <Link2 className="h-4 w-4" /> },
    { id: "quality", label: "Data Quality", icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
          <Badge variant="secondary" className="ml-auto">Historical Database Management</Badge>
        </div>

        {/* Section Navigation */}
        <div className="flex gap-2 flex-wrap mb-6">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeSection === "data" && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {DATA_TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveEntity(tab.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeEntity === tab.value
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary/30 text-muted-foreground hover:bg-secondary/60"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            <AdminDataTable entityType={activeEntity} />
          </div>
        )}

        {activeSection === "import" && <AdminBulkImport />}
        {activeSection === "ai" && <AdminAiGenerator />}
        {activeSection === "review" && <AdminReviewQueue />}
        {activeSection === "media" && <AdminMediaManager />}
        {activeSection === "relationships" && <AdminRelationshipEditor />}
        {activeSection === "quality" && <AdminDataQuality />}
      </div>
    </div>
  );
}
