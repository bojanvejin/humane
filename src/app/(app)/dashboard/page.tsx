import React from 'react';
import RoleGuard from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrackUploadForm from '@/components/artist/TrackUploadForm'; // Import the new component

export default function DashboardPage() {
  return (
    <RoleGuard allowedRoles={['artist', 'admin']}>
      <div className="min-h-screen p-8 bg-background">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Artist Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground mb-6">
              Welcome to your artist dashboard! Here you can manage your catalog, releases, and earnings.
            </p>
            
            <div className="mb-8">
              <TrackUploadForm /> {/* Render the new upload form */}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Catalog</CardTitle>
                </CardHeader>
                <CardContent>Manage your tracks and albums.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Releases</CardTitle>
                </CardHeader>
                <CardContent>View and schedule upcoming releases.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Earnings</CardTitle>
                </CardHeader>
                <CardContent>See your payout reports and tips.</CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}