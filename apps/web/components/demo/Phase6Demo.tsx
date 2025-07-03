"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Wifi, 
  Download, 
  Menu,
  Home,
  Share,
  Settings,
  CheckCircle,
  AlertCircle,
  Zap
} from "lucide-react";

export const Phase6Demo = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    // Check if running as PWA
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    // Detect device type
    const checkDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('resize', checkDeviceType);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (installPrompt) {
      const result = await installPrompt.prompt();
      console.log('PWA install result:', result);
      setInstallPrompt(null);
      setIsInstallable(false);
    }
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getDeviceLabel = () => {
    switch (deviceType) {
      case 'mobile':
        return 'Mobile Device';
      case 'tablet':
        return 'Tablet Device';
      default:
        return 'Desktop Device';
    }
  };

  const responsiveFeatures = [
    {
      feature: "Mobile Sidebar",
      description: "Slide-out navigation with touch gestures",
      status: "active",
      icon: <Menu className="h-4 w-4" />,
    },
    {
      feature: "Touch-Optimized UI",
      description: "Larger tap targets and touch-friendly interactions",
      status: "active",
      icon: <Smartphone className="h-4 w-4" />,
    },
    {
      feature: "Responsive Layout",
      description: "Adapts to screen size with fluid breakpoints",
      status: "active",
      icon: <Monitor className="h-4 w-4" />,
    },
    {
      feature: "Mobile Message Input",
      description: "Optimized keyboard and input experience",
      status: "active",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const pwaFeatures = [
    {
      feature: "Offline Support",
      description: "Works without internet connection",
      status: isStandalone ? "active" : "pending",
      icon: <Wifi className="h-4 w-4" />,
    },
    {
      feature: "App Installation",
      description: "Install as native app on device",
      status: isInstallable || isStandalone ? "active" : "pending",
      icon: <Download className="h-4 w-4" />,
    },
    {
      feature: "Home Screen Icon",
      description: "Add to home screen for quick access",
      status: isStandalone ? "active" : "pending",
      icon: <Home className="h-4 w-4" />,
    },
    {
      feature: "Native Sharing",
      description: "Share content using device's native share",
      status: navigator.share ? "active" : "pending",
      icon: <Share className="h-4 w-4" />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">📱 Phase 6: Mobile & PWA</h1>
        <p className="text-muted-foreground">
          Mobile-responsive design and Progressive Web App features
        </p>
      </div>

      {/* Current Device Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getDeviceIcon()}
            Current Device Status
          </CardTitle>
          <CardDescription>
            Showing how Pythia adapts to your current device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{getDeviceLabel()}</div>
              <div className="text-sm text-muted-foreground">
                {window.innerWidth}px width
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {isStandalone ? 'PWA Mode' : 'Browser Mode'}
              </div>
              <div className="text-sm text-muted-foreground">
                {isStandalone ? 'Running as app' : 'Running in browser'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {isInstallable ? 'Installable' : 'Installed/Not Available'}
              </div>
              <div className="text-sm text-muted-foreground">
                PWA install status
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PWA Installation */}
      {isInstallable && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Install Pythia App
            </CardTitle>
            <CardDescription>
              Install Pythia as a native app for the best experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleInstallPWA} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mobile Responsiveness Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Responsiveness
            </CardTitle>
            <CardDescription>
              Touch-friendly interface that adapts to any screen size
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {responsiveFeatures.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{item.feature}</span>
                      <Badge 
                        variant={item.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {item.status === 'active' ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PWA Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              PWA Features
            </CardTitle>
            <CardDescription>
              Progressive Web App capabilities for native-like experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pwaFeatures.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{item.feature}</span>
                      <Badge 
                        variant={item.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {item.status === 'active' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {item.status === 'active' ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Mobile Testing Guide</CardTitle>
          <CardDescription>
            How to test mobile responsiveness and PWA features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Mobile Responsiveness</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Resize browser window to test breakpoints</li>
                <li>• Use browser dev tools device emulation</li>
                <li>• Test on actual mobile devices</li>
                <li>• Check touch interactions and gestures</li>
                <li>• Verify sidebar slides out on mobile</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">PWA Installation</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Chrome: Look for install icon in address bar</li>
                <li>• Safari: Add to Home Screen from share menu</li>
                <li>• Edge: Install app from browser menu</li>
                <li>• Firefox: Install from page action menu</li>
                <li>• Test offline functionality after install</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Phase 6 Implementation Status</CardTitle>
          <CardDescription>
            All mobile and PWA features are now implemented and ready for testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">✅ Completed Features</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-3 h-3 p-0 bg-green-500" />
                  Mobile-responsive layout with MobileLayout component
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-3 h-3 p-0 bg-green-500" />
                  Touch-friendly sidebar with Sheet component
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-3 h-3 p-0 bg-green-500" />
                  PWA manifest with app installation support
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-3 h-3 p-0 bg-green-500" />
                  Mobile-optimized message input and search
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-3 h-3 p-0 bg-green-500" />
                  Responsive breakpoints and adaptive UI
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">🔄 Technical Implementation</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• CSS Grid and Flexbox responsive layouts</div>
                <div>• Tailwind CSS breakpoint system</div>
                <div>• Touch gesture support with Sheet components</div>
                <div>• PWA manifest with proper meta tags</div>
                <div>• Viewport optimization for mobile devices</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>🏗️ DRY Architecture Benefits</CardTitle>
          <CardDescription>
            Phase 6 maintains clean code principles while adding mobile support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Component Reuse</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• MobileLayout wraps existing components</li>
                <li>• Same UI components work on all devices</li>
                <li>• Responsive design through CSS classes</li>
                <li>• No duplicate mobile-specific components</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Progressive Enhancement</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Desktop-first design enhanced for mobile</li>
                <li>• PWA features added without breaking changes</li>
                <li>• Graceful degradation on older devices</li>
                <li>• Feature detection for optimal experience</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Performance Optimized</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Single codebase for all devices</li>
                <li>• Conditional rendering for mobile features</li>
                <li>• Optimized bundle size and loading</li>
                <li>• Efficient touch and gesture handling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 