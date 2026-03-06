import { Header } from "@/components/Header";
import { TimelineSection } from "@/components/TimelineSection";

const Timeline = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <TimelineSection />
      </div>
    </div>
  );
};

export default Timeline;
