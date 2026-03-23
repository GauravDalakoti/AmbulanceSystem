/**
 * HashMap Implementation for O(1) lookups
 */
class HashMap {
  constructor(size = 100) {
    this.size = size;
    this.buckets = new Array(size).fill(null).map(() => []);
    this.count = 0;
  }

  hash(key) {
    let hash = 0;
    const str = String(key);
    for (let i = 0; i < str.length; i++) {
      hash = (hash + str.charCodeAt(i) * (i + 1)) % this.size;
    }
    return hash;
  }

  set(key, value) {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    
    // Check if key exists and update
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value;
        return;
      }
    }
    
    // Add new key-value pair
    bucket.push([key, value]);
    this.count++;
  }

  get(key) {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    
    for (let [k, v] of bucket) {
      if (k === key) return v;
    }
    
    return undefined;
  }

  has(key) {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    
    for (let [k] of bucket) {
      if (k === key) return true;
    }
    
    return false;
  }

  delete(key) {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.count--;
        return true;
      }
    }
    
    return false;
  }

  keys() {
    const keys = [];
    for (let bucket of this.buckets) {
      for (let [key] of bucket) {
        keys.push(key);
      }
    }
    return keys;
  }

  values() {
    const values = [];
    for (let bucket of this.buckets) {
      for (let [, value] of bucket) {
        values.push(value);
      }
    }
    return values;
  }

  entries() {
    const entries = [];
    for (let bucket of this.buckets) {
      for (let entry of bucket) {
        entries.push(entry);
      }
    }
    return entries;
  }

  clear() {
    this.buckets = new Array(this.size).fill(null).map(() => []);
    this.count = 0;
  }

  size() {
    return this.count;
  }
}

export default HashMap;
