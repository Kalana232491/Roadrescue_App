import { HeroSection } from "@/components/ui/hero-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Shield, Clock, Users, MapPin, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      
      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Road Rescue?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We connect you with verified professionals who provide reliable automotive services
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center shadow-soft">
              <CardHeader>
                <Shield className="h-12 w-12 text-success mx-auto mb-4" />
                <CardTitle className="text-lg">Verified Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">All service providers are thoroughly vetted and verified</p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-soft">
              <CardHeader>
                <Clock className="h-12 w-12 text-accent mx-auto mb-4" />
                <CardTitle className="text-lg">24/7 Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Emergency services available around the clock</p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-soft">
              <CardHeader>
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg">Location-Based</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Find the nearest service providers with accurate location data</p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-soft">
              <CardHeader>
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <CardTitle className="text-lg">Rating System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Transparent reviews and ratings from real customers</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Getting help is just a few clicks away</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-4">Search Services</h3>
                <p className="text-muted-foreground">
                  Select the type of service you need and your location
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-4">Choose Provider</h3>
                <p className="text-muted-foreground">
                  Browse verified providers with ratings and reviews
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-success text-success-foreground rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-4">Get Service</h3>
                <p className="text-muted-foreground">
                  Contact the provider and get professional service
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}