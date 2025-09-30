import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Users, Settings, Shield, BarChart3, CheckCircle, XCircle, Loader2, Eye } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { admin, type AdminProviderProfile, type AdminUserSummary } from '@/lib/api';
import { toast } from 'sonner';
const STATUS_LABELS: Record<'pending' | 'approved' | 'rejected', string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};
const STATUS_BADGES: Record<'pending' | 'approved' | 'rejected', 'secondary' | 'default' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};
type FilterValue = 'all' | 'pending' | 'approved' | 'rejected';
type TabValue = 'approvals' | 'overview' | 'users';
export default function AdminPanel() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<AdminProviderProfile[]>([]);
  const [statusFilter, setStatusFilter] = useState<FilterValue>('pending');
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<AdminProviderProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('approvals');
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: '', phone: '', password: '', password2: '' });
  const filterParams = useMemo(() => (statusFilter === 'all' ? undefined : { status: statusFilter }), [statusFilter]);
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      return;
    }
    setLoadingProfiles(true);
    admin
      .getProviderProfiles(filterParams)
      .then((response) => setProfiles(response.data))
      .catch((error) => {
        console.error('Failed to load provider approvals:', error);
        toast.error('Unable to load provider approval queue.');
      })
      .finally(() => setLoadingProfiles(false));
  }, [user, filterParams]);

  useEffect(() => {
    if (!user || user.role !== 'admin' || activeTab !== 'users') {
      return;
    }

    setLoadingUsers(true);
    admin
      .listUsers()
      .then((response) => setUsers(response.data))
      .catch((error) => {
        console.error('Failed to load users:', error);
        toast.error('Unable to load user directory.');
      })
      .finally(() => setLoadingUsers(false));
  }, [user, activeTab]);

  const handleStatusUpdate = async (profileId: number, status: 'pending' | 'approved' | 'rejected') => {
    try {
      const response = await admin.updateProviderStatus({ profile_id: profileId, status });
      setProfiles((prev) =>
        prev.map((profile) => (profile.id === response.data.id ? response.data : profile))
      );
      toast.success(`Status updated to ${STATUS_LABELS[status]}.`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update provider status');
    }
  };

  const handleAdminInputChange = (field: keyof typeof newAdmin) => (event: ChangeEvent<HTMLInputElement>) => {
    setNewAdmin((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCreateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newAdmin.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (newAdmin.password !== newAdmin.password2) {
      toast.error('Passwords must match.');
      return;
    }

    setCreatingAdmin(true);

    try {
      await admin.createAdminUser(newAdmin);
      toast.success('Admin user created.');
      setNewAdmin({ username: '', phone: '', password: '', password2: '' });
      const refreshed = await admin.listUsers();
      setUsers(refreshed.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create admin user');
    } finally {
      setCreatingAdmin(false);
    }
  };
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const renderUserManagement = () => {
    const adminUsers = users.filter((u) => u.role === 'admin');

    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Create Admin User</CardTitle>
            <CardDescription>Grant access to a trusted teammate.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateAdmin}>
              <div className="space-y-2">
                <Label htmlFor="admin-username">Username</Label>
                <Input
                  id="admin-username"
                  value={newAdmin.username}
                  onChange={handleAdminInputChange('username')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-phone">Phone</Label>
                <Input
                  id="admin-phone"
                  type="tel"
                  value={newAdmin.phone}
                  onChange={handleAdminInputChange('phone')}
                  placeholder="+15555551234"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={newAdmin.password}
                  onChange={handleAdminInputChange('password')}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password2">Confirm Password</Label>
                <Input
                  id="admin-password2"
                  type="password"
                  value={newAdmin.password2}
                  onChange={handleAdminInputChange('password2')}
                  required
                  minLength={8}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Make sure the password is unique and share it securely.
              </p>
              <Button type="submit" className="w-full" disabled={creatingAdmin}>
                {creatingAdmin ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Admin'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Existing Admins</CardTitle>
              <CardDescription>Review who currently manages the platform.</CardDescription>
            </div>
            <Badge variant="secondary">{adminUsers.length} total</Badge>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading users.
              </div>
            ) : adminUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No admin accounts yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((adminUser) => (
                    <TableRow key={adminUser.id}>
                      <TableCell>
                        <div className="font-medium">{adminUser.username}</div>
                        <div className="text-xs text-muted-foreground">{adminUser.role}</div>
                      </TableCell>
                      <TableCell className="text-sm">{adminUser.phone}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(adminUser.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };
  const renderOverviewCards = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">


      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage all users, providers, and recipients
          </p>
          <div className="space-y-2">
            <Button className="w-full" variant="outline" onClick={() => setActiveTab('users')} type="button">
              View All Users
            </Button>
            <Button className="w-full" variant="outline" onClick={() => setActiveTab('approvals')} type="button">
              Pending Registrations
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Provider Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Review and approve provider registrations
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending: {profiles.filter((p) => p.status === 'pending').length}</span>
              <Badge variant="secondary">Live</Badge>
            </div>
            <Button className="w-full">
              Review Applications
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Configure platform settings and parameters
          </p>
          <div className="space-y-2">
            <Button className="w-full" variant="outline">
              Platform Settings
            </Button>
            <Button className="w-full" variant="outline">
              Search Parameters
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            View platform usage and performance metrics
          </p>
          <div className="space-y-2">
            <Button className="w-full" variant="outline">
              Usage Statistics
            </Button>
            <Button className="w-full" variant="outline">
              Revenue Reports
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Content Moderation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Monitor and moderate user content and reviews
          </p>
          <div className="space-y-2">
            <Button className="w-full" variant="outline">
              Flagged Reviews
            </Button>
            <Button className="w-full" variant="outline">
              User Reports
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Service Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage service categories and types
          </p>
          <div className="space-y-2">
            <Button className="w-full" variant="outline">
              Mechanics Services
            </Button>
            <Button className="w-full" variant="outline">
              Accessories Shops
            </Button>
            <Button className="w-full" variant="outline">
              Car Carriers
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  const renderApprovalTable = () => (
    <Card className="shadow-soft">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Provider Approval Queue</CardTitle>
            <CardDescription>Approve or reject provider profiles before they appear on the marketplace.</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={(value: FilterValue) => setStatusFilter(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loadingProfiles ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading provider profiles…
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No providers found for the selected filter.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="font-medium">{profile.display_name}</div>
                    <div className="text-xs text-muted-foreground">Owner: {profile.username}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{profile.phone_public}</div>
                    <div className="text-xs text-muted-foreground">Login: {profile.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {profile.types.length ? (
                        profile.types.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type.replaceAll('_', ' ')}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No services selected</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGES[profile.status]}>{STATUS_LABELS[profile.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(profile.updated_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedProfile(profile)}
                      >
                        <Eye className="mr-1 h-4 w-4" /> Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={profile.status === 'approved'}
                        onClick={() => handleStatusUpdate(profile.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={profile.status === 'pending'}
                        onClick={() => handleStatusUpdate(profile.id, 'pending')}
                      >
                        Pending
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={profile.status === 'rejected'}
                        onClick={() => handleStatusUpdate(profile.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="mb-2">
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">Manage all aspects of the Road Rescue platform</p>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          className="space-y-6"
        >
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="approvals">Profile approvals</TabsTrigger>
            <TabsTrigger value="overview">Operations overview</TabsTrigger>
            <TabsTrigger value="users">User management</TabsTrigger>
          </TabsList>
          <TabsContent value="approvals" className="space-y-6">
            {renderApprovalTable()}
          </TabsContent>
          <TabsContent value="overview" className="space-y-6">
            {renderOverviewCards()}
          </TabsContent>
          <TabsContent value="users" className="space-y-6">
            {renderUserManagement()}
          </TabsContent>
        </Tabs>
        <Dialog open={!!selectedProfile} onOpenChange={(open) => {
          if (!open) {
            setSelectedProfile(null);
          }
        }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedProfile?.display_name ?? 'Provider details'}</DialogTitle>
              <DialogDescription>
                {selectedProfile ? `Owned by ${selectedProfile.username}` : 'Review provider submission details.'}
              </DialogDescription>
            </DialogHeader>
            {selectedProfile && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={STATUS_BADGES[selectedProfile.status]}>{STATUS_LABELS[selectedProfile.status]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(selectedProfile.updated_at).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(selectedProfile.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Business overview</h3>
                  <p className="text-sm leading-relaxed">
                    {selectedProfile.about?.trim() || 'No description provided.'}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1 text-sm">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground">Contact</h3>
                    <div>Public phone: <span className="font-medium text-foreground">{selectedProfile.phone_public}</span></div>
                    <div>Login phone: <span className="font-medium text-foreground">{selectedProfile.phone}</span></div>
                    <div>Owner username: <span className="font-medium text-foreground">{selectedProfile.username}</span></div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground">Location</h3>
                    <div>{selectedProfile.address_text || 'No address provided.'}</div>
                    {selectedProfile.lat !== null && selectedProfile.lng !== null ? (
                      <div className="text-xs text-muted-foreground">
                        Coordinates: {selectedProfile.lat.toFixed(5)}, {selectedProfile.lng.toFixed(5)}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Services</h3>
                  {selectedProfile.types.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.types.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type.replaceAll('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No services listed.</p>
                  )}
                </div>
                {selectedProfile.images.length ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground">Gallery</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {selectedProfile.images.map((url) => (
                        <div key={url} className="overflow-hidden rounded-md border">
                          <img
                            src={url}
                            alt={`${selectedProfile.display_name} image`}
                            className="h-24 w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
