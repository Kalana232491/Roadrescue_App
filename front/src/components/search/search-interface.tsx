import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Star, Phone, Wrench, Package, Truck, Map } from "lucide-react";
import { search, type ProviderSearchResult } from '@/lib/api';
import { GoogleLocationPicker } from '@/components/maps/google-location-picker';
import { toast } from 'sonner';

const SERVICE_TYPES = {
  INDUSTRIALIST: { label: 'Mechanics', icon: Wrench, color: 'bg-blue-500' },
  ACCESSORY_SELLER: { label: 'Accessories', icon: Package, color: 'bg-green-500' },
  CARRIER: { label: 'Tow Services', icon: Truck, color: 'bg-orange-500' },
};

export function SearchInterface() {
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [selectedType, setSelectedType] = useState<string>('INDUSTRIALIST');
  const [radius, setRadius] = useState(25);
  const [locationMethod, setLocationMethod] = useState<'auto' | 'manual'>('auto');

  useEffect(() => {
    if (locationMethod === 'auto' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          });
        },
        () => {
          toast.error('Unable to get your location. Try using manual location selection.');
          setLocationMethod('manual');
        }
      );
    }
  }, [locationMethod]);

  const { data: providers, isLoading, error } = useQuery({
    queryKey: ['search', selectedType, location?.lat, location?.lng, radius],
    queryFn: () => {
      if (!location) return [];
      return search.nearby({
        type: selectedType,
        lat: location.lat,
        lng: location.lng,
        radius_km: radius,
      }).then(res => res.data);
    },
    enabled: !!location,
  });

  if (!location) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Find Services Near You</h1>
          <p className="text-muted-foreground mb-6">Choose how you'd like to set your location</p>
          
          <Tabs value={locationMethod} onValueChange={(value) => setLocationMethod(value as 'auto' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="auto" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Auto Location
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Choose on Map
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="auto" className="mt-6">
              <Card className="max-w-md mx-auto text-center">
                <CardContent className="pt-6">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Getting Your Location</h3>
                  <p className="text-muted-foreground mb-4">
                    Please enable location services to automatically detect your location.
                  </p>
                  <Button 
                    onClick={() => setLocationMethod('manual')}
                    variant="outline"
                  >
                    Choose Location Manually
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="manual" className="mt-6">
              <GoogleLocationPicker
                onLocationSelect={(loc) => setLocation(loc)}
                currentLocation={location}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Find Services Near You</h1>
        
        <div className="bg-muted/30 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <MapPin className="h-4 w-4" />
            <span>Current location:</span>
          </div>
          <p className="font-medium truncate">{location.address}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setLocation(null)}
          >
            Change Location
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SERVICE_TYPES).map(([key, { label, icon: Icon }]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-48">
            <Select value={radius.toString()} onValueChange={(value) => setRadius(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Within 10 km</SelectItem>
                <SelectItem value="25">Within 25 km</SelectItem>
                <SelectItem value="50">Within 50 km</SelectItem>
                <SelectItem value="100">Within 100 km</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Finding service providers...</p>
        </div>
      )}

      {error && (
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <p className="text-destructive">Unable to load service providers. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {providers && providers.length === 0 && !isLoading && (
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No {SERVICE_TYPES[selectedType as keyof typeof SERVICE_TYPES].label.toLowerCase()} found in your area.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers?.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </div>
  );
}

function ProviderCard({ provider }: { provider: ProviderSearchResult }) {
  return (
    <Card className="hover:shadow-medium transition-smooth">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{provider.display_name}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{provider.avg_rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({provider.reviews_count} reviews)
              </span>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {provider.distance_km?.toFixed(1)} km
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {provider.types.map((type) => {
            const TypeIcon = SERVICE_TYPES[type as keyof typeof SERVICE_TYPES].icon;
            return (
              <Badge key={type} variant="outline" className="text-xs">
                <TypeIcon className="h-3 w-3 mr-1" />
                {SERVICE_TYPES[type as keyof typeof SERVICE_TYPES].label}
              </Badge>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent>
        {provider.about && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {provider.about}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{provider.phone_public}</span>
          </div>
          
          <Button size="sm">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
