import { supabase } from '@/lib/supabase/client';

interface StressTestOptions {
  messageCount?: number;
  concurrency?: number;
  delayBetweenBatches?: number;
  roomId?: string;
}

export class ChatStressTester {
  private results: { success: number; failed: number; times: number[] } = {
    success: 0,
    failed: 0,
    times: [],
  };

  async runBurstTest(options: StressTestOptions = {}) {
    const {
      messageCount = 100,
      concurrency = 10,
      delayBetweenBatches = 100,
      roomId = '00000000-0000-0000-0000-000000000001',
    } = options;

    console.log(`🚀 Starting burst test: ${messageCount} messages, ${concurrency} concurrent`);
    
    const startTime = Date.now();
    this.results = { success: 0, failed: 0, times: [] };

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated');
      return;
    }

    // Process messages in batches
    for (let i = 0; i < messageCount; i += concurrency) {
      const batch = [];
      
      for (let j = 0; j < concurrency && i + j < messageCount; j++) {
        const index = i + j;
        batch.push(this.sendMessage(user.id, roomId, index));
      }
      
      await Promise.all(batch);
      
      if (i + concurrency < messageCount) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
      
      // Progress update
      console.log(`📊 Progress: ${Math.min(i + concurrency, messageCount)}/${messageCount} messages sent`);
    }

    const totalTime = (Date.now() - startTime) / 1000;
    this.printResults(totalTime);
  }

  async runSpikeTest(spikeSize: number = 50) {
    console.log(`⚡ Sending ${spikeSize} messages simultaneously...`);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated');
      return;
    }

    this.results = { success: 0, failed: 0, times: [] };
    const startTime = Date.now();
    
    const promises = Array(spikeSize).fill(0).map((_, i) => 
      this.sendMessage(user.id, '00000000-0000-0000-0000-000000000001', i)
    );
    
    await Promise.all(promises);
    
    const totalTime = (Date.now() - startTime) / 1000;
    this.printResults(totalTime);
  }

  async measureRealtimeLatency(iterations: number = 10) {
    console.log(`📡 Measuring realtime latency (${iterations} samples)...`);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated');
      return;
    }

    const latencies: number[] = [];
    const roomId = '00000000-0000-0000-0000-000000000001';
    
    // Subscribe to realtime
    const channel = supabase.channel(`latency-test-${Date.now()}`);
    const receivedMessages = new Map<string, number>();
    
    channel
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload: { new: { client_id: string } }) => {
          const sentTime = receivedMessages.get(payload.new.client_id);
          if (sentTime) {
            const latency = Date.now() - sentTime;
            latencies.push(latency);
            console.log(`✓ Message ${payload.new.client_id.slice(-8)} latency: ${latency}ms`);
          }
        }
      )
      .subscribe();

    // Wait for subscription
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send test messages
    for (let i = 0; i < iterations; i++) {
      const clientId = crypto.randomUUID();
      const sentTime = Date.now();
      receivedMessages.set(clientId, sentTime);
      
      await supabase.functions.invoke('send-message', {
        body: {
          room_id: roomId,
          content: `Latency test ${i}`,
          client_id: clientId,
        },
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Wait for all messages
    await new Promise(resolve => setTimeout(resolve, 2000));
    supabase.removeChannel(channel);

    if (latencies.length > 0) {
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const min = Math.min(...latencies);
      const max = Math.max(...latencies);
      
      console.log(`
📊 Realtime Latency Results:
   Average: ${avg.toFixed(2)}ms
   Min: ${min}ms
   Max: ${max}ms
   Samples: ${latencies.length}/${iterations}
      `);
    } else {
      console.log('❌ No realtime messages received');
    }
  }

  private async sendMessage(userId: string, roomId: string, index: number) {
    const start = performance.now();
    
    try {
      const { error } = await supabase.functions.invoke('send-message', {
        body: {
          room_id: roomId,
          content: `Stress test message ${index} at ${new Date().toISOString()}`,
          client_id: crypto.randomUUID(),
        },
      });
      
      const time = performance.now() - start;
      this.results.times.push(time);
      
      if (error) {
        this.results.failed++;
        console.error(`❌ Message ${index} failed:`, error);
      } else {
        this.results.success++;
      }
    } catch (e) {
      this.results.failed++;
      console.error(`❌ Message ${index} error:`, e);
    }
  }

  private printResults(totalTime: number) {
    const avgTime = this.results.times.length > 0 
      ? this.results.times.reduce((a, b) => a + b, 0) / this.results.times.length 
      : 0;
    
    const minTime = this.results.times.length > 0 ? Math.min(...this.results.times) : 0;
    const maxTime = this.results.times.length > 0 ? Math.max(...this.results.times) : 0;
    
    console.log(`
🏁 Stress Test Complete!
━━━━━━━━━━━━━━━━━━━━━━
✅ Successful: ${this.results.success}
❌ Failed: ${this.results.failed}
⏱️  Total Time: ${totalTime.toFixed(2)}s
📊 Messages/sec: ${(this.results.success / totalTime).toFixed(2)}

Response Times:
  Average: ${avgTime.toFixed(2)}ms
  Min: ${minTime.toFixed(2)}ms
  Max: ${maxTime.toFixed(2)}ms
━━━━━━━━━━━━━━━━━━━━━━
    `);
  }
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as unknown as { ChatStressTester: typeof ChatStressTester }).ChatStressTester = ChatStressTester;
  
  console.log(`
🧪 Chat Stress Testing Tools Loaded!

Quick commands:
  const tester = new ChatStressTester();
  
  // Send 100 messages with 10 concurrent
  await tester.runBurstTest({ messageCount: 100, concurrency: 10 });
  
  // Send 50 messages all at once
  await tester.runSpikeTest(50);
  
  // Measure realtime latency
  await tester.measureRealtimeLatency(10);
  `);
} 