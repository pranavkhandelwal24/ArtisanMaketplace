"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paintbrush } from "lucide-react";

// Define a type for the brand kit data for better type safety
type BrandKit = {
  missionStatement: string;
  tagline: string;
  colorPalette: { name: string; hex: string }[];
  fontPairing: {
    headline: { name: string; weight: string };
    body: { name: string; weight: string };
  };
  logoIdeas: string[];
};

interface BrandKitDisplayProps {
  kit: BrandKit;
}

export function BrandKitDisplay({ kit }: BrandKitDisplayProps) {
  return (
    <div className="mt-8 flex flex-col gap-4 rounded-lg border p-4 shadow-sm md:gap-8 md:p-6">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">Your AI-Generated Brand Kit</h2>
        <p className="text-muted-foreground">
          Use these assets to build a consistent and professional brand identity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mission & Tagline */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mission Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="italic">"{kit.missionStatement}"</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tagline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{kit.tagline}</p>
            </CardContent>
          </Card>
        </div>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {kit.colorPalette.map((color) => (
                <div key={color.name} className="flex flex-col items-center gap-2">
                  <div
                    className="h-20 w-20 rounded-lg border shadow-inner"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="text-center">
                    <p className="font-semibold">{color.name}</p>
                    <p className="text-sm text-muted-foreground">{color.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Font Pairing */}
        <Card>
          <CardHeader>
            <CardTitle>Font Pairing (Google Fonts)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Headline</p>
              <p className="text-2xl" style={{ fontFamily: kit.fontPairing.headline.name, fontWeight: kit.fontPairing.headline.weight }}>
                {kit.fontPairing.headline.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Body Text</p>
              <p style={{ fontFamily: kit.fontPairing.body.name, fontWeight: kit.fontPairing.body.weight }}>
                {kit.fontPairing.body.name} - The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logo Ideas */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Paintbrush className="h-5 w-5" /> Logo Ideas
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="list-disc space-y-2 pl-5">
                    {kit.logoIdeas.map((idea, index) => (
                        <li key={index}>{idea}</li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
