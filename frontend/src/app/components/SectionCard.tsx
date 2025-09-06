import React from 'react'

type SectionCardProps = {
  title?: string
  className?: string
  children: React.ReactNode
}

export default function SectionCard({ title, className = '', children }: SectionCardProps) {
  return (
    <section className={`relative rounded-xl p-[1px] bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-400 shadow-[0_0_24px_rgba(168,85,247,0.35)] ${className}`}>
      <div className="rounded-xl bg-gray-900/90 backdrop-blur px-5 py-4">
        {title ? (
          <h2 className="mb-3 text-lg font-semibold tracking-wide text-white">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </section>
  )
}


