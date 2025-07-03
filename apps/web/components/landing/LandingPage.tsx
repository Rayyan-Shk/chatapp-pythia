"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  MessageSquare, 
  Users, 
  Zap, 
  Shield, 
  Smartphone, 
  Globe,
  ArrowRight,
  Star,
  CheckCircle,
  Sparkles,
  Heart,
  Target,
  Rocket,
  Coffee
} from "lucide-react";

export const LandingPage = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-time Messaging",
      description: "Instant communication with live updates, typing indicators, and message reactions.",
      color: "text-primary"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description: "Organize conversations by channels, manage team members, and boost productivity.",
      color: "text-accent"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Private",
      description: "Enterprise-grade security with end-to-end encryption and data protection.",
      color: "text-success"
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Mobile Ready",
      description: "Progressive Web App with native mobile experience across all devices.",
      color: "text-warning"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Access",
      description: "Access your conversations from anywhere with cloud synchronization.",
      color: "text-destructive"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Modern Interface",
      description: "Beautiful, intuitive design with dark/light themes and customizable experience.",
      color: "text-primary"
    }
  ];

  const testimonials = [
    {
      quote: "Pythia has transformed how our marketing team collaborates. The real-time features are game-changing!",
      author: "Sarah Chen",
      role: "Marketing Director",
      company: "TechFlow Inc."
    },
    {
      quote: "The most intuitive chat platform we've used. Setup was effortless and adoption was instant.",
      author: "Michael Rodriguez",
      role: "Team Lead",
      company: "Creative Studios"
    },
    {
      quote: "Perfect balance of features and simplicity. Our team productivity increased by 40%.",
      author: "Emma Thompson",
      role: "Project Manager",
      company: "Digital Agency"
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "50M+", label: "Messages Sent" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Pythia Conversations
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Rocket className="h-4 w-4 mr-2" />
              Now with PWA Support
            </Badge>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Team Communication
              </span>
              <br />
              <span className="text-foreground">Reimagined</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect, collaborate, and communicate with your team in real-time. 
              Built for modern marketing teams who demand excellence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-4 text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-2 hover:bg-muted/50">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Free 30-day trial</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Setup in 5 minutes</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Target className="h-4 w-4 mr-2" />
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything your team needs to
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> succeed</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to enhance team collaboration and productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${feature.color.split('-')[1]}/20 to-${feature.color.split('-')[1]}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className={feature.color}>
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Heart className="h-4 w-4 mr-2" />
              Testimonials
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Loved by teams
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> worldwide</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 bg-card/50 backdrop-blur-sm shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <blockquote className="text-lg mb-4 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to transform your team communication?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of teams already using Pythia Conversations to collaborate better.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-4 text-lg">
                  <Coffee className="mr-2 h-5 w-5" />
                  Start Your Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-2">
                  Sign In to Your Account
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 30-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 gradient-bg rounded-md flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Pythia Conversations</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>© 2024 Pythia Team</span>
              <span>•</span>
              <span>Built for modern teams</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}; 