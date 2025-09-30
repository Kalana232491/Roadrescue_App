import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wrench, Package, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-mechanics.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-accent/70" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          Road Rescue
          <span className="block text-3xl md:text-4xl font-normal mt-2 text-accent">
            Professional Automotive Services
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
          Connect with certified mechanics, accessory dealers, and tow truck operators in your area
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-4">
            <Link to="/search">Find Services</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary">
            <Link to="/auth">Become a Provider</Link>
          </Button>
        </div>

        {/* Service types */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-sm">
            <Wrench className="h-12 w-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Mechanics</h3>
            <p className="text-white/80">Professional automotive repair and maintenance services</p>
          </Card>
          
          <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-sm">
            <Package className="h-12 w-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Accessories</h3>
            <p className="text-white/80">Quality automotive parts and accessories from trusted dealers</p>
          </Card>
          
          <Card className="p-6 bg-white/10 border-white/20 backdrop-blur-sm">
            <Truck className="h-12 w-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tow Services</h3>
            <p className="text-white/80">24/7 emergency towing and roadside assistance</p>
          </Card>
        </div>
      </div>
    </section>
  );
}