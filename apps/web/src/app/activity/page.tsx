import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TapOk — Activity',
};

// ── Types ─────────────────────────────────────────────────────────────────────

type TextPart = { text: string; bold?: boolean; em?: boolean };
type AvatarStyle = 'teal' | 'black' | 'pale' | 'muted';
type BadgeType = 'in' | 'out';
type CrewAvStyle = 'a' | 'b' | 'c';
type PipStyle = 'active' | 'ongoing';

interface FeedItem {
  initials: string;
  avatar: AvatarStyle;
  textParts: TextPart[];
  drop: string;
  time: string;
  badge?: BadgeType;
}

interface FeedGroup {
  label: string;
  items: FeedItem[];
}

// ── Feed data ─────────────────────────────────────────────────────────────────

const feedGroups: FeedGroup[] = [
  {
    label: 'Just now',
    items: [
      {
        initials: 'MC', avatar: 'teal',
        textParts: [{ text: 'Marco', bold: true }, { text: ' tapped in' }],
        drop: 'Ramen Run', time: '2 min ago', badge: 'in',
      },
      {
        initials: 'SA', avatar: 'pale',
        textParts: [{ text: 'Sasha', bold: true }, { text: ' joined the Crew' }],
        drop: 'Ramen Run', time: '5 min ago',
      },
      {
        initials: 'YOU', avatar: 'black',
        textParts: [{ text: 'You', bold: true }, { text: ' dropped a new plan' }],
        drop: 'Ramen Run', time: '18 min ago',
      },
    ],
  },
  {
    label: 'Earlier today',
    items: [
      {
        initials: 'NI', avatar: 'muted',
        textParts: [{ text: 'Nico', bold: true }, { text: ' tapped out' }],
        drop: 'Roof Drinks', time: '3 hrs ago', badge: 'out',
      },
      {
        initials: 'RE', avatar: 'pale',
        textParts: [
          { text: 'You', bold: true }, { text: ' approved ' },
          { text: 'Rey', bold: true }, { text: "'s request" },
        ],
        drop: 'Roof Drinks', time: '4 hrs ago',
      },
      {
        initials: 'DA', avatar: 'teal',
        textParts: [{ text: 'Dani', bold: true }, { text: ' tapped in' }],
        drop: 'Roof Drinks', time: '5 hrs ago', badge: 'in',
      },
      {
        initials: 'BI', avatar: 'pale',
        textParts: [{ text: 'Bianca', bold: true }, { text: ' dropped a new plan as Chief' }],
        drop: 'Roof Drinks', time: '6 hrs ago',
      },
    ],
  },
  {
    label: 'Yesterday',
    items: [
      {
        initials: 'NI', avatar: 'muted',
        textParts: [{ text: 'Nico', bold: true }, { text: ' was removed by the Chief' }],
        drop: 'Warehouse Party', time: 'Yesterday 9:41 PM',
      },
      {
        initials: 'YOU', avatar: 'black',
        textParts: [
          { text: 'You', bold: true }, { text: ' moved the time — ' },
          { text: '9 PM → 10 PM', em: true },
        ],
        drop: 'Warehouse Party', time: 'Yesterday 6:15 PM',
      },
      {
        initials: 'MC', avatar: 'teal',
        textParts: [{ text: 'Marco', bold: true }, { text: ' tapped in' }],
        drop: 'Warehouse Party', time: 'Yesterday 5:00 PM', badge: 'in',
      },
    ],
  },
];

// ── Panel data ────────────────────────────────────────────────────────────────

const activeDrops: {
  pip: PipStyle; name: string; date: string; location: string;
  inCount: number; outCount?: number; lifecycle: string;
}[] = [
  {
    pip: 'active', name: 'Friday Night Ramen Run',
    date: 'Fri, Apr 29 · 8:00 PM', location: 'Ichiran Ramen, BGC',
    inCount: 5, lifecycle: 'Active',
  },
  {
    pip: 'active', name: 'Roof Drinks Saturday',
    date: 'Sat, Apr 30 · 7:00 PM', location: 'Penthouse, Shangri-La',
    inCount: 8, outCount: 1, lifecycle: 'Active',
  },
  {
    pip: 'ongoing', name: 'Warehouse Party',
    date: 'Tonight · Started now', location: 'Warehouse, Makati',
    inCount: 12, lifecycle: 'Ongoing',
  },
];

const crewRoster: {
  initials: string; av: CrewAvStyle; name: string;
  status: 'in' | 'out' | 'pending';
}[] = [
  { initials: 'MC', av: 'a', name: 'Marco',  status: 'in' },
  { initials: 'SA', av: 'b', name: 'Sasha',  status: 'in' },
  { initials: 'NI', av: 'c', name: 'Nico',   status: 'out' },
  { initials: 'DA', av: 'a', name: 'Dani',   status: 'in' },
  { initials: 'BI', av: 'b', name: 'Bianca', status: 'in' },
  { initials: 'RE', av: 'c', name: 'Rey',    status: 'pending' },
];

const frequentlySeen: {
  initials: string; av: CrewAvStyle; name: string; sub: string; count: number;
}[] = [
  { initials: 'MC', av: 'a', name: 'Marco',  sub: 'Always shows up', count: 6 },
  { initials: 'DA', av: 'a', name: 'Dani',   sub: 'Reliable crew',   count: 5 },
  { initials: 'BI', av: 'b', name: 'Bianca', sub: 'Often In',        count: 4 },
];

// ── Icon Components ───────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 18 18" fill="none">
      <path d="M2 7.5L9 2l7 5.5V16a.6.6 0 01-.6.6H12v-4.5H6V16.6H2.6A.6.6 0 012 16V7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 5.5V9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function DropsIcon() {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 18 18" fill="none">
      <path d="M3 5h12M3 9h8M3 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2.5 17c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-[10px] h-[10px] opacity-40 flex-shrink-0" viewBox="0 0 10 10" fill="none">
      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="w-[10px] h-[10px] opacity-40 flex-shrink-0" viewBox="0 0 10 10" fill="none">
      <path d="M5 1C3.34 1 2 2.34 2 4c0 2.5 3 5.5 3 5.5S8 6.5 8 4c0-1.66-1.34-3-3-3z" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

// ── Reusable UI ───────────────────────────────────────────────────────────────

const feedAvatarCls: Record<AvatarStyle, string> = {
  teal:  'bg-tok-teal text-tok-cream',
  black: 'bg-tok-black text-tok-cream',
  pale:  'bg-tok-teal-pale text-tok-teal',
  muted: 'bg-tok-black/10 text-tok-muted',
};

function FeedAvatar({ initials, style }: { initials: string; style: AvatarStyle }) {
  return (
    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-syne text-[11px] font-extrabold tracking-[0.5px] flex-shrink-0 ${feedAvatarCls[style]}`}>
      {initials}
    </div>
  );
}

const crewAvatarCls: Record<CrewAvStyle, string> = {
  a: 'bg-tok-teal/[0.15] text-tok-teal',
  b: 'bg-tok-teal-pale text-[#1a5e50]',
  c: 'bg-tok-black/[0.08] text-tok-muted',
};

function CrewAvatar({ initials, style, sm }: { initials: string; style: CrewAvStyle; sm?: boolean }) {
  return (
    <div className={`${sm ? 'w-8 h-8 text-[10px]' : 'w-[30px] h-[30px] text-[9px]'} rounded-full flex items-center justify-center font-syne font-extrabold flex-shrink-0 ${crewAvatarCls[style]}`}>
      {initials}
    </div>
  );
}

function RichText({ parts }: { parts: TextPart[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.bold ? (
          <strong key={i} className="font-semibold">{p.text}</strong>
        ) : p.em ? (
          <em key={i} className="not-italic text-tok-muted text-[13px]">{p.text}</em>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <aside className="bg-tok-black flex flex-col h-full overflow-y-auto border-r border-white/[0.06] max-sm:hidden">
      <div className="px-6 pt-7 pb-[22px] border-b border-white/[0.06] flex-shrink-0">
        <span className="font-bebas text-[28px] tracking-[6px] text-tok-cream leading-none block">TAPOK</span>
        <div className="text-[11px] font-light text-tok-cream/[0.28] mt-1 tracking-[0.02em]">
          The Chief drops. The Crew shows up.
        </div>
      </div>

      <nav className="py-4 flex-1">
        <div className="font-syne text-[9px] font-bold tracking-[2px] uppercase text-tok-cream/20 px-6 pt-4 pb-1.5">
          Main
        </div>

        <a href="/" className="group flex items-center gap-3 px-6 py-[11px] cursor-pointer relative transition-all duration-[140ms] border-l-[3px] border-transparent hover:bg-white/[0.04]">
          <span className="text-tok-cream/30 group-hover:text-tok-cream/60 flex-shrink-0 transition-colors duration-[140ms]">
            <HomeIcon />
          </span>
          <span className="font-syne text-[13px] font-semibold text-tok-cream/35 group-hover:text-tok-cream/70 flex-1 transition-colors duration-[140ms]">
            Home
          </span>
        </a>

        <a href="/activity" className="flex items-center gap-3 px-6 py-[11px] cursor-pointer relative border-l-[3px] border-tok-cream bg-tok-teal after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[3px] after:bg-tok-cream">
          <span className="text-tok-cream flex-shrink-0"><ActivityIcon /></span>
          <span className="font-syne text-[13px] font-semibold text-tok-cream flex-1">Activity</span>
          <span className="font-syne text-[10px] font-bold tracking-[0.5px] bg-tok-cream/20 text-tok-cream px-2 py-0.5 rounded-full">8</span>
        </a>

        <a href="/drops" className="group flex items-center gap-3 px-6 py-[11px] cursor-pointer relative transition-all duration-[140ms] border-l-[3px] border-transparent hover:bg-white/[0.04]">
          <span className="text-tok-cream/30 group-hover:text-tok-cream/60 flex-shrink-0 transition-colors duration-[140ms]">
            <DropsIcon />
          </span>
          <span className="font-syne text-[13px] font-semibold text-tok-cream/35 group-hover:text-tok-cream/70 flex-1 transition-colors duration-[140ms]">
            My Drops
          </span>
          <span className="font-syne text-[10px] font-bold tracking-[0.5px] bg-tok-cream/10 text-tok-cream/40 px-2 py-0.5 rounded-full">3</span>
        </a>

        <div className="h-px bg-white/[0.05] mx-6 my-1.5" />

        <div className="font-syne text-[9px] font-bold tracking-[2px] uppercase text-tok-cream/20 px-6 pt-4 pb-1.5">
          Account
        </div>

        <a href="/profile" className="group flex items-center gap-3 px-6 py-[11px] cursor-pointer relative transition-all duration-[140ms] border-l-[3px] border-transparent hover:bg-white/[0.04]">
          <span className="text-tok-cream/30 group-hover:text-tok-cream/60 flex-shrink-0 transition-colors duration-[140ms]">
            <ProfileIcon />
          </span>
          <span className="font-syne text-[13px] font-semibold text-tok-cream/35 group-hover:text-tok-cream/70 flex-1 transition-colors duration-[140ms]">
            Profile
          </span>
        </a>

        <a href="/settings" className="group flex items-center gap-3 px-6 py-[11px] cursor-pointer relative transition-all duration-[140ms] border-l-[3px] border-transparent hover:bg-white/[0.04]">
          <span className="text-tok-cream/30 group-hover:text-tok-cream/60 flex-shrink-0 transition-colors duration-[140ms]">
            <SettingsIcon />
          </span>
          <span className="font-syne text-[13px] font-semibold text-tok-cream/35 group-hover:text-tok-cream/70 flex-1 transition-colors duration-[140ms]">
            Settings
          </span>
        </a>
      </nav>

      <div className="px-5 pt-4 pb-7 border-t border-white/[0.06] flex-shrink-0">
        <button className="flex items-center justify-center gap-2.5 w-full h-[46px] bg-tok-cream text-tok-black border-none rounded-[4px] font-bebas text-[18px] tracking-[4px] cursor-pointer transition-colors duration-[160ms] hover:bg-tok-cream-dim active:scale-[0.97]">
          <div className="w-5 h-5 rounded-full border-2 border-tok-black flex items-center justify-center text-[15px] font-light leading-none font-dm-sans">
            +
          </div>
          DROP IT
        </button>
      </div>
    </aside>
  );
}

// ── Feed ──────────────────────────────────────────────────────────────────────

function Feed() {
  return (
    <main className="bg-tok-cream flex flex-col h-full overflow-hidden border-r-[1.5px] border-tok-black/[0.13]">
      <div className="h-[62px] flex items-center justify-between px-10 flex-shrink-0 border-b-[1.5px] border-tok-black/10 max-sm:px-5">
        <div className="flex items-baseline gap-2.5">
          <div className="font-bebas text-[30px] tracking-[3px] text-tok-black leading-none">ACTIVITY</div>
          <span className="text-[12px] font-light text-tok-muted">8 events across your Drops today</span>
        </div>
        <div className="flex items-center gap-1.5 font-syne text-[10px] font-bold tracking-[1.5px] uppercase text-tok-teal">
          <div className="w-1.5 h-1.5 rounded-full bg-tok-teal animate-livepulse" />
          Live
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-10 pb-[60px] tapok-feed-scroll max-sm:px-5">
        {feedGroups.map((group) => (
          <div key={group.label} className="pt-7">
            <div className="font-syne text-[9px] font-bold tracking-[2.5px] uppercase text-tok-muted pb-3 border-b-[1.5px] border-tok-black/10">
              {group.label}
            </div>

            {group.items.map((item, idx) => (
              <div
                key={idx}
                className="grid items-center gap-4 py-4 border-b border-tok-black/[0.07] last:border-b-0 cursor-pointer transition-all duration-[180ms] ease-in-out hover:pl-[5px]"
                style={{ gridTemplateColumns: '44px 1fr auto' }}
              >
                <FeedAvatar initials={item.initials} style={item.avatar} />

                <div className="min-w-0">
                  <div className="text-sm font-normal text-tok-black leading-[1.4]">
                    <RichText parts={item.textParts} />
                  </div>
                  <div className="flex items-center mt-[5px]">
                    <span className="font-syne text-[10px] font-bold tracking-[0.8px] uppercase text-tok-teal bg-tok-teal/10 px-[9px] py-[3px] rounded-[2px]">
                      {item.drop}
                    </span>
                    <span className="text-[11px] font-light text-tok-muted-lt ml-2.5 flex items-center gap-2">
                      <span className="opacity-40">·</span>
                      {item.time}
                    </span>
                  </div>
                </div>

                {item.badge === 'in' ? (
                  <div className="font-bebas text-[15px] tracking-[2px] px-[14px] py-[5px] rounded-[3px] flex-shrink-0 leading-[1.2] bg-tok-teal text-tok-cream">
                    In
                  </div>
                ) : item.badge === 'out' ? (
                  <div className="font-bebas text-[15px] tracking-[2px] px-[14px] py-[5px] rounded-[3px] flex-shrink-0 leading-[1.2] bg-tok-black text-tok-cream">
                    Out
                  </div>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}

// ── Right Panel ───────────────────────────────────────────────────────────────

function Panel() {
  return (
    <aside className="bg-tok-white flex flex-col h-full overflow-y-auto tapok-panel max-[860px]:hidden">

      {/* Active Drops */}
      <div className="border-b border-tok-black/[0.07] flex-shrink-0">
        <div className="flex items-center justify-between px-[22px] pt-5 pb-3">
          <div className="font-syne text-[9px] font-bold tracking-[2.5px] uppercase text-tok-black/30">
            Active Drops
          </div>
          <button className="text-[11px] font-medium text-tok-teal bg-transparent border-none cursor-pointer p-0 hover:underline">
            See all
          </button>
        </div>

        {activeDrops.map((drop) => (
          <div
            key={drop.name}
            className="flex items-start gap-3 px-[22px] py-3 border-t border-tok-black/[0.07] cursor-pointer transition-colors hover:bg-tok-teal/[0.04]"
          >
            <div
              className={`w-[7px] h-[7px] rounded-full flex-shrink-0 mt-[5px] ${
                drop.pip === 'active' ? 'bg-tok-teal' : 'bg-[#c47b10] animate-livepulse-fast'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-tok-black truncate mb-[3px]">
                {drop.name}
              </div>
              <div className="text-[11px] font-light text-tok-muted flex flex-col gap-[2px]">
                <div className="flex items-center gap-[5px]">
                  <ClockIcon />
                  {drop.date}
                </div>
                <div className="flex items-center gap-[5px]">
                  <PinIcon />
                  {drop.location}
                </div>
                <div className="flex items-center gap-[5px] mt-1">
                  <span className="text-tok-teal font-semibold">{drop.inCount} In</span>
                  {drop.outCount && (
                    <>
                      <span className="opacity-30">·</span>
                      <span className="text-tok-black font-semibold">{drop.outCount} Out</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div
              className={`font-syne text-[8px] font-bold tracking-[1px] uppercase px-[7px] py-[2px] rounded-[2px] flex-shrink-0 mt-1 ${
                drop.pip === 'active'
                  ? 'bg-tok-teal/10 text-tok-teal'
                  : 'text-[#c47b10]'
              }`}
              style={drop.pip === 'ongoing' ? { background: 'rgba(196,123,16,0.1)' } : undefined}
            >
              {drop.lifecycle}
            </div>
          </div>
        ))}
      </div>

      {/* Crew Roster */}
      <div className="border-b border-tok-black/[0.07] flex-shrink-0">
        <div className="flex items-center justify-between px-[22px] pt-5 pb-3">
          <div className="font-syne text-[9px] font-bold tracking-[2.5px] uppercase text-tok-black/30">
            Crew — Ramen Run
          </div>
          <button className="text-[11px] font-medium text-tok-teal bg-transparent border-none cursor-pointer p-0 hover:underline">
            Manage
          </button>
        </div>

        <div className="flex gap-2 px-[22px] pb-3 flex-wrap">
          <span className="font-syne text-[9px] font-bold tracking-[1px] bg-tok-teal/10 text-tok-teal px-[10px] py-[3px] rounded-[2px]">4 IN</span>
          <span className="font-syne text-[9px] font-bold tracking-[1px] text-tok-muted px-[10px] py-[3px] rounded-[2px]" style={{ background: 'rgba(13,13,13,0.07)' }}>1 OUT</span>
          <span className="font-syne text-[9px] font-bold tracking-[1px] text-[#a06010] px-[10px] py-[3px] rounded-[2px]" style={{ background: 'rgba(196,123,16,0.1)' }}>1 PENDING</span>
        </div>

        {crewRoster.map((member) => (
          <div
            key={member.name}
            className="flex items-center gap-[11px] px-[22px] py-[11px] border-t border-tok-black/[0.07] cursor-pointer transition-colors hover:bg-tok-teal/[0.04]"
          >
            <CrewAvatar initials={member.initials} style={member.av} />
            <div className="flex-1 text-[13px] font-normal text-tok-black">{member.name}</div>
            {member.status === 'in' && (
              <span className="font-syne text-[9px] font-bold tracking-[1px] uppercase px-[10px] py-1 rounded-[2px] bg-tok-teal/10 text-tok-teal">In</span>
            )}
            {member.status === 'out' && (
              <span className="font-syne text-[9px] font-bold tracking-[1px] uppercase px-[10px] py-1 rounded-[2px] text-tok-muted" style={{ background: 'rgba(13,13,13,0.07)' }}>Out</span>
            )}
            {member.status === 'pending' && (
              <span className="font-syne text-[9px] font-bold tracking-[1px] uppercase px-[10px] py-1 rounded-[2px] text-[#a06010] flex items-center gap-1" style={{ background: 'rgba(196,123,16,0.1)' }}>
                <span className="w-[5px] h-[5px] rounded-full bg-[#c47b10] animate-livepulse-fast flex-shrink-0" />
                Pending
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Frequently Seen */}
      <div className="flex-shrink-0">
        <div className="px-[22px] pt-5 pb-3">
          <div className="font-syne text-[9px] font-bold tracking-[2.5px] uppercase text-tok-black/30">
            Frequently Seen
          </div>
        </div>

        {frequentlySeen.map((person) => (
          <div
            key={person.name}
            className="flex items-center gap-[11px] px-[22px] py-3 border-t border-tok-black/[0.07] cursor-pointer transition-colors hover:bg-tok-teal/[0.04]"
          >
            <CrewAvatar initials={person.initials} style={person.av} sm />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-tok-black">{person.name}</div>
              <div className="text-[11px] font-light text-tok-muted-lt mt-[1px]">{person.sub}</div>
            </div>
            <div className="font-bebas text-[22px] tracking-[1px] text-tok-teal leading-none min-w-[28px] text-right">
              {person.count}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ── Mobile Nav ────────────────────────────────────────────────────────────────

function MobileNav() {
  return (
    <nav className="hidden max-sm:flex fixed bottom-0 left-0 right-0 h-[58px] bg-tok-black border-t border-white/[0.08] z-50 items-stretch">
      <a href="/" className="flex-1 flex flex-col items-center justify-center gap-[3px] cursor-pointer text-tok-cream/30 font-syne text-[8px] font-bold tracking-[0.8px] uppercase transition-colors">
        <svg className="w-[18px] h-[18px]" viewBox="0 0 18 18" fill="none">
          <path d="M2 7.5L9 2l7 5.5V16a.6.6 0 01-.6.6H12v-4.5H6V16.6H2.6A.6.6 0 012 16V7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
        Home
      </a>
      <a href="/activity" className="flex-1 flex flex-col items-center justify-center gap-[3px] cursor-pointer text-tok-cream font-syne text-[8px] font-bold tracking-[0.8px] uppercase">
        <svg className="w-[18px] h-[18px]" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 5.5V9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Activity
      </a>
      <div className="flex-1 flex items-center justify-center">
        <button className="w-[46px] h-[46px] rounded-full bg-tok-teal border-[3px] border-tok-black text-tok-cream flex items-center justify-center text-2xl font-light cursor-pointer -mb-3">
          +
        </button>
      </div>
      <a href="/drops" className="flex-1 flex flex-col items-center justify-center gap-[3px] cursor-pointer text-tok-cream/30 font-syne text-[8px] font-bold tracking-[0.8px] uppercase transition-colors">
        <svg className="w-[18px] h-[18px]" viewBox="0 0 18 18" fill="none">
          <path d="M3 5h12M3 9h8M3 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Drops
      </a>
      <a href="/profile" className="flex-1 flex flex-col items-center justify-center gap-[3px] cursor-pointer text-tok-cream/30 font-syne text-[8px] font-bold tracking-[0.8px] uppercase transition-colors">
        <svg className="w-[18px] h-[18px]" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2.5 17c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Profile
      </a>
    </nav>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  return (
    <div className="font-dm-sans">
      <style>{`
        .tapok-shell { grid-template-columns: 252px 1fr 300px; }
        @media (max-width: 1080px) { .tapok-shell { grid-template-columns: 230px 1fr 270px; } }
        @media (max-width: 860px)  { .tapok-shell { grid-template-columns: 220px 1fr; } }
        @media (max-width: 640px)  { .tapok-shell { grid-template-columns: 1fr; } }
        .tapok-feed-scroll::-webkit-scrollbar { width: 3px; }
        .tapok-feed-scroll::-webkit-scrollbar-thumb { background: rgba(42,125,107,0.22); border-radius: 2px; }
        .tapok-panel::-webkit-scrollbar { width: 3px; }
        .tapok-panel::-webkit-scrollbar-thumb { background: rgba(13,13,13,0.1); border-radius: 2px; }
      `}</style>
      <div className="fixed inset-0 grid overflow-hidden tapok-shell">
        <Sidebar />
        <Feed />
        <Panel />
      </div>
      <MobileNav />
    </div>
  );
}
