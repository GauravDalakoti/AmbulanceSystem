import MinHeap from "./MinHeap.js";

/**
 * Priority Queue Implementation for Emergency Requests
 * Higher severity emergencies get higher priority
 */
class PriorityQueue {
  constructor() {
    // Min heap with custom comparator for emergencies
    // Lower priority value = higher urgency (processed first)
    this.heap = new MinHeap((a, b) => {
      // Priority = (6 - severity) + (distance_factor)
      // This ensures severity 5 (critical) gets processed before severity 1
      return a.priority - b.priority;
    });
  }

  /**
   * Calculate priority score for an emergency
   * Lower score = higher priority
   */
  calculatePriority(emergency) {
    // Invert severity so higher severity = lower priority value
    const severityScore = 6 - emergency.severity;
    
    // Time factor: older emergencies get higher priority
    const timeScore = emergency.timestamp ? 
      -Math.floor((Date.now() - new Date(emergency.timestamp)) / 60000) : 0; // minutes
    
    // Combine scores (severity is most important)
    return severityScore * 100 + timeScore;
  }

  enqueue(emergency) {
    const priority = this.calculatePriority(emergency);
    this.heap.insert({ ...emergency, priority });
  }

  dequeue() {
    const item = this.heap.extractMin();
    if (item) {
      delete item.priority; // Remove internal priority field
    }
    return item;
  }

  peek() {
    const item = this.heap.peek();
    if (item) {
      const { priority, ...emergency } = item;
      return emergency;
    }
    return null;
  }

  isEmpty() {
    return this.heap.isEmpty();
  }

  size() {
    return this.heap.size();
  }

  clear() {
    this.heap = new MinHeap((a, b) => a.priority - b.priority);
  }

  toArray() {
    return [...this.heap.heap].map(item => {
      const { priority, ...emergency } = item;
      return emergency;
    });
  }
}

export default PriorityQueue;
