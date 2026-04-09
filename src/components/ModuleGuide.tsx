import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GuideStep {
  title: string;
  description: string;
  tip?: string;
}

export interface ModuleGuideProps {
  moduleName: string;
  description: string;
  steps: GuideStep[];
  className?: string;
}

export default function ModuleGuide({ moduleName, description, steps, className }: ModuleGuideProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('mb-4', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        <BookOpen size={16} />
        <span>How to use {moduleName}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="mt-3 bg-card border rounded-xl p-5 animate-fade-in shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <HelpCircle size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">{moduleName} Guide</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{idx + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  {step.tip && (
                    <p className="text-xs text-primary/80 mt-1 flex items-center gap-1">
                      💡 <span className="italic">{step.tip}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
