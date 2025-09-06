import React from 'react';
export const Avatar = ({ src, alt, className }: any) => (
  <img src={src} alt={alt} className={className} />
);
export const AvatarImage = Avatar;
export const AvatarFallback = ({ children }: any) => <span>{children}</span>;
export default { Avatar, AvatarImage, AvatarFallback };


