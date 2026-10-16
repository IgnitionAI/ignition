import Link from 'next/link'
import Image from 'next/image'
import LogoImg from '@/public/images/ignition-flame.gif'

export default function Logo() {
  return (
    <Link className="inline-flex items-center gap-2" href="/" aria-label="IgnitionAI">
      <Image
        className="max-w-none"
        src={LogoImg}
        width={44}
        height={44}
        priority
        unoptimized
        alt="IgnitionAI"
      />
      <span className="font-semibold text-slate-100 tracking-tight">IgnitionAI</span>
    </Link>
  )
}
