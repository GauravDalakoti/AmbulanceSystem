/**
 * Graph Implementation using Adjacency List
 * Represents the city road network
 */
class Graph {
  constructor() {
    this.adjacencyList = new Map();
  }

  addNode(node) {
    if (!this.adjacencyList.has(node)) {
      this.adjacencyList.set(node, []);
    }
  }

  addEdge(node1, node2, weight) {
    // Add nodes if they don't exist
    this.addNode(node1);
    this.addNode(node2);

    // Add bidirectional edge (undirected graph for city roads)
    this.adjacencyList.get(node1).push({ node: node2, weight });
    this.adjacencyList.get(node2).push({ node: node1, weight });
  }

  getNeighbors(node) {
    return this.adjacencyList.get(node) || [];
  }

  getAllNodes() {
    return Array.from(this.adjacencyList.keys());
  }

  hasNode(node) {
    return this.adjacencyList.has(node);
  }

  removeEdge(node1, node2) {
    if (this.adjacencyList.has(node1)) {
      this.adjacencyList.set(
        node1,
        this.adjacencyList.get(node1).filter(edge => edge.node !== node2)
      );
    }
    if (this.adjacencyList.has(node2)) {
      this.adjacencyList.set(
        node2,
        this.adjacencyList.get(node2).filter(edge => edge.node !== node1)
      );
    }
  }

  removeNode(node) {
    if (!this.adjacencyList.has(node)) return;

    // Remove all edges to this node
    for (let [key, edges] of this.adjacencyList) {
      this.adjacencyList.set(
        key,
        edges.filter(edge => edge.node !== node)
      );
    }

    // Remove the node itself
    this.adjacencyList.delete(node);
  }

  getGraph() {
    const graph = {};
    for (let [node, edges] of this.adjacencyList) {
      graph[node] = edges;
    }
    return graph;
  }

  // loadGraph(graphData) {
  //   this.adjacencyList.clear();
  //   for (let node in graphData) {
  //     this.adjacencyList.set(node, graphData[node]);
  //   }
  // }

  loadGraph(graphData) {
    this.adjacencyList.clear();

    for (let node in graphData) {
      for (let edge of graphData[node]) {
        this.addEdge(node, edge.node, edge.weight);
      }
    }
  }
}

export default Graph;
