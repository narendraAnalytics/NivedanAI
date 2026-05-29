import IntroSplashWrapper from "@/components/landing/IntroSplashWrapper";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ProblemSolution from "@/components/landing/ProblemSolution";
import Agents from "@/components/landing/Agents";
import HowItWorks from "@/components/landing/HowItWorks";
import Benefits from "@/components/landing/Benefits";
import Audience from "@/components/landing/Audience";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import ScrollRevealSetup from "@/components/landing/ScrollReveal";

export default function Home() {
  return (
    <>
      <IntroSplashWrapper />
      <ScrollRevealSetup />
      <Navbar />
      <main>
        <Hero />
        <ProblemSolution />
        <Agents />
        <HowItWorks />
        <Benefits />
        <Audience />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
