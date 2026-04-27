import type { Metadata } from 'next';
import { TapokNavbar } from '@/components/tapok-navbar';
import { ActivePanel } from './_components/active-panel';

export const metadata: Metadata = {
  title: 'TapOk — Activity',
};

type AvatarStyle = 'teal' | 'dark' | 'pale' | 'muted';
type BadgeType = 'in' | 'out';
type TextPart = { text: string; bold?: boolean; em?: boolean };

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
        initials: 'YOU', avatar: 'dark',
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
        initials: 'YOU', avatar: 'dark',
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

const avatarCls: Record<AvatarStyle, string> = {
  teal:  'bg-[#006666] text-[#F7E9B2]',
  dark:  'bg-[#2a2118] text-[#F7E9B2]',
  pale:  'bg-[#006666]/12 text-[#006666]',
  muted: 'bg-[#2a2118]/10 text-[#2a2118]/46',
};

function FeedAvatar({ initials, style }: { initials: string; style: AvatarStyle }) {
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-syne text-[11px] font-extrabold tracking-[0.5px] flex-shrink-0 ${avatarCls[style]}`}>
      {initials}
    </div>
  );
}

function RichText({ parts }: { parts: TextPart[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.bold ? (
          <strong key={i} className="font-semibold text-[#2a2118]">{p.text}</strong>
        ) : p.em ? (
          <em key={i} className="not-italic text-[#2a2118]/50 text-[13px]">{p.text}</em>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

function Feed() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-syne text-[10px] font-bold uppercase tracking-[2.5px] text-[#006666]">
            Activity
          </p>
          <h1 className="mt-2 font-syne text-[clamp(28px,3.8vw,48px)] font-bold uppercase tracking-[-0.03em] text-[#2a2118]">
            What's Happening
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#2a2118]/56">
            8 events across your Drops today.
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-2 rounded-full border border-[#006666]/20 bg-[#006666]/10 px-3 py-1.5 font-syne text-[9px] font-bold uppercase tracking-[2px] text-[#006666]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#006666] animate-pulse" />
          Live
        </div>
      </div>

      <div className="rounded-[28px] border border-[#2a2118]/10 bg-white/70 shadow-[0_10px_28px_rgba(42,33,24,0.06)] overflow-hidden">
        {feedGroups.map((group, gi) => (
          <div key={group.label}>
            <div className={`px-6 py-3 ${gi > 0 ? 'border-t border-[#2a2118]/8' : ''}`}>
              <span className="font-syne text-[9px] font-bold uppercase tracking-[2.5px] text-[#2a2118]/30">
                {group.label}
              </span>
            </div>

            {group.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 px-6 py-4 border-t border-[#2a2118]/[0.06] hover:bg-[#2a2118]/[0.015] transition-colors cursor-pointer"
              >
                <FeedAvatar initials={item.initials} style={item.avatar} />

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-[#2a2118]/72 leading-[1.4]">
                    <RichText parts={item.textParts} />
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-syne text-[9px] font-bold uppercase tracking-[1.5px] text-[#006666] bg-[#006666]/10 border border-[#006666]/15 px-2.5 py-1 rounded-full">
                      {item.drop}
                    </span>
                    <span className="text-[#2a2118]/28 text-[11px]">·</span>
                    <span className="text-[12px] text-[#2a2118]/40">{item.time}</span>
                  </div>
                </div>

                {item.badge === 'in' ? (
                  <span className="inline-flex items-center rounded-full border border-[#006666]/20 bg-[#006666]/10 px-3 py-1.5 font-syne text-[9px] font-bold uppercase tracking-[2px] text-[#006666] flex-shrink-0">
                    In
                  </span>
                ) : item.badge === 'out' ? (
                  <span className="inline-flex items-center rounded-full border border-[#2a2118]/12 bg-[#2a2118]/6 px-3 py-1.5 font-syne text-[9px] font-bold uppercase tracking-[2px] text-[#2a2118]/46 flex-shrink-0">
                    Out
                  </span>
                ) : (
                  <div className="w-10 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-[#F7E9B2] text-[#2a2118] selection:bg-[#006666]/15">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(42,33,24,0.42) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top_left,rgba(0,102,102,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(42,33,24,0.08),transparent_28%)]" />

      <TapokNavbar active="activity" />

      <main className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <Feed />
          <ActivePanel />
        </div>
      </main>
    </div>
  );
}
