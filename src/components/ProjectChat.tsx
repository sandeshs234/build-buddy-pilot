import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: { full_name: string };
}

interface ProjectChatProps {
  projectId: string;
  projectName: string;
}

export default function ProjectChat({ projectId, projectName }: ProjectChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen || !projectId) return;

    // Fetch messages
    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (data) {
        setMessages(data);
        // Fetch profiles for unique user_ids
        const userIds = [...new Set(data.map((m: any) => m.user_id))];
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds as string[]);
        if (profs) {
          const map: Record<string, string> = {};
          profs.forEach(p => { map[p.id] = p.full_name; });
          setProfiles(map);
        }
      }
    };

    fetchMessages();

    // Subscribe to realtime
    const channel = supabase
      .channel(`chat-${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
        // Fetch profile for new user if not cached
        const uid = (payload.new as any).user_id;
        if (!profiles[uid]) {
          supabase.from('profiles').select('id, full_name').eq('id', uid).single().then(({ data }) => {
            if (data) setProfiles(prev => ({ ...prev, [data.id]: data.full_name }));
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    await (supabase as any)
      .from('chat_messages')
      .insert({ project_id: projectId, user_id: user.id, message: newMessage.trim() });
    setNewMessage('');
    setSending(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 bg-card border rounded-2xl shadow-2xl flex flex-col transition-all ${isMinimized ? 'w-72 h-14' : 'w-96 h-[500px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50 rounded-t-2xl cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">{projectName} Chat</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1 hover:bg-muted rounded">
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-1 hover:bg-muted rounded">
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation!</p>
            )}
            {messages.map(msg => {
              const isMe = msg.user_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {!isMe && (
                      <p className="text-[10px] font-semibold mb-0.5 opacity-70">
                        {profiles[msg.user_id] || 'User'}
                      </p>
                    )}
                    <p className="text-sm break-words">{msg.message}</p>
                    <p className={`text-[10px] mt-0.5 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex gap-2"
            >
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                <Send size={16} />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
