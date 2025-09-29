import React from 'react';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      {/* Placeholder for a future sidebar/navigation */}
      {/* <aside className="w-64 bg-sidebar text-sidebar-foreground p-4">
        <nav>
          <ul>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/settings">Settings</Link></li>
          </ul>
        </nav>
      </aside> */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}