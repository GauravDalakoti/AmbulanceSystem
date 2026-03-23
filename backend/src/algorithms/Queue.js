/**
 * Queue Implementation for Emergency Requests
 * FIFO (First In First Out) structure
 */
class Queue {
  constructor() {
    this.items = [];
    this.frontIndex = 0;
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    if (this.isEmpty()) return null;
    
    const item = this.items[this.frontIndex];
    this.frontIndex++;
    
    // Reset array when half of it is wasted space
    if (this.frontIndex > this.items.length / 2) {
      this.items = this.items.slice(this.frontIndex);
      this.frontIndex = 0;
    }
    
    return item;
  }

  peek() {
    if (this.isEmpty()) return null;
    return this.items[this.frontIndex];
  }

  isEmpty() {
    return this.frontIndex >= this.items.length;
  }

  size() {
    return this.items.length - this.frontIndex;
  }

  clear() {
    this.items = [];
    this.frontIndex = 0;
  }

  toArray() {
    return this.items.slice(this.frontIndex);
  }
}

export default Queue;
