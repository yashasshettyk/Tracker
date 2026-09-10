/* UI icons — Phosphor. Named imports so Rollup tree-shakes the rest away. */
import {
  House, SquaresFour, GraduationCap, HandCoins, Handshake, Coins, Wallet as WalletIcon,
  BookOpen as BookOpenIcon, ChartBar, ChartLineUp, Plus, MagnifyingGlass, Check,
  CaretDown, CaretRight, X, Eye, EyeSlash, LockKey, UserCircle, GearSix,
  Trash, PencilSimple, CalendarBlank, SignOut, DownloadSimple, UploadSimple,
  TrendUp, TrendDown, Clock, FunnelSimple, Sparkle, ArrowDown, Lightning,
} from '@phosphor-icons/react'

const MAP = {
  home: House,
  grid: SquaresFour,
  edu: BookOpenIcon,
  cap: GraduationCap,
  casual: WalletIcon,
  coins: Coins,
  handshake: Handshake,
  handCoins: HandCoins,
  chart: ChartBar,
  chartLine: ChartLineUp,
  plus: Plus,
  search: MagnifyingGlass,
  check: Check,
  chevron: CaretDown,
  right: CaretRight,
  x: X,
  eye: Eye,
  eyeOff: EyeSlash,
  lock: LockKey,
  user: UserCircle,
  gear: GearSix,
  trash: Trash,
  edit: PencilSimple,
  calendar: CalendarBlank,
  logout: SignOut,
  download: DownloadSimple,
  upload: UploadSimple,
  wallet: WalletIcon,
  trendUp: TrendUp,
  trendDown: TrendDown,
  clock: Clock,
  filter: FunnelSimple,
  sparkle: Sparkle,
  arrowDown: ArrowDown,
  bolt: Lightning,
}

export default function Icon({ name, size = 20, weight = 'regular', className = '', style }) {
  const C = MAP[name] || Sparkle
  return <C size={size} weight={weight} className={className} style={style} aria-hidden="true" />
}
