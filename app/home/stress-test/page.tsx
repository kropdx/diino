"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface TestResult {
  timestamp: number;
  action: string;
  duration: number;
  success: boolean;
  error?: string;
}

export default function StressTestPage() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [messageCount, setMessageCount] = useState(100);
  const [concurrency, setConcurrency] = useState(10);
  const roomId = "00000000-0000-0000-0000-000000000001";
  const abortRef = useRef(false);

  // Performance metrics
  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    successfulSends: 0,
    failedSends: 0,
    avgSendTime: 0,
    maxSendTime: 0,
    minSendTime: Infinity,
    messagesPerSecond: 0,
  });

  const logResult = (action: string, duration: number, success: boolean, error?: string) => {
    const result = { timestamp: Date.now(), action, duration, success, error };
    setResults(prev => [...prev.slice(-99), result]);
    
    if (action === "send") {
      setMetrics(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 1,
        successfulSends: success ? prev.successfulSends + 1 : prev.successfulSends,
        failedSends: success ? prev.failedSends : prev.failedSends + 1,
        avgSendTime: ((prev.avgSendTime * prev.totalMessages) + duration) / (prev.totalMessages + 1),
        maxSendTime: Math.max(prev.maxSendTime, duration),
        minSendTime: Math.min(prev.minSendTime, duration),
      }));
    }
  };

  const sendMessage = async (index: number) => {
    const start = performance.now();
    const content = `Stress test message ${index} at ${new Date().toISOString()}`;
    
    try {
      const { error } = await supabase.functions.invoke("send-message", {
        body: {
          room_id: roomId,
          content,
          client_id: crypto.randomUUID(),
          metadata: { test: true, index },
        },
      });
      
      const duration = performance.now() - start;
      logResult("send", duration, !error, error?.message);
      return !error;
    } catch (e) {
      const duration = performance.now() - start;
      logResult("send", duration, false, e instanceof Error ? e.message : "Unknown error");
      return false;
    }
  };

  const runBurstTest = async () => {
    console.log(`Starting burst test: ${messageCount} messages with ${concurrency} concurrent requests`);
    const startTime = Date.now();
    
    for (let i = 0; i < messageCount; i += concurrency) {
      if (abortRef.current) break;
      
      const batch = [];
      for (let j = 0; j < concurrency && i + j < messageCount; j++) {
        batch.push(sendMessage(i + j));
      }
      
      await Promise.all(batch);
      
      // Small delay between batches to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    setMetrics(prev => ({
      ...prev,
      messagesPerSecond: prev.successfulSends / totalTime,
    }));
    
    console.log(`Burst test complete in ${totalTime}s`);
  };

  const runSustainedTest = async () => {
    console.log(`Starting sustained test: 1 message per second for ${messageCount} seconds`);
    
    for (let i = 0; i < messageCount; i++) {
      if (abortRef.current) break;
      
      const start = Date.now();
      await sendMessage(i);
      
      // Wait remainder of 1 second
      const elapsed = Date.now() - start;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }
    }
    
    console.log("Sustained test complete");
  };

  const runRealtimeTest = async () => {
    console.log("Starting realtime latency test");
    const latencies: number[] = [];
    
    const channel = supabase.channel(`stress-test-${Date.now()}`);
    
    await new Promise<void>((resolve) => {
      channel
        .on("postgres_changes", 
          { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
          (payload: { new: { metadata?: { test?: boolean; timestamp?: number } } }) => {
            if (payload.new.metadata?.test && payload.new.metadata?.timestamp) {
              const latency = Date.now() - payload.new.metadata.timestamp;
              latencies.push(latency);
              logResult("realtime", latency, true);
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") resolve();
        });
    });

    // Send test messages with timestamps
    for (let i = 0; i < 10; i++) {
      if (abortRef.current) break;
      
      await supabase.functions.invoke("send-message", {
        body: {
          room_id: roomId,
          content: `Realtime latency test ${i}`,
          client_id: crypto.randomUUID(),
          metadata: { test: true, timestamp: Date.now() },
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for messages
    supabase.removeChannel(channel);
    
    if (latencies.length > 0) {
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      console.log(`Average realtime latency: ${avgLatency}ms`);
    }
  };

  const startStressTest = async () => {
    if (!user) return;
    
    setIsRunning(true);
    abortRef.current = false;
    setResults([]);
    setMetrics({
      totalMessages: 0,
      successfulSends: 0,
      failedSends: 0,
      avgSendTime: 0,
      maxSendTime: 0,
      minSendTime: Infinity,
      messagesPerSecond: 0,
    });

    // Join room first
    await supabase.from("chat_members").insert({ room_id: roomId, user_id: user.id });

    // Run tests
    await runBurstTest();
    if (!abortRef.current) await runSustainedTest();
    if (!abortRef.current) await runRealtimeTest();

    setIsRunning(false);
  };

  const stopTest = () => {
    abortRef.current = true;
    setIsRunning(false);
  };

  // Monitor memory usage
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
        console.log(`Memory: ${Math.round(memory.usedJSHeapSize / 1048576)}MB / ${Math.round(memory.totalJSHeapSize / 1048576)}MB`);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Chat Stress Test</h1>
      
      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">Test Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Total Messages</label>
            <Input
              type="number"
              value={messageCount}
              onChange={(e) => setMessageCount(Number(e.target.value))}
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="text-sm">Concurrency</label>
            <Input
              type="number"
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              disabled={isRunning}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={startStressTest} disabled={isRunning || !user}>
            Start Stress Test
          </Button>
          <Button onClick={stopTest} disabled={!isRunning} variant="destructive">
            Stop Test
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-2">Performance Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Total Messages</div>
            <div className="text-xl font-mono">{metrics.totalMessages}</div>
          </div>
          <div>
            <div className="text-gray-500">Success Rate</div>
            <div className="text-xl font-mono">
              {metrics.totalMessages > 0 
                ? `${Math.round((metrics.successfulSends / metrics.totalMessages) * 100)}%`
                : "0%"}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Avg Send Time</div>
            <div className="text-xl font-mono">{Math.round(metrics.avgSendTime)}ms</div>
          </div>
          <div>
            <div className="text-gray-500">Messages/sec</div>
            <div className="text-xl font-mono">{metrics.messagesPerSecond.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-500">Min Send Time</div>
            <div className="text-xl font-mono">
              {metrics.minSendTime === Infinity ? "N/A" : `${Math.round(metrics.minSendTime)}ms`}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Max Send Time</div>
            <div className="text-xl font-mono">{Math.round(metrics.maxSendTime)}ms</div>
          </div>
          <div>
            <div className="text-gray-500">Failed Sends</div>
            <div className="text-xl font-mono text-red-500">{metrics.failedSends}</div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-2">Recent Operations</h2>
        <div className="h-48 overflow-y-auto text-xs font-mono space-y-1">
          {results.slice(-20).reverse().map((result, i) => (
            <div 
              key={`${result.timestamp}-${i}`}
              className={result.success ? "text-green-600" : "text-red-600"}
            >
              {new Date(result.timestamp).toLocaleTimeString()} - {result.action} - {result.duration.toFixed(0)}ms
              {result.error && ` - ${result.error}`}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 