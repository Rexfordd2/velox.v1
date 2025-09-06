import * as React from 'react'

type AvatarProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  children?: React.ReactNode
  className?: string
}

export function Avatar(props: AvatarProps) {
  const { children, src, alt, className, ...rest } = props
  if (src) {
    return <img src={src} alt={alt} className={className} {...rest} />
  }
  return <div className={className}>{children}</div>
}

export function AvatarImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} />
}

export function AvatarFallback({ children }: { children?: React.ReactNode }) {
  return <div>{children}</div>
}
