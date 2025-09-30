import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Package } from "lucide-react";
import { Link } from "react-router-dom";
import api, { providers } from '@/lib/api';
import { toast } from 'sonner';

type ProfileStatus = 'checking' | 'needsProfile' | 'needsType' | 'ready';

interface Accessory {
  id: number;
  title: string;
  description?: string;
  price_cents: number;
  image_url?: string;
}

export default function AccessoriesManagement() {
  const { user } = useAuth();
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('checking');
  const [profileId, setProfileId] = useState<number | null>(null);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAccessory, setNewAccessory] = useState({
    title: '',
    description: '',
    price_cents: 0,
    image_url: '',
  });

  useEffect(() => {
    if (user?.role === 'provider') {
      void loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setProfileStatus('checking');
    try {
      const response = await providers.getMyProfile();
      const profile = response.data;

      if (!profile) {
        setProfileStatus('needsProfile');
        setAccessories([]);
        return;
      }

      if (!profile.types?.includes('ACCESSORY_SELLER')) {
        setProfileId(profile.id ?? null);
        setProfileStatus('needsType');
        setAccessories([]);
        return;
      }

      setProfileId(profile.id);
      setProfileStatus('ready');
      await loadAccessories(profile.id);
    } catch (error) {
      console.error('Failed to load provider profile:', error);
      toast.error('Unable to load provider profile. Please try again.');
      setProfileStatus('needsProfile');
    }
  };

  const loadAccessories = async (id: number) => {
    setIsFetching(true);
    try {
      const response = await api.get<Accessory[]>(`/accessories/profile/${id}`);
      setAccessories(response.data);
    } catch (error) {
      console.error('Failed to load accessories:', error);
      toast.error('Unable to load accessories. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddAccessory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileId) {
      toast.error('Please complete your provider profile before adding accessories.');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/accessories', {
        profile_id: profileId,
        ...newAccessory,
      });
      toast.success('Accessory added successfully!');
      setNewAccessory({ title: '', description: '', price_cents: 0, image_url: '' });
      setShowAddDialog(false);
      await loadAccessories(profileId);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add accessory');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccessory = async (id: number) => {
    if (!profileId) return;

    try {
      await api.delete(`/accessories/${id}`);
      toast.success('Accessory deleted successfully!');
      await loadAccessories(profileId);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete accessory');
    }
  };

  const handlePriceChange = (value: string) => {
    const amount = Number.parseFloat(value);
    setNewAccessory((previous) => ({
      ...previous,
      price_cents: Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : 0,
    }));
  };

  if (!user || user.role !== 'provider') {
    return <div>Access denied</div>;
  }

  const renderStatusCard = () => {
    if (profileStatus === 'checking') {
      return (
        <Card className="col-span-full text-center py-12">
          <CardContent>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Checking your provider profile...</p>
          </CardContent>
        </Card>
      );
    }

    if (profileStatus === 'needsProfile') {
      return (
        <Card className="col-span-full text-center py-12">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Set up your provider profile</h3>
            <p className="text-muted-foreground mb-4">
              Create your provider profile before listing accessories.
            </p>
            <Button asChild>
              <Link to="/profile-management">Create Provider Profile</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (profileStatus === 'needsType') {
      return (
        <Card className="col-span-full text-center py-12">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Enable accessory sales</h3>
            <p className="text-muted-foreground mb-4">
              Add the "Accessories Seller" service type to your provider profile to manage accessories.
            </p>
            <Button asChild>
              <Link to="/profile-management">Update Service Types</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          {profileStatus === 'ready' && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Accessory
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Accessory</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAccessory} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title (max 25 characters)</Label>
                    <Input
                      id="title"
                      value={newAccessory.title}
                      onChange={(event) => setNewAccessory((prev) => ({ ...prev, title: event.target.value }))}
                      maxLength={25}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newAccessory.description}
                      onChange={(event) => setNewAccessory((prev) => ({ ...prev, description: event.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newAccessory.price_cents ? (newAccessory.price_cents / 100).toFixed(2) : ''}
                      onChange={(event) => handlePriceChange(event.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="image_url">Image URL (optional)</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={newAccessory.image_url}
                      onChange={(event) => setNewAccessory((prev) => ({ ...prev, image_url: event.target.value }))}
                    />
                  </div>

                  <Button type="submit" disabled={isSaving} className="w-full">
                    {isSaving ? 'Adding...' : 'Add Accessory'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {profileStatus !== 'ready' ? (
            renderStatusCard()
          ) : isFetching ? (
            <Card className="col-span-full text-center py-12">
              <CardContent>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading accessories...</p>
              </CardContent>
            </Card>
          ) : accessories.length > 0 ? (
            accessories.map((accessory) => (
              <Card key={accessory.id} className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{accessory.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAccessory(accessory.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {accessory.image_url && (
                    <img
                      src={accessory.image_url}
                      alt={accessory.title}
                      className="w-full h-32 object-cover rounded mb-3"
                    />
                  )}
                  {accessory.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {accessory.description}
                    </p>
                  )}
                  <p className="text-lg font-semibold text-primary">
                    ${(accessory.price_cents / 100).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full text-center py-12">
              <CardContent>
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No accessories yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start adding accessories to showcase your products
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Accessory
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
