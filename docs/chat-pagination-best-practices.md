# Chat Pagination Best Practices

Based on research from Slack's engineering blog and API documentation, here are the best practices for implementing chat message pagination:

## Message Load Sizes

### Industry Standards:
- **Slack**: Recommends no more than **200 messages** at a time for optimal performance
- **Default/Typical**: 50-100 messages per page
- **Minimum**: 15-30 messages (for mobile or constrained environments)
- **Maximum**: Under 1000 messages (absolute limit)

Our implementation uses **50 messages** per load, which is a good balance between:
- Providing enough context for users
- Minimizing database load
- Reducing memory usage
- Maintaining fast response times

## Preventing Aggressive Loading

### Problems to Avoid:
1. **Rapid-fire loading**: Multiple requests triggered by small scroll movements
2. **Loading while scrolling**: Continuous loading as user scrolls up
3. **Memory bloat**: Loading thousands of messages into browser memory
4. **Poor UX**: Jarring scroll position changes

### Solutions Implemented:

1. **Debouncing (300ms delay)**
   - Prevents multiple rapid triggers
   - Allows scroll to stabilize before loading

2. **Minimum Time Between Loads (1 second)**
   - Hard limit on load frequency
   - Prevents database overload

3. **Intersection Observer Tuning**
   - Threshold: 50% (trigger element must be 50% visible)
   - Root margin: 100px (pre-load slightly before fully visible)
   - Single trigger element at top of message list

4. **Loading State Management**
   - Prevent concurrent loads
   - Show loading indicator
   - Display "beginning of conversation" when no more messages

## Slack's Approach

From Slack's engineering blog:
- They moved from loading all channels upfront to lazy-loading
- Use "frecency" (frequency + recency) to prioritize which channels to preload
- Limit preloading to avoid memory issues on large teams
- Use cursor-based pagination for consistent results

## Performance Considerations

1. **Initial Load**: Load most recent 50 messages (covers typical screen)
2. **Scroll Load**: Load 50 more when user scrolls near top
3. **Memory Management**: Consider implementing a message limit (e.g., keep max 500-1000 messages in memory)
4. **Scroll Position**: Maintain scroll position when prepending older messages

## Future Improvements

1. **Virtual Scrolling**: Only render visible messages (for very long conversations)
2. **Message Pruning**: Remove oldest messages when limit reached
3. **Preloading**: Anticipate user scroll and preload next batch
4. **Adaptive Loading**: Adjust batch size based on device/connection speed 