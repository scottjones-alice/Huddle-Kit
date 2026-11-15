/* oxlint-disable shadcn/no-unknown-classes -- These website classes are defined in styles/marketing.css, outside the shared UI registry theme. */
import { CLUB_PLAN } from "@alice/payments/plans";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@alice/ui/components/accordion";
import { Button } from "@alice/ui/components/button";
import {
  ArrowDown,
  ArrowUpRight,
  Flag,
  HeartHandshake,
  ShieldCheck,
  Shirt,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { FootballIntro } from "@/components/football-intro/football-intro";
import { ClubPricing } from "@/components/marketing/pricing";
import {
  HeroPreview,
  ProductShowcase,
} from "@/components/marketing/product-preview";
import { keys } from "@/lib/keys";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description:
    "Bring your grassroots football club together. People, fixtures, availability, squads and fees in one home, with Huddlekit Club from £500 a year.",
  openGraph: {
    description:
      "One home for your club’s people, fixtures, availability, squads and fees.",
    locale: "en_GB",
    siteName: "Huddlekit",
    title: "Huddlekit — Your game. Your people.",
    type: "website",
  },
  title: "Huddlekit — Your game. Your people.",
  twitter: { card: "summary_large_image" },
};

const BENEFITS = [
  {
    icon: ShieldCheck,
    number: "01",
    text: "Keep your club people, teams and fees connected. Less admin scattered across different places.",
    title: "For the organisers",
  },
  {
    icon: Flag,
    number: "02",
    text: "Get a clear view of fixtures, player availability and your matchday squad. Focus on the football.",
    title: "For the coaches",
  },
  {
    icon: Shirt,
    number: "03",
    text: "Know what’s coming up, share your availability and stay part of the team between matchdays.",
    title: "For the players",
  },
  {
    icon: HeartHandshake,
    number: "04",
    text: "Keep up with your child’s club, find the match details and stay informed about their football.",
    title: "For the parents",
  },
];
const STEPS = [
  {
    number: "01",
    text: "Give your club a home. Add your details, set things up and choose your club subscription.",
    title: "Create your club",
  },
  {
    number: "02",
    text: "Invite your coaches, players and parents. Connect people with their teams and roles.",
    title: "Bring your people together",
  },
  {
    number: "03",
    text: "Bring fixtures, availability, squads and fees into the same place. Get ready for the next kick-off.",
    title: "Organise the football",
  },
];
const FAQS = [
  {
    answer: `The club takes out one Huddlekit Club subscription, managed by a club owner or admin. It is £50 per club per month or £500 per club per year. Both billing options include the same features. ${
      CLUB_PLAN.vatNotice
    }`,
    question: "Who pays for Huddlekit?",
  },
  {
    answer:
      "No. Players, parents and coaches join their club without buying a personal Huddlekit subscription. Any membership or match fees set by the club are separate.",
    question: "Do players and parents need a subscription?",
  },
  {
    answer:
      "Start with Create your club. Create an account, add your club details and invite your people. A club owner or admin can then choose and confirm the subscription in Settings → Billing. You can save club setup and come back to it.",
    question: "How do we get our club set up?",
  },
  {
    answer:
      "Yes. The web platform is designed for phones, tablets and computers, so you can access your club from a mobile browser. You don’t need an app-store download to get started.",
    question: "Can we use Huddlekit on a phone?",
  },
  {
    answer: `${
      CLUB_PLAN.processingNotice
    } Clubs connect their payment account through Stripe Connect. Check the applicable processing terms before collecting member payments; these costs are not included in the £50 monthly or £500 yearly subscription.`,
    question: "Are payment processing costs included?",
  },
  {
    answer:
      "Club owners and admins can open Settings → Billing to see the subscription and manage payment details or cancellation through Stripe’s billing portal. Your current subscription and renewal details are shown there before you make changes.",
    question: "Where do we manage billing or cancel?",
  },
];

export default function Home() {
  const signupUrl = `${keys().NEXT_PUBLIC_PLATFORM_URL}/signup`;
  return (
    <>
      <FootballIntro />
      <main id="main-content" className="marketing-page">
        {/* Hero composition adapted from the licensed shadcnuikit hero5 block. */}
        <section className="hero-section marketing-container">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span /> BUILT FOR GRASSROOTS FOOTBALL
            </span>
            <h1>
              Your game.
              <br />
              <span>Your people.</span>
            </h1>
            <p className="hero-description">
              The club starts with you.
              <br />
              Bring its people, fixtures, availability, squads and fees together
              in one home.
            </p>
            <div className="hero-actions">
              <Button asChild size="lg" className="rounded-full">
                <Link href={signupUrl}>
                  Create your club <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
              <Link href="#how-it-works" className="marketing-action">
                See how it works <ArrowDown size={16} aria-hidden="true" />
              </Link>
            </div>
            <p className="hero-footnote">
              <Users size={16} aria-hidden="true" /> For the people who make
              matchday happen.
            </p>
          </div>
          <HeroPreview />
        </section>
        <div className="club-strip">
          <div className="marketing-container">
            <span>From the first whistle.</span>
            <span>To the last lift home.</span>
            <strong>One club. Together.</strong>
          </div>
        </div>
        <ProductShowcase />
        <section className="marketing-section benefits-section">
          <div className="marketing-container">
            <div className="section-heading benefits-heading">
              <span className="eyebrow">Everyone has a part to play</span>
              <h2>
                A club is more
                <br />
                than its starting eleven.
              </h2>
              <p>
                Behind every game are people making it happen.
                <br />
                Give them a place to come together.
              </p>
            </div>
            <div className="benefits-grid">
              {BENEFITS.map(({ icon: Icon, number, title, text }) => (
                <article key={number} className="benefit">
                  <div className="benefit-top">
                    <Icon aria-hidden="true" />
                    <span>{number}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        {/* Numbered split layout adapted from shadcnuikit how-it-works3. */}
        <section id="how-it-works" className="marketing-section">
          <div className="marketing-container how-grid">
            <figure className="how-photo">
              <Image
                src="/images/auth/freekick.jpg"
                alt="A footballer’s boot resting on a football on a grass pitch"
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="how-photo-caption">
                <span className="eyebrow">
                  Less life admin. More touchline.
                </span>
                <p>
                  Get your club
                  <br />
                  ready to play.
                </p>
              </div>
              <span className="photo-corner" aria-hidden="true" />
            </figure>
            <div>
              <div className="section-heading">
                <span className="eyebrow">How it works</span>
                <h2>
                  Your next chapter.
                  <br />
                  Three simple steps.
                </h2>
              </div>
              <ol className="setup-steps">
                {STEPS.map(({ number, title, text }) => (
                  <li key={number}>
                    <span>{number}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link href={signupUrl} className="marketing-action">
                Let’s get your club together{" "}
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
        <section id="pricing" className="marketing-section pricing-section">
          <div className="marketing-container">
            <div className="section-heading centered">
              <span className="eyebrow">Simple club pricing</span>
              <h2>
                One plan.
                <br />
                The whole team behind you.
              </h2>
              <p>Choose the billing rhythm that works for your club.</p>
            </div>
            <ClubPricing signupUrl={signupUrl} />
          </div>
        </section>
        {/* Split heading and rounded accordion adapted from shadcnuikit faq2. */}
        <section id="faq" className="marketing-section">
          <div className="marketing-container faq-grid">
            <div className="section-heading">
              <span className="eyebrow">Before kick-off</span>
              <h2>
                A few things
                <br />
                you might be asking.
              </h2>
              <p>
                Need a hand with something else?
                <br />
                <a href="mailto:support@huddlekit.com" className="support-link">
                  Talk to us <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </p>
            </div>
            <Accordion type="single" collapsible className="faq-list">
              {FAQS.map(({ question, answer }) => (
                <AccordionItem
                  value={question}
                  key={question}
                  className="faq-item"
                >
                  <AccordionTrigger>{question}</AccordionTrigger>
                  <AccordionContent>{answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
        <section className="closing-section marketing-container">
          <div className="closing-pitch" aria-hidden="true">
            <span />
          </div>
          <span className="eyebrow">Same game. Stronger together.</span>
          <h2>
            Bring your
            <br />
            club together.
          </h2>
          <p>
            For the early arrivals. The last to leave.
            <br />
            And everyone who makes your club, your club.
          </p>
          <Button asChild size="lg" className="rounded-full">
            <Link href={signupUrl}>
              Create your club <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <span className="closing-tag">SEE YOU ON THE TOUCHLINE.</span>
        </section>
      </main>
    </>
  );
}
