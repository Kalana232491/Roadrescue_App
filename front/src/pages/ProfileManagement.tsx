import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, MapPin, Images, Info, Loader2, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { GoogleLocationPicker } from '@/components/maps/google-location-picker';
import { providers, type ProviderProfileDetail } from '@/lib/api';
import { toast } from 'sonner';

const SERVICE_TYPES = [
  {
    value: 'INDUSTRIALIST',
    label: 'Mechanic Workshop',
    description: 'Upload photos of the team/workshop and share specialties.',
  },
  {
    value: 'ACCESSORY_SELLER',
    label: 'Accessories & Spare Parts',
    description: 'Maintain an up-to-date catalogue in the accessories section.',
  },
  {
    value: 'CARRIER',
    label: 'Car Carrier / Tow Service',
    description: 'Showcase rescue vehicles and specify coverage areas.',
  },
] as const;

type ServiceType = (typeof SERVICE_TYPES)[number]['value'];

type StatusKey = 'pending' | 'approved' | 'rejected';

const STATUS_CONFIG: Record<StatusKey, { badge: 'default' | 'secondary' | 'destructive'; title: string; description: string }> = {
  pending: {
    badge: 'secondary',
    title: 'Awaiting Review',
    description:
      'Your profile is under review. An administrator will verify the information soon. You will receive updates via the dashboard.',
  },
  approved: {
    badge: 'default',
    title: 'Approved',
    description:
      'Congratulations! Your profile is visible to service seekers. Keep your business information fresh to stay at the top of search results.',
  },
  rejected: {
    badge: 'destructive',
    title: 'Changes Required',
    description:
      'The previous application was rejected. Review the admin feedback, update the details, and submit again for approval.',
  },
};

interface ProfileState {
  display_name: string;
  about: string;
  phone_public: string;
  lat: number | null;
  lng: number | null;
  address_text: string;
  types: ServiceType[];
  images: string[];
  status: StatusKey;
  updated_at?: string;
}

const EMPTY_PROFILE: ProfileState = {
  display_name: '',
  about: '',
  phone_public: '',
  lat: null,
  lng: null,
  address_text: '',
  types: [],
  images: [],
  status: 'pending',
};

export default function ProfileManagement() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<StatusKey>('pending');
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await providers.getMyProfile();
      if (response.data) {
        applyProfile(response.data);
      } else {
        setProfile(EMPTY_PROFILE);
        setStatus('pending');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Unable to load your provider profile.');
    } finally {
      setLoading(false);
    }
  };

  const applyProfile = (data: ProviderProfileDetail) => {
    setProfile({
      display_name: data.display_name || '',
      about: data.about || '',
      phone_public: data.phone_public || '',
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      address_text: data.address_text || '',
      types: (data.types as ServiceType[]) || [],
      images: data.images || [],
      status: data.status,
      updated_at: data.updated_at,
    });
    setStatus(data.status);
  };

  const statusMeta = useMemo(() => STATUS_CONFIG[status], [status]);

  const handleTypeChange = (type: ServiceType, checked: boolean) => {
    setProfile((prev) => ({
      ...prev,
      types: checked ? [...prev.types, type] : prev.types.filter((t) => t !== type),
    }));
  };

  const handleImageChange = (index: number, value: string) => {
    setProfile((prev) => {
      const nextImages = [...prev.images];
      nextImages[index] = value;
      return { ...prev, images: nextImages };
    });
  };

  const handleAddImage = () => {
    setProfile((prev) => ({
      ...prev,
      images: prev.images.length < 5 ? [...prev.images, ''] : prev.images,
    }));
  };

  const handleRemoveImage = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setProfile((prev) => ({
      ...prev,
      lat: location.lat,
      lng: location.lng,
      address_text: location.address,
    }));
    setShowLocationDialog(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...profile,
        image_urls: profile.images
          .map((url) => url.trim())
          .filter((url, index, arr) => url && arr.indexOf(url) === index),
      };

      const response = await providers.upsertProfile(payload);
      applyProfile(response.data);
      toast.success('Profile saved. We will notify you when the review is complete.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'provider') {
    return <div>Access denied</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          <Button asChild variant="outline" className="mb-6">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Card className="max-w-3xl mx-auto">
            <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading profile…
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          {profile.updated_at && (
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(profile.updated_at).toLocaleString()}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
          <Alert className="shadow-sm">
            <Info className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              <Badge variant={statusMeta.badge}>{status.toUpperCase()}</Badge>
              {statusMeta.title}
            </AlertTitle>
            <AlertDescription>{statusMeta.description}</AlertDescription>
          </Alert>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Tell drivers who you are. These details appear on your public profile once approved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Business / Trading Name</Label>
                  <Input
                    id="display_name"
                    value={profile.display_name}
                    onChange={(event) =>
                      setProfile((prev) => ({ ...prev, display_name: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_public">Public Contact Number</Label>
                  <Input
                    id="phone_public"
                    type="tel"
                    value={profile.phone_public}
                    onChange={(event) =>
                      setProfile((prev) => ({ ...prev, phone_public: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About Your Business</Label>
                <Textarea
                  id="about"
                  value={profile.about}
                  onChange={(event) => setProfile((prev) => ({ ...prev, about: event.target.value }))}
                  rows={4}
                  placeholder="Share your certifications, specialties, and how quickly customers can expect a response."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Location & Service Area
              </CardTitle>
              <CardDescription>
                Accurate coordinates improve search results. Use the map picker or type your address manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address_text">Business Address</Label>
                <Input
                  id="address_text"
                  value={profile.address_text}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, address_text: event.target.value }))
                  }
                  placeholder="E.g., 123 Main Street, Colombo"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Coordinates:</span>
                {profile.lat != null && profile.lng != null ? (
                  <span>
                    {profile.lat.toFixed(5)}, {profile.lng.toFixed(5)}
                  </span>
                ) : (
                  <span>Not set</span>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowLocationDialog(true)}>
                  Open Map Picker
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
              <CardDescription>
                Select all services you can provide. Each option reveals guidance tailored to that service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {SERVICE_TYPES.map((service) => (
                  <div key={service.value} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={service.value}
                            checked={profile.types.includes(service.value)}
                            onCheckedChange={(checked) =>
                              handleTypeChange(service.value, Boolean(checked))
                            }
                          />
                          <Label htmlFor={service.value} className="text-base font-medium">
                            {service.label}
                          </Label>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Images className="h-5 w-5" /> Photo Gallery
              </CardTitle>
              <CardDescription>
                Upload up to five photos that represent your business. Links can point to CDN or public storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.images.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No images yet. Add at least one clear photo of your team, workplace, or service vehicle.
                </p>
              )}

              <div className="space-y-3">
                {profile.images.map((url, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Input
                      value={url}
                      onChange={(event) => handleImageChange(index, event.target.value)}
                      placeholder="https://example.com/photo.jpg"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveImage(index)}
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {profile.images.length < 5 && (
                <Button type="button" variant="outline" onClick={handleAddImage}>
                  <Plus className="mr-2 h-4 w-4" /> Add Image URL
                </Button>
              )}
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end">
            <Button type="submit" className="min-w-[180px]" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Business Location</DialogTitle>
            <DialogDescription>
              Drag the pin or search for an address to update your profile coordinates.
            </DialogDescription>
          </DialogHeader>
          <GoogleLocationPicker
            onLocationSelect={handleLocationSelect}
            currentLocation={
              profile.lat != null && profile.lng != null
                ? { lat: profile.lat, lng: profile.lng, address: profile.address_text }
                : null
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
