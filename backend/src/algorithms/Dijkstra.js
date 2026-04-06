import MinHeap from "./MinHeap.js";

/**
 * Dijkstra's Algorithm Implementation
 * Finds shortest path from source to all other nodes
 */
class Dijkstra {
  constructor(graph) {
    this.graph = graph;
  }

  /**
   * Find shortest path from source to destination
   * @param {string} source - Starting node
   * @param {string} destination - Target node
   * @returns {Object} - { distance, path }
   */
  findShortestPath(source, destination) {

    console.log("source destination",source, destination);
    
    const distances = new Map();
    const previous = new Map();
    const visited = new Set();
    
    // Initialize distances
    const allNodes = this.graph.getAllNodes();
    for (let node of allNodes) {
      distances.set(node, Infinity);
      previous.set(node, null);
    }
    distances.set(source, 0);

    // Priority queue: min-heap based on distance
    const pq = new MinHeap((a, b) => a.distance - b.distance);
    pq.insert({ node: source, distance: 0 });

    while (!pq.isEmpty()) {
      const { node: currentNode, distance: currentDistance } = pq.extractMin();

      // Skip if already visited
      if (visited.has(currentNode)) continue;
      visited.add(currentNode);

      // Early exit if we reached destination
      if (currentNode === destination) break;

      // Check all neighbors
      const neighbors = this.graph.getNeighbors(currentNode);
      for (let { node: neighbor, weight } of neighbors) {
        if (visited.has(neighbor)) continue;

        const newDistance = currentDistance + weight;
        
        if (newDistance < distances.get(neighbor)) {
          distances.set(neighbor, newDistance);
          previous.set(neighbor, currentNode);
          pq.insert({ node: neighbor, distance: newDistance });
        }
      }
    }

    // Reconstruct path
    const path = this.reconstructPath(previous, source, destination);
    const distance = distances.get(destination);

    return {
      distance: distance === Infinity ? null : distance,
      path: path.length > 0 ? path : null
    };
  }

  /**
   * Reconstruct path from source to destination using previous map
   */
  reconstructPath(previous, source, destination) {
    const path = [];
    let current = destination;

    while (current !== null) {
      path.unshift(current);
      current = previous.get(current);
    }

    // If path doesn't start with source, no path exists
    if (path[0] !== source) return [];
    
    return path;
  }

  /**
   * Find shortest paths from source to all nodes
   * @param {string} source - Starting node
   * @returns {Map} - Map of node -> { distance, path }
   */
  findAllShortestPaths(source) {
    const distances = new Map();
    const previous = new Map();
    const visited = new Set();
    
    // Initialize distances
    const allNodes = this.graph.getAllNodes();
    for (let node of allNodes) {
      distances.set(node, Infinity);
      previous.set(node, null);
    }
    distances.set(source, 0);

    // Priority queue
    const pq = new MinHeap((a, b) => a.distance - b.distance);
    pq.insert({ node: source, distance: 0 });

    while (!pq.isEmpty()) {
      const { node: currentNode, distance: currentDistance } = pq.extractMin();

      if (visited.has(currentNode)) continue;
      visited.add(currentNode);

      const neighbors = this.graph.getNeighbors(currentNode);
      for (let { node: neighbor, weight } of neighbors) {
        if (visited.has(neighbor)) continue;

        const newDistance = currentDistance + weight;
        
        if (newDistance < distances.get(neighbor)) {
          distances.set(neighbor, newDistance);
          previous.set(neighbor, currentNode);
          pq.insert({ node: neighbor, distance: newDistance });
        }
      }
    }

    // Build result map with paths
    const result = new Map();
    for (let node of allNodes) {
      const path = this.reconstructPath(previous, source, node);
      result.set(node, {
        distance: distances.get(node),
        path: path.length > 0 ? path : null
      });
    }

    return result;
  }
}

export default Dijkstra;
