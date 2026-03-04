import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Sparkles, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Activity } from '@/types/construction';
import ReactMarkdown from 'react-markdown';

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

  const sendMessage = async (action: string, message?: string) => {
    setLoading(true);
    const userMsg = message || input;
    if (action === 'general' && userMsg) {
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setInput('');
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action,
          data: action === 'general'
            ? { message: userMsg }
            : { activities },
        },
      });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="text-primary" size={20} />
            BuildForge AI Assistant
          </DialogTitle>
        </DialogHeader>

        {/* Quick Actions */}
        {activities && activities.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2 border-b">
            <Button variant="outline" size="sm" onClick={() => sendMessage('critical-path')} disabled={loading}>
              <Sparkles size={14} className="mr-1.5" /> Analyze Critical Path
            </Button>
            <Button variant="outline" size="sm" onClick={() => sendMessage('schedule-optimize')} disabled={loading}>
              <AlertTriangle size={14} className="mr-1.5" /> Optimize Schedule
            </Button>
          </div>
        )}

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
              <p className="font-medium">Ask me anything about your project</p>
              <p className="text-xs mt-1">Critical path analysis, scheduling, BOQ, cost tracking, safety...</p>
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
            placeholder="Ask about scheduling, critical path, BOQ, costs..."
            className="min-h-[40px] max-h-[80px] resize-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) sendMessage('general');
              }
            }}
          />
          <Button onClick={() => input.trim() && sendMessage('general')} disabled={loading || !input.trim()} size="icon" className="shrink-0">
            <Send size={16} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
