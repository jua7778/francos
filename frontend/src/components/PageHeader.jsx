import { Link } from 'react-router'

export default function PageHeader({ title, subtitle, back, backLabel = 'VOLVER', actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      {back && (
        <Link
          to={back}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-4 font-bold text-slate-800 ring-2 ring-slate-300 hover:bg-slate-50"
        >
          <span aria-hidden>←</span> {backLabel}
        </Link>
      )}
      <div className="min-w-0 flex-1 basis-48">
        <h1 className="text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-lg text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
