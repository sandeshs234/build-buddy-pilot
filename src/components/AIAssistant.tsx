import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Sparkles, AlertTriangle, Send, Loader2, Lightbulb, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Activity } from '@/types/construction';
import { useProjectData } from '@/context/ProjectDataContext';
import ReactMarkdown from 'react-markdown';

// Route to module key mapping
const ROUTE_MODULE_MAP: Record<string, { key: string; label: string }> = {
  '/dashboard': { key: 'dashboard', label: 'Dashboard' },
  '/': { key: 'dashboard', label: 'Dashboard' },
  '/activities': { key: 'activities', label: 'Activities (CPM)' },
  '/boq': { key: 'boq', label: 'BOQ / Items' },
  '/inventory': { key: 'inventory', label: 'Inventory' },
  '/equipment': { key: 'equipment', label: 'Equipment' },
  '/safety': { key: 'safety', label: 'Safety' },
  '/delays': { key: 'delays', label: 'Delays' },
  '/purchase-orders': { key: 'purchase-orders', label: 'Purchase Orders' },
  '/manpower': { key: 'manpower', label: 'Manpower' },
  '/fuel': { key: 'fuel', label: 'Fuel Log' },
  '/concrete': { key: 'concrete', label: 'Concrete Pours' },
  '/daily-quantity': { key: 'daily-quantity', label: 'Daily Quantity' },
  '/quality': { key: 'quality', label: 'Quality (ITP/NCR)' },
  '/welding': { key: 'welding', label: 'Welding' },
};

interface AIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities?: Activity[];
  onApplyCriticalPath?: (criticalIds: string[]) => void;
  onApplyDependencies?: (deps: { from: string; to: string; type: string }[]) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant({ open, onOpenChange, activities, onApplyCriticalPath, onApplyDependencies }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const location = useLocation();

  // Get project data context
  let projectData: any = null;
  try {
    projectData = useProjectData();
  } catch {}

  const currentModule = ROUTE_MODULE_MAP[location.pathname] || { key: 'general', label: 'General' };

  // Get current module's data
  const getModuleData = () => {
    if (!projectData) return [];
    const dataMap: Record<string, any[]> = {
      activities: projectData.activities || [],
      boq: projectData.boqItems || [],
      inventory: projectData.inventory || [],
      equipment: projectData.equipment || [],
      safety: projectData.safety || [],
      delays: projectData.delays || [],
      'purchase-orders': projectData.purchaseOrders || [],
      manpower: projectData.manpower || [],
      fuel: projectData.fuelLog || [],
      concrete: projectData.concretePours || [],
      'daily-quantity': projectData.dailyQty || [],
      dashboard: [
        ...(projectData.activities || []).slice(0, 10),
        ...(projectData.boqItems || []).slice(0, 10),
      ],
    };
    return dataMap[currentModule.key] || [];
  };

  // Auto-fetch suggestions when module changes and dialog opens
  useEffect(() => {
    if (open && currentModule.key !== 'general') {
      fetchSuggestions();
    }
  }, [open, currentModule.key]);

  const fetchSuggestions = async () => {
    const moduleData = getModuleData();
    if (moduleData.length === 0) return;

    setSuggestionsLoading(true);
    setSuggestions(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'module-suggest',
          data: {
            module: currentModule.key,
            moduleData,
            itemCount: moduleData.length,
          },
        },
      });
      if (error) throw error;
      setSuggestions(data?.result || null);
    } catch (err: any) {
      console.error('Suggestions error:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const sendMessage = async (action: string, message?: string) => {
    setLoading(true);
    const userMsg = message || input;

    if ((action === 'general' || action === 'module-chat') && userMsg) {
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setInput('');
    }

    try {
      const moduleData = getModuleData();
      const body: any = { action, data: {} };

      if (action === 'module-chat') {
        body.data = {
          message: userMsg,
          module: currentModule.key,
          moduleData: moduleData.slice(0, 30),
          itemCount: moduleData.length,
        };
      } else if (action === 'critical-path' || action === 'schedule-optimize') {
        body.data = { activities: activities || projectData?.activities || [] };
      } else {
        body.data = { message: userMsg };
      }

      const { data, error } = await supabase.functions.invoke('ai-assistant', { body });
      if (error) throw error;

      const result = data?.result || 'No response received.';

      if (action === 'critical-path') {
        try {
          const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/) || result.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : result);
          setAnalysisResult(parsed);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `## Critical Path Analysis Complete\n\n${parsed.summary || 'Analysis ready.'}\n\n**Critical Path:** ${parsed.criticalPath?.length || 0} activities\n**Behind Schedule:** ${parsed.behindSchedule?.length || 0} activities\n**Suggested Dependencies:** ${parsed.suggestedDependencies?.length || 0}\n**Recovery Actions:** ${parsed.recoveryActions?.length || 0}`
          }]);
        } catch {
          setMessages(prev => [...prev, { role: 'assistant', content: result }]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: result }]);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'AI request failed';
      toast({ title: 'AI Error', description: errorMsg, variant: 'destructive' });
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const applyCriticalPath = () => {
    if (analysisResult?.criticalPath && onApplyCriticalPath) {
      onApplyCriticalPath(analysisResult.criticalPath);
      toast({ title: 'Applied', description: 'Critical path flags updated on activities' });
    }
  };

  const applyDependencies = () => {
    if (analysisResult?.suggestedDependencies && onApplyDependencies) {
      onApplyDependencies(analysisResult.suggestedDependencies);
      toast({ title: 'Applied', description: 'Dependencies added to activities' });
    }
  };

  // Quick question chips based on current module
  const getQuickQuestions = (): { label: string; question: string }[] => {
    const moduleQuestions: Record<string, { label: string; question: string }[]> = {
      activities: [
        { label: 'Find delays', question: 'Which activities are behind schedule and what recovery actions do you suggest?' },
        { label: 'Resource conflicts', question: 'Are there any resource conflicts or overallocations in the current schedule?' },
      ],
      boq: [
        { label: 'Cost forecast', question: 'Based on current execution rates, what is the forecasted final cost?' },
        { label: 'Low execution', question: 'Which BOQ items have the lowest execution percentage and may cause delays?' },
      ],
      inventory: [
        { label: 'Reorder alerts', question: 'Which items are below minimum stock level and need immediate reordering?' },
        { label: 'Dead stock', question: 'Are there any slow-moving or excess inventory items I should address?' },
      ],
      safety: [
        { label: 'Risk areas', question: 'What are the highest-risk areas based on incident patterns?' },
        { label: 'Safety score', question: 'Calculate the overall safety performance and suggest improvements.' },
      ],
      delays: [
        { label: 'EOT analysis', question: 'Analyze these delays for Extension of Time claims eligibility.' },
        { label: 'Root causes', question: 'What are the top root causes of delays and how to prevent recurrence?' },
      ],
      equipment: [
        { label: 'Utilization', question: 'Which equipment has the lowest utilization and should be demobilized?' },
        { label: 'Fuel efficiency', question: 'Analyze fuel consumption patterns and flag inefficient equipment.' },
      ],
      manpower: [
        { label: 'Productivity', question: 'Analyze labor productivity trends and suggest optimal crew sizes.' },
        { label: 'Trade balance', question: 'Is the trade mix balanced for current activities?' },
      ],
      concrete: [
        { label: 'Quality check', question: 'Analyze concrete quality trends - slump, temperature, supplier consistency.' },
        { label: 'Pour planning', question: 'Suggest optimal pour sequence and volume planning.' },
      ],
      dashboard: [
        { label: 'Project health', question: 'Give me an executive summary of overall project health and key risks.' },
        { label: 'Action items', question: 'What are the top 5 priority action items I should address today?' },
      ],
    };
    return moduleQuestions[currentModule.key] || moduleQuestions.dashboard || [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="text-primary" size={20} />
            BuildForge AI — {currentModule.label}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Context-aware AI assistant analyzing your {currentModule.label.toLowerCase()} data in real-time
          </p>
        </DialogHeader>

        {/* AI Suggestions Banner */}
        {(suggestionsLoading || suggestions) && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 max-h-[150px] overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb size={14} className="text-primary" />
              <span className="text-xs font-semibold text-primary">AI Suggestions for {currentModule.label}</span>
              <Button variant="ghost" size="sm" className="ml-auto h-5 text-[10px] px-2" onClick={fetchSuggestions} disabled={suggestionsLoading}>
                <Zap size={10} className="mr-1" /> Refresh
              </Button>
            </div>
            {suggestionsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={12} className="animate-spin" /> Analyzing your data...
              </div>
            ) : suggestions ? (
              <div className="prose prose-xs dark:prose-invert max-w-none text-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ul]:my-0.5 [&_li]:my-0">
                <ReactMarkdown>{suggestions}</ReactMarkdown>
              </div>
            ) : null}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-1.5 pb-2 border-b">
          {currentModule.key === 'activities' && (
            <>
              <Button variant="outline" size="sm" onClick={() => sendMessage('critical-path')} disabled={loading}>
                <Sparkles size={14} className="mr-1.5" /> Analyze Critical Path
              </Button>
              <Button variant="outline" size="sm" onClick={() => sendMessage('schedule-optimize')} disabled={loading}>
                <AlertTriangle size={14} className="mr-1.5" /> Optimize Schedule
              </Button>
            </>
          )}
          {getQuickQuestions().map((q, i) => (
            <Button key={i} variant="outline" size="sm" onClick={() => sendMessage('module-chat', q.question)} disabled={loading} className="text-xs">
              <Zap size={12} className="mr-1" /> {q.label}
            </Button>
          ))}
        </div>

        {/* Analysis Result Actions */}
        {analysisResult && (
          <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <span className="text-xs font-medium text-primary w-full mb-1">Apply AI Recommendations:</span>
            {analysisResult.criticalPath?.length > 0 && (
              <Button size="sm" variant="default" onClick={applyCriticalPath}>
                Apply Critical Path ({analysisResult.criticalPath.length} activities)
              </Button>
            )}
            {analysisResult.suggestedDependencies?.length > 0 && (
              <Button size="sm" variant="outline" onClick={applyDependencies}>
                Apply Dependencies ({analysisResult.suggestedDependencies.length})
              </Button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[400px] py-2">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Bot size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">Ask me about your {currentModule.label.toLowerCase()}</p>
              <p className="text-xs mt-1">I have real-time access to your project data for smart analysis</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-3">
                <Loader2 size={16} className="animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Ask about ${currentModule.label.toLowerCase()}...`}
            className="min-h-[40px] max-h-[80px] resize-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) sendMessage('module-chat');
              }
            }}
          />
          <Button onClick={() => input.trim() && sendMessage('module-chat')} disabled={loading || !input.trim()} size="icon" className="shrink-0">
            <Send size={16} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
