import Nav from "@/components/Nav";
import Hero from "@/components/sections/Hero";
import Problem from "@/components/sections/Problem";
import Solution from "@/components/sections/Solution";
import DataFlow from "@/components/sections/DataFlow";
import LiveDashboard from "@/components/sections/LiveDashboard";
import TechStack from "@/components/sections/TechStack";
import Impact from "@/components/sections/Impact";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Problem />
      <Solution />
      <DataFlow />
      <LiveDashboard />
      <TechStack />
      <Impact />
      <Footer />
    </main>
  );
}
