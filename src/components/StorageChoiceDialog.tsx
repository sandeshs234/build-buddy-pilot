import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { HardDrive, Cloud, Shield, Smartphone } from 'lucide-react';

interface StorageChoiceDialogProps {
  open: boolean;
  onChoose: (mode: 'local' | 'cloud') => void;
}

export default function StorageChoiceDialog({ open, onChoose }: StorageChoiceDialogProps) {
  const [selected, setSelected] = useState<'local' | 'cloud'>('cloud');

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-lg">Choose Data Storage Mode</DialogTitle>
          <DialogDescription>
            Select where your project data should be stored. You can change this later in Settings.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selected}
          onValueChange={(v) => setSelected(v as 'local' | 'cloud')}
          className="space-y-3 mt-4"
        >
          <label
            htmlFor="cloud"
            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              selected === 'cloud' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            <RadioGroupItem value="cloud" id="cloud" className="mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium">
                <Cloud size={16} className="text-primary" />
                Cloud Storage (Recommended)
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Data synced securely to the cloud. Access from any device, collaborate with your team, and never lose data.
              </p>
              <div className="flex gap-3 mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield size={12} /> Secure & encrypted
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Smartphone size={12} /> Multi-device
                </span>
              </div>
            </div>
          </label>

          <label
            htmlFor="local"
            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              selected === 'local' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            <RadioGroupItem value="local" id="local" className="mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium">
                <HardDrive size={16} className="text-muted-foreground" />
                Local Storage (This Device Only)
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Data stays on this browser only. Private and offline, but not accessible from other devices. Data may be lost if browser cache is cleared.
              </p>
            </div>
          </label>
        </RadioGroup>

        <Button onClick={() => onChoose(selected)} className="w-full mt-4">
          Continue with {selected === 'cloud' ? 'Cloud' : 'Local'} Storage
        </Button>
      </DialogContent>
    </Dialog>
  );
}
