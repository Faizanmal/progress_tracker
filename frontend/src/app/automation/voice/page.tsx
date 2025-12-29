'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { 
  Mic, 
  MicOff, 
  Volume2,
  CheckCircle,
  XCircle,
  Loader2,
  ListTodo,
  Play,
  Clock,
  HelpCircle
} from 'lucide-react';
import { voiceCommandsApi } from '@/src/lib/api-client';
import type { VoiceCommand, VoiceCommandResult } from '@/src/types';
import { toast } from 'sonner';

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

const EXAMPLE_COMMANDS = [
  { command: 'Create a task called "Review PR #123"', type: 'create_task' },
  { command: 'Mark task "Design mockups" as complete', type: 'complete_task' },
  { command: 'Log 2 hours on the API integration task', type: 'log_time' },
  { command: 'Add a note: Made progress on the frontend', type: 'add_note' },
  { command: 'What are my tasks for today?', type: 'list_tasks' },
  { command: 'Show my status', type: 'status' },
  { command: 'Start timer for database migration', type: 'start_timer' },
  { command: 'Stop timer', type: 'stop_timer' },
];

export default function VoiceCommandsPage() {
  const [recentCommands, setRecentCommands] = useState<VoiceCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<VoiceCommandResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    fetchRecentCommands();
    
    // Initialize speech recognition if available
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const transcriptResult = event.results[current][0].transcript;
        setTranscript(transcriptResult);

        if (event.results[current].isFinal) {
          handleProcessCommand(transcriptResult);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error(`Speech recognition error: ${event.error}`);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const fetchRecentCommands = async () => {
    try {
      const data = await voiceCommandsApi.list();
      setRecentCommands(data.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch commands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setProcessing(true);
    setResult(null);
    
    try {
      const response = await voiceCommandsApi.process(command);
      setResult(response);
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
      fetchRecentCommands();
    } catch (error) {
      toast.error('Failed to process command');
      setResult({ success: false, message: 'Failed to process command' });
    } finally {
      setProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setResult(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setTranscript(manualInput);
      handleProcessCommand(manualInput);
      setManualInput('');
    }
  };

  const handleExampleClick = (command: string) => {
    setManualInput(command);
    setTranscript(command);
    handleProcessCommand(command);
  };

  const getCommandTypeIcon = (type: string) => {
    switch (type) {
      case 'create_task':
        return <ListTodo className="w-4 h-4" />;
      case 'complete_task':
        return <CheckCircle className="w-4 h-4" />;
      case 'log_time':
      case 'start_timer':
      case 'stop_timer':
        return <Clock className="w-4 h-4" />;
      case 'list_tasks':
      case 'status':
        return <Play className="w-4 h-4" />;
      default:
        return <Volume2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voice Commands</h1>
          <p className="text-muted-foreground">
            Control tasks with your voice
          </p>
        </div>
      </div>

      {/* Voice Control Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Voice Control</CardTitle>
          <CardDescription>
            Click the microphone and speak your command
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Microphone Button */}
          <div className="flex justify-center">
            <button
              onClick={toggleListening}
              disabled={processing}
              className={`p-8 rounded-full transition-all duration-300 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-primary hover:bg-primary/90'
              } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {processing ? (
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              ) : isListening ? (
                <MicOff className="w-12 h-12 text-white" />
              ) : (
                <Mic className="w-12 h-12 text-white" />
              )}
            </button>
          </div>

          {/* Status */}
          <div className="text-center">
            {isListening && (
              <div className="flex items-center justify-center gap-2 text-red-500">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                Listening...
              </div>
            )}
            {processing && (
              <div className="flex items-center justify-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            )}
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="text-center">
              <p className="text-lg font-medium">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <p className={result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                  {result.message}
                </p>
              </div>
              {result.tasks && result.tasks.length > 0 && (
                <div className="mt-3 space-y-1">
                  {result.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      <ListTodo className="w-4 h-4" />
                      <span>{task.title}</span>
                      <Badge variant="outline">{task.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {(result.active_tasks !== undefined || result.completed_today !== undefined) && (
                <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                  {result.active_tasks !== undefined && (
                    <div>
                      <p className="text-2xl font-bold">{result.active_tasks}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  )}
                  {result.completed_today !== undefined && (
                    <div>
                      <p className="text-2xl font-bold">{result.completed_today}</p>
                      <p className="text-xs text-muted-foreground">Completed Today</p>
                    </div>
                  )}
                  {result.overdue_tasks !== undefined && (
                    <div>
                      <p className="text-2xl font-bold text-red-500">{result.overdue_tasks}</p>
                      <p className="text-xs text-muted-foreground">Overdue</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Manual Input */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Or type your command here..."
              disabled={processing}
            />
            <Button type="submit" disabled={processing || !manualInput.trim()}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Example Commands */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              <CardTitle>Example Commands</CardTitle>
            </div>
            <CardDescription>
              Click to try any of these commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {EXAMPLE_COMMANDS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example.command)}
                  disabled={processing}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-lg border hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {getCommandTypeIcon(example.type)}
                  <span className="text-sm">{example.command}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Commands */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Recent Commands</CardTitle>
            </div>
            <CardDescription>
              Your command history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : recentCommands.length === 0 ? (
              <div className="text-center py-8">
                <Mic className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No commands yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCommands.map((command) => (
                  <div 
                    key={command.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      command.is_successful ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    {command.is_successful ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">&ldquo;{command.raw_transcript}&rdquo;</p>
                      <p className="text-xs text-muted-foreground">{command.result_message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(command.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {command.command_type_display || command.command_type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
