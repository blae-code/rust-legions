import React from "react";
import { Monitor, Smartphone, Share, Download, CheckCircle2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import useInstallPrompt from "@/hooks/useInstallPrompt";
import PlatformCard from "@/components/install/PlatformCard";
import { playSfx } from "@/lib/sfx";

const APP_ICON = "https://media.base44.com/images/public/6a58196dcd485ecc774cae1b/9cea89369_generated_image.png";

export default function InstallApp() {
  const { canInstall, installed, install } = useInstallPrompt();

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Requisition header */}
      <div className="cq-panel relative overflow-hidden p-5">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <div className="flex flex-wrap items-center gap-5 pt-1">
          <img
            src={APP_ICON}
            alt="Rust Legions emblem"
            className="w-20 h-20 rounded border border-brass/50 shadow-[0_6px_18px_rgba(0,0,0,0.7)]"
          />
          <div className="min-w-0">
            <p className="cq-label">War Ministry · Equipment Requisition</p>
            <h1 className="cq-display text-3xl sm:text-4xl">The Field Terminal</h1>
            <p className="font-body text-sm text-secondary-foreground mt-1 max-w-xl">
              Install Rust Legions as an app on your device — it opens full-screen from your home screen
              or desktop, with its own window and no browser chrome.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {installed ? (
            <span className="cq-tag border-olive/60 text-brass-bright bg-secondary/40 py-1.5 px-3">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-brass" /> Terminal issued — you are running the installed app
            </span>
          ) : canInstall ? (
            <Button onClick={() => { playSfx("select"); install(); }} className="h-10 px-6">
              <Download className="w-4 h-4" /> Install Now
            </Button>
          ) : (
            <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
              ONE-CLICK INSTALL NOT OFFERED BY THIS BROWSER — FOLLOW THE PROCEDURE FOR YOUR DEVICE BELOW.
            </span>
          )}
        </div>
      </div>

      {/* Platform procedures */}
      <div className="grid md:grid-cols-3 gap-4">
        <PlatformCard
          icon={Monitor}
          platform="Desktop"
          via="Chrome · Edge · Brave"
          steps={[
            "Open rust-legions.base44.app in your browser.",
            "Click the install icon (a monitor with a down arrow) at the right end of the address bar — or use the ⋮ menu → \"Install Rust Legions\".",
            "Confirm. The app opens in its own window and is pinned to your taskbar or dock.",
          ]}
        />
        <PlatformCard
          icon={Smartphone}
          platform="Android"
          via="Chrome"
          steps={[
            "Open rust-legions.base44.app in Chrome.",
            "Tap the ⋮ menu, then \"Add to Home screen\" (or \"Install app\").",
            "Confirm. The Rust Legions emblem lands on your home screen and opens full-screen.",
          ]}
        />
        <PlatformCard
          icon={Share}
          platform="iPhone & iPad"
          via="Safari"
          steps={[
            "Open rust-legions.base44.app in Safari.",
            "Tap the Share button (the square with an up arrow).",
            "Scroll and tap \"Add to Home Screen\", then \"Add\". The emblem appears on your home screen.",
          ]}
        />
      </div>

      {/* Field note */}
      <div className="cq-panel relative overflow-hidden p-4 flex items-start gap-3">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <Wifi className="w-4 h-4 text-brass shrink-0 mt-1.5" />
        <p className="font-body text-xs text-secondary-foreground leading-relaxed pt-1">
          <span className="font-heading uppercase tracking-[0.15em] text-brass-bright">Field note:</span>{" "}
          the terminal still needs a wire to the front — an internet connection is required to play, since
          every war is fought live against other commanders. Installing simply gives you a faster, full-screen
          way into the war room.
        </p>
      </div>
    </div>
  );
}