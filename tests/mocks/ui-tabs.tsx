import React from 'react';
export const Tabs = ({ children }: any) => <div>{children}</div>;
export const TabsList = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const TabsTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>;
export const TabsContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export default { Tabs, TabsList, TabsTrigger, TabsContent };


