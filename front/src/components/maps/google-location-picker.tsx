import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Search, Settings } from "lucide-react";
import { toast } from 'sonner';

declare global {
  interface Window {
    google: typeof google;
  }
}

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  currentLocation?: { lat: number; lng: number; address: string } | null;
}

const DEFAULT_LOCATION = { lat: 40.7128, lng: -74.0060 };

export function GoogleLocationPicker({ onLocationSelect, currentLocation }: LocationPickerProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('google-maps-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      void loadGoogleMaps(savedApiKey);
    } else {
      setShowApiInput(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || mapInstance.current || !window.google) {
      return;
    }
    initializeMap();
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !currentLocation || !window.google || !mapInstance.current || !markerRef.current) {
      return;
    }

    const position = new google.maps.LatLng(currentLocation.lat, currentLocation.lng);
    markerRef.current.setPosition(position);
    mapInstance.current.setCenter(position);
    setSearchQuery(currentLocation.address);
  }, [currentLocation, isLoaded]);

  const loadGoogleMaps = async (key: string) => {
    try {
      const loader = new Loader({
        apiKey: key,
        version: 'weekly',
        libraries: ['places', 'geometry'],
      });

      await loader.load();
      localStorage.setItem('google-maps-api-key', key);
      setShowApiInput(false);
      mapInstance.current = null;
      markerRef.current = null;
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load Google Maps', error);
      toast.error('Failed to load Google Maps. Please check your API key.');
      setShowApiInput(true);
      localStorage.removeItem('google-maps-api-key');
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) {
      return;
    }

    const startingPoint = currentLocation ?? DEFAULT_LOCATION;

    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: startingPoint,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    markerRef.current = new google.maps.Marker({
      position: startingPoint,
      map: mapInstance.current,
      draggable: true,
      title: 'Selected location',
    });

    markerRef.current.addListener('dragend', async () => {
      if (!markerRef.current) return;
      const position = markerRef.current.getPosition();
      if (!position) return;
      await updateSelection(position.lat(), position.lng());
    });

    mapInstance.current.addListener('click', async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng || !markerRef.current) return;

      markerRef.current.setPosition(event.latLng);
      await updateSelection(event.latLng.lat(), event.latLng.lng());
    });

    if (searchInputRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['geocode'],
        fields: ['geometry', 'formatted_address'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (!place?.geometry?.location || !markerRef.current || !mapInstance.current) return;

        const location = place.geometry.location;
        markerRef.current.setPosition(location);
        mapInstance.current.setCenter(location);
        mapInstance.current.setZoom(15);

        const lat = location.lat();
        const lng = location.lng();
        const address = place.formatted_address ?? formatCoordinates(lat, lng);
        setSearchQuery(address);
        onLocationSelect({ lat, lng, address });
      });
    }

    getCurrentLocation();
  };

  const updateSelection = async (lat: number, lng: number) => {
    try {
      const address = await reverseGeocode(lat, lng);
      setSearchQuery(address);
      onLocationSelect({ lat, lng, address });
    } catch (error) {
      const fallback = formatCoordinates(lat, lng);
      console.warn('Reverse geocode failed', error);
      setSearchQuery(fallback);
      onLocationSelect({ lat, lng, address: fallback });
    }
  };

  const reverseGeocode = (lat: number, lng: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error('Geocoding failed'));
        }
      });
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation || !mapInstance.current || !markerRef.current) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const point = new google.maps.LatLng(latitude, longitude);
        markerRef.current!.setPosition(point);
        mapInstance.current!.setCenter(point);
        mapInstance.current!.setZoom(15);
        await updateSelection(latitude, longitude);
      },
      (error) => {
        console.warn('Geolocation error:', error);
      }
    );
  };

  const handleApiKeySubmit = () => {
    const value = apiKey.trim();
    if (!value) {
      toast.error('Please enter a valid Google Maps API key');
      return;
    }

    void loadGoogleMaps(value);
  };

  if (showApiInput) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Google Maps Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your Google Maps API key to enable location services.
            <a
              href="https://developers.google.com/maps/documentation/javascript/get-api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-1"
            >
              Get API key here
            </a>
          </p>
          <Input
            type="password"
            placeholder="Enter Google Maps API key"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleApiKeySubmit();
              }
            }}
          />
          <Button onClick={handleApiKeySubmit} className="w-full">
            Load Maps
          </Button>
          <p className="text-xs text-muted-foreground">
            Note: For production apps, store API keys securely (for example, via Supabase).
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-2 text-muted-foreground">Loading Google Maps...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Your Location
        </CardTitle>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              ref={searchInputRef}
              placeholder="Search for an address..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={getCurrentLocation}
            title="Use current location"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowApiInput(true)}
            title="Change API key"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="w-full h-80 rounded-lg border" />
        <p className="text-xs text-muted-foreground mt-2">
          Click on the map or drag the marker to select your location
        </p>
        {currentLocation && (
          <p className="text-sm text-muted-foreground mt-2 truncate">
            Selected location: {currentLocation.address}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function formatCoordinates(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
