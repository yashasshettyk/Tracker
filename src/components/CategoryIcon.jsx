/* ------------------------------------------------------------------
   Category glyphs — Phosphor duotone. A real icon family renders the
   same on One UI, iOS and desktop; emoji do not.
   ------------------------------------------------------------------ */
import {
  Bank, BookOpen, Exam, House, Bus, Laptop, MonitorPlay, Chalkboard, Flask,
  TShirt, ForkKnife, WifiHigh, Backpack, Money, Siren, ShoppingBag, Coffee,
  GasPump, DeviceMobile, FirstAidKit, Receipt, Gift, UsersThree, Sparkle,
  Car, AirplaneTilt, Barbell, GameController, MusicNotes, Camera, PawPrint,
  Wrench, Briefcase, Ticket, Globe, CreditCard, Tag, Heart, Star, Lightning,
  ShieldCheck, PiggyBank, Baby, Bed, Broom, Buildings,
  Printer, NotePencil, Certificate, Books, SoccerBall, IdentificationCard,
  MapTrifold, Calculator, CloudArrowDown, PresentationChart, Microscope,
  Ruler, Bandaids, Scissors, Toolbox, Hammer,
} from '@phosphor-icons/react'

export const GLYPHS = {
  institution: Bank, book: BookOpen, exam: Exam, home: House, bus: Bus,
  laptop: Laptop, course: MonitorPlay, teach: Chalkboard, flask: Flask,
  shirt: TShirt, food: ForkKnife, wifi: WifiHigh, backpack: Backpack,
  cash: Money, siren: Siren, bag: ShoppingBag, cup: Coffee, fuel: GasPump,
  phone: DeviceMobile, medical: FirstAidKit, receipt: Receipt, gift: Gift,
  users: UsersThree, sparkle: Sparkle, car: Car, plane: AirplaneTilt,
  gym: Barbell, game: GameController, music: MusicNotes, camera: Camera,
  pet: PawPrint, tools: Wrench, work: Briefcase, ticket: Ticket, globe: Globe,
  card: CreditCard, tag: Tag, heart: Heart, star: Star, bolt: Lightning,
  shield: ShieldCheck, savings: PiggyBank, family: Baby, hostel: Bed,
  chores: Broom, rent: Buildings,
  print: Printer, assignment: NotePencil, certificate: Certificate, library: Books,
  sports: SoccerBall, idcard: IdentificationCard, fieldtrip: MapTrifold,
  calculator: Calculator, software: CloudArrowDown, seminar: PresentationChart,
  lab: Microscope, ruler: Ruler, firstaid: Bandaids, craft: Scissors,
  toolbox: Toolbox, repair: Hammer,
}

/** Curated tones — readable on the near-black ground, distinct from each other. */
export const TONES = {
  lavender: '#9b8cff', periwinkle: '#7d8dff', azure: '#5fa8ff', sky: '#54c7f0',
  aqua: '#43cfc7', mint: '#5ecfa8', sage: '#8ccf82', olive: '#c2cc72',
  champagne: '#e3bd82', amber: '#e0a860', clay: '#dd8f72', rose: '#e08aa8',
  orchid: '#c48ce0', pewter: '#9aa0b0',
}

export const TONE_KEYS = Object.keys(TONES)
export const GLYPH_KEYS = Object.keys(GLYPHS)

export const toneOf = (t) => TONES[t] || TONES.pewter

/** the glyph alone, inheriting currentColor */
export function Glyph({ name, size = 20, weight = 'duotone' }) {
  const C = GLYPHS[name] || Tag
  return <C size={size} weight={weight} aria-hidden="true" />
}

/** tinted rounded-square holding the glyph — the app's category avatar */
export default function CategoryIcon({ category, size = 40, radius }) {
  const tone = toneOf(category?.tone)
  const r = radius ?? Math.round(size * 0.32)
  const C = GLYPHS[category?.icon]
  return (
    <span
      className="cat-avatar"
      style={{
        width: size, height: size, borderRadius: r,
        background: `linear-gradient(155deg, ${tone}2b, ${tone}12)`,
        boxShadow: `inset 0 0 0 1px ${tone}2e`,
        color: tone,
        fontSize: size * 0.46,
      }}
    >
      {C ? <C size={Math.round(size * 0.54)} weight="duotone" aria-hidden="true" />
         : category?.emoji /* categories saved before the icon set existed */}
    </span>
  )
}
