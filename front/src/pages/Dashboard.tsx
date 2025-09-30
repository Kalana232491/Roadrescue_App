import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Settings, LogOut, Plus, Star, MapPin, Wrench, Package, Truck, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { providers, type ProviderProfileDetail } from '@/lib/api';
import { toast } from 'sonner';

const PROVIDER_STATUS_META: Record<'pending' | 'approved' | 'rejected', { label: string; description: string; badge: 'secondary' | 'default' | 'destructive' }> = {
  pending: {
    label: 'Awaiting Review',
    description: 'Your details are under review. Approval typically takes less than 24 hours.',
    badge: 'secondary',
  },
  approved: {
    label: 'Published',
    description: 'You appear in search results. Keep information refreshed for better visibility.',
    badge: 'default',
  },
  rejected: {
    label: 'Changes Needed',
    description: 'An admin requested adjustments. Update your profile and resubmit to continue.',
    badge: 'destructive',
  },
};

const SERVICE_ICONS: Record<string, typeof Wrench> = {
  INDUSTRIALIST: Wrench,
  ACCESSORY_SELLER: Package,
  CARRIER: Truck,
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [providerProfile, setProviderProfile] = useState<ProviderProfileDetail | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'provider') {
      return;
    }

    setLoadingProfile(true);
    providers
      .getMyProfile()
      .then((response) => setProviderProfile(response.data))
      .catch((error) => {
        console.error('Failed to load provider profile:', error);
        toast.error('Unable to load provider information.');
      })
      .finally(() => setLoadingProfile(false));
  }, [user]);

  if (!user) {
    return null;
  }

  const renderProviderDashboard = () => {
    const statusMeta = providerProfile
      ? PROVIDER_STATUS_META[providerProfile.status]
      : PROVIDER_STATUS_META.pending;

    return (
      <div className="space-y-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Account Overview</span>
              <Badge variant={statusMeta.badge}>{statusMeta.label}</Badge>
            </CardTitle>
            <CardDescription>{statusMeta.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Business Name</p>
              <p className="mt-1 text-lg font-semibold">
                {providerProfile?.display_name || 'Not set yet'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Contact Number</p>
              <p className="mt-1 text-lg font-semibold">
                {providerProfile?.phone_public || 'Not set'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {providerProfile?.address_text || 'Add your service address'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Service Toolkit</CardTitle>
              <CardDescription>Manage the sections that power your public profile.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Card className="shadow-none border-dashed">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">Build Your Profile</CardTitle>
                  <CardDescription>Update business information, services, and gallery.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full" variant="outline">
                    <Link to="/profile-management">
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-none border-dashed">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">Accessories Catalogue</CardTitle>
                  <CardDescription>Track spare parts and pricing for quick customer reference.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/accessories-management">
                      <Plus className="mr-2 h-4 w-4" />
                      Manage Accessories
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Tip: Include clear images and current pricing to build trust instantly.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-none border-dashed">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">Customer Feedback</CardTitle>
                  <CardDescription>Keep an eye on reviews and resolve concerns quickly.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/reviews-view">
                      <Star className="mr-2 h-4 w-4" />
                      View Reviews
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-none border-dashed">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">Service Visibility</CardTitle>
                  <CardDescription>Ensure your details help stranded drivers find you fast.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Keep photos up to date
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Respond to new reviews promptly
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Confirm your primary service radius
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Services Listed</CardTitle>
              <CardDescription>Customers will see these categories on your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(providerProfile?.types || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Pick at least one service in your profile to appear in search results.
                </p>
              ) : (
                providerProfile!.types.map((type) => {
                  const Icon = SERVICE_ICONS[type] ?? Settings;
                  return (
                    <div key={type} className="flex items-center gap-3 rounded-lg border p-3">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{type.replaceAll('_', ' ')}</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderRecipientDashboard = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Find Services</CardTitle>
          <CardDescription>Search mechanics, accessories, and carriers nearby.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link to="/search">
              <Plus className="mr-2 h-4 w-4" />
              Start a new search
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Update Profile</CardTitle>
          <CardDescription>Keep your contact details current for faster bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link to="/user-profile">
              <Settings className="mr-2 h-4 w-4" />
              Edit profile
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-white border-b shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-2xl font-bold text-primary">
                Road Rescue
              </Link>
              <Badge variant="secondary">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user.username}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {user.role === 'provider' ? (
          loadingProfile ? (
            <Card className="shadow-soft">
              <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading provider overview…
              </CardContent>
            </Card>
          ) : (
            renderProviderDashboard()
          )
        ) : user.role === 'recipient' ? (
          renderRecipientDashboard()
        ) : (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Administrator Shortcuts</CardTitle>
              <CardDescription>Jump into moderation or analytics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  Open Admin Panel
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Separator />

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Button asChild variant="outline" className="w-full">
              <Link to={user.role === 'provider' ? '/profile-management' : '/user-profile'}>
                <Settings className="mr-2 h-4 w-4" />
                Manage Account
              </Link>
            </Button>
            {user.role === 'recipient' && (
              <Button asChild className="w-full">
                <Link to="/search">
                  <Plus className="mr-2 h-4 w-4" />
                  Find Services
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

