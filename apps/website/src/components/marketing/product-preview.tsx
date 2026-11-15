/* oxlint-disable shadcn/no-unknown-classes -- These website classes are defined in styles/marketing.css, outside the shared UI registry theme. */
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@alice/ui/components/tabs";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  PoundSterling,
  Shield,
  Shirt,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

const LINEUP = [
  { left: "35%", name: "Morgan", number: 9, top: "21%" },
  { left: "65%", name: "Taylor", number: 11, top: "21%" },
  { left: "21%", name: "Jordan", number: 7, top: "48%" },
  { left: "50%", name: "Alex", number: 8, top: "44%" },
  { left: "79%", name: "Casey", number: 10, top: "48%" },
  { left: "35%", name: "Sam", number: 4, top: "70%" },
  { left: "65%", name: "Riley", number: 5, top: "70%" },
  { left: "50%", name: "Jamie", number: 1, top: "89%" },
] as const;

const AVAILABILITY_PLAYERS = [
  { initials: "JM", name: "Jamie Morgan", status: "Available" },
  { initials: "AT", name: "Alex Taylor", status: "Available" },
  { initials: "SP", name: "Sam Parker", status: "Unavailable" },
  { initials: "CL", name: "Casey Lee", status: "Awaiting reply" },
] as const;

export function TeamPitch() {
  return (
    <div
      className="team-pitch"
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- This CSS illustration needs child elements, which a native img cannot contain.
      role="img"
      aria-label="Illustrative eight-player team sheet for fictional Meadowfield FC, arranged on a football pitch"
    >
      <div className="pitch-boundary" aria-hidden="true">
        <span className="pitch-halfway" />
        <span className="pitch-circle" />
        <span className="pitch-box pitch-box-top" />
        <span className="pitch-box pitch-box-bottom" />
      </div>
      {LINEUP.map((player) => (
        <div
          key={player.number}
          className="pitch-player"
          style={{ left: player.left, top: player.top }}
          aria-hidden="true"
        >
          <div className="player-shirt">
            <Shirt />
            <b>{player.number}</b>
          </div>
          <span>{player.name}</span>
        </div>
      ))}
    </div>
  );
}

export function HeroPreview() {
  return (
    <figure className="hero-preview">
      <div className="preview-topline">
        <span>
          <Shield size={17} aria-hidden="true" /> MEADOWFIELD FC
        </span>
        <span className="preview-live">
          <span /> Matchday ready
        </span>
      </div>
      <div className="preview-match">
        <div>
          <span className="eyebrow">Up next · Sunday 22 November</span>
          <h2>
            One club.
            <br />
            All together.
          </h2>
        </div>
        <span className="fixture-number">01</span>
      </div>
      <div className="preview-pitch-wrap">
        <TeamPitch />
        <div className="availability-float">
          <span className="round-check">
            <Check size={18} />
          </span>
          <div>
            <strong>Squad taking shape</strong>
            <span>12 available · 2 to reply</span>
          </div>
          <div className="avatar-stack">
            <i>JM</i>
            <i>AT</i>
            <i>+10</i>
          </div>
        </div>
      </div>
      <div className="preview-bottom">
        <div>
          <strong>
            Meadowfield <span>vs</span> Riverside
          </strong>
          <span>
            <MapPin size={13} aria-hidden="true" /> Home ground · 10:30 kick-off
          </span>
        </div>
        <span className="preview-pill">Under-12s</span>
      </div>
      <figcaption>
        Illustrative product preview · Fictional club and players
      </figcaption>
    </figure>
  );
}

function ScreenFrame({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <div className="example-screen">
      <div className="example-toolbar">
        <span>
          <Shield size={18} aria-hidden="true" /> Meadowfield FC
        </span>
        <span className="demo-label">Demo club</span>
      </div>
      <div className="example-body">
        <div className="screen-heading">
          <h3>{title}</h3>
          <span>{detail}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function FixturesScreen() {
  return (
    <ScreenFrame title="The week ahead" detail="November · Under-12s">
      <div className="fixture-row">
        <div className="date-tile">
          <span>WED</span>
          <strong>18</strong>
        </div>
        <div>
          <span className="status-chip">Training</span>
          <h4>Midweek training</h4>
          <p>18:00–19:15 · Community pitches</p>
        </div>
      </div>
      <div className="fixture-row featured-fixture">
        <div className="date-tile">
          <span>SUN</span>
          <strong>22</strong>
        </div>
        <div>
          <span className="status-chip">Home fixture</span>
          <h4>Meadowfield vs Riverside</h4>
          <p>10:30 kick-off · Home ground</p>
          <span className="fixture-note">
            <Clock3 size={14} aria-hidden="true" /> Meet at 10:00 · Bring your
            green kit
          </span>
        </div>
      </div>
      <div className="screen-note">
        <CheckCircle2 size={16} aria-hidden="true" /> The details your team
        needs, in one place.
      </div>
    </ScreenFrame>
  );
}

function AvailabilityScreen() {
  return (
    <ScreenFrame title="Who can make Sunday?" detail="Meadowfield vs Riverside">
      <div className="response-totals">
        <div>
          <strong>12</strong>
          <span>Available</span>
        </div>
        <div>
          <strong>2</strong>
          <span>Unavailable</span>
        </div>
        <div>
          <strong>2</strong>
          <span>To reply</span>
        </div>
      </div>
      <ul className="demo-people">
        {AVAILABILITY_PLAYERS.map((player) => (
          <li key={player.name}>
            <span className="person-avatar">{player.initials}</span>
            <strong>{player.name}</strong>
            <span className="response-status" data-status={player.status}>
              {player.status}
            </span>
          </li>
        ))}
      </ul>
    </ScreenFrame>
  );
}

function SquadsScreen() {
  return (
    <ScreenFrame title="Your Sunday squad" detail="Under-12s · Team sheet">
      <div className="squad-example">
        <TeamPitch />
        <div className="squad-notes">
          <span className="status-chip">Matchday squad</span>
          <h4>A place for every player.</h4>
          <p>Starting team</p>
          <strong>8 players</strong>
          <p>Also in the squad</p>
          <span>
            Charlie · Finley
            <br />
            Harper · Ellis
          </span>
          <div className="screen-note">
            <Shirt size={17} aria-hidden="true" /> Green kit
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

function FeesScreen() {
  return (
    <ScreenFrame title="Keep on top of club fees" detail="November membership">
      <div className="fee-totals">
        <span>Collected this month</span>
        <strong>
          £240 <small>of £320</small>
        </strong>
        <div
          className="fee-bar"
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- This CSS illustration needs child elements, which a native img cannot contain.
          role="img"
          aria-label="75 per cent of this example collection paid"
        >
          <span />
        </div>
        <span>12 paid · 4 awaiting payment</span>
      </div>
      <ul className="demo-people">
        {[
          { name: "Jamie Morgan", status: "Paid" },
          { name: "Alex Taylor", status: "Paid" },
          { name: "Casey Lee", status: "Due" },
        ].map((person) => (
          <li key={person.name}>
            <strong>{person.name}</strong>
            <span>£20</span>
            <span className="response-status" data-status={person.status}>
              {person.status}
            </span>
          </li>
        ))}
      </ul>
      <p className="example-disclaimer">
        Example member fees, separate from the club’s Huddlekit subscription.
      </p>
    </ScreenFrame>
  );
}

const FEATURES = [
  {
    heading: "Less chasing. More football.",
    icon: CalendarDays,
    id: "fixtures",
    label: "Fixtures",
    points: [
      "Fixtures and training in one schedule",
      "The right time, place and matchday details",
      "A shared view for your club",
    ],
    screen: <FixturesScreen />,
    text: "From midweek training to Sunday kick-off, bring your fixtures, times and locations together. Give everyone a clear view of what’s coming up.",
  },
  {
    heading: "Know who’s in.",
    icon: Users,
    id: "availability",
    label: "Availability",
    points: [
      "Responses linked to the right event",
      "Available, unavailable and awaiting reply",
      "Less scrolling through group chats",
    ],
    screen: <AvailabilityScreen />,
    text: "Give players and parents a clear place to respond. See who’s available and who still needs to reply before you put the team together.",
  },
  {
    heading: "Put your people in position.",
    icon: Shirt,
    id: "squads",
    label: "Squads",
    points: [
      "Your teams and players connected",
      "A clear view of the matchday squad",
      "Keep coaches and club organisers aligned",
    ],
    screen: <SquadsScreen />,
    text: "Turn availability into a matchday squad. Keep your team organised, with player information and team sheets close at hand.",
  },
  {
    heading: "Club fees, with a clear picture.",
    icon: PoundSterling,
    id: "fees",
    label: "Fees",
    points: [
      "Set up your club’s member fees",
      "See paid and outstanding payments",
      "Collect payments through Stripe Connect",
    ],
    screen: <FeesScreen />,
    text: "Bring member fees and payment tracking together. Keep sight of what’s been paid and what’s outstanding, alongside the people those payments belong to.",
  },
] as const;

/** Adapted from licensed shadcnuikit feature8; the product examples are Huddlekit illustrations. */
export function ProductShowcase() {
  return (
    <section id="features" className="marketing-section showcase-section">
      <div className="marketing-container">
        <div className="section-heading centered">
          <span className="eyebrow">Your club, connected</span>
          <h2>
            Everything around
            <br />
            the beautiful game.
          </h2>
          <p>One home for the jobs that make football happen.</p>
        </div>
        <Tabs defaultValue="fixtures" className="showcase-tabs">
          <TabsList
            aria-label="Explore Huddlekit features"
            className="feature-tabs"
          >
            {FEATURES.map(({ id, label, icon: Icon }) => (
              <TabsTrigger value={id} key={id}>
                <Icon size={17} aria-hidden="true" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {FEATURES.map((feature) => (
            <TabsContent
              value={feature.id}
              key={feature.id}
              className="feature-panel"
            >
              <div className="feature-copy">
                <span className="feature-icon">
                  <feature.icon size={23} aria-hidden="true" />
                </span>
                <h3>{feature.heading}</h3>
                <p>{feature.text}</p>
                <ul>
                  {feature.points.map((point) => (
                    <li key={point}>
                      <Check size={16} aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <figure>
                {feature.screen}
                <figcaption>
                  Illustrative screens · All club, player and payment data is
                  fictional.
                </figcaption>
              </figure>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
