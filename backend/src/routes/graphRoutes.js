import {CityGraph} from "../models/CityGraph.js"
import dispatchService from "../services/dispatchService.js";

import { Router } from 'express';

const router=Router()

// Get city graph
router.get('/', async (req, res) => {
  try {
    // FIXED: Changed from 'MainCity' to 'Haldwani'
    const graph = await CityGraph.findOne({ cityName: 'Haldwani' });
    
    if (!graph) {
      return res.status(404).json({ error: 'City graph not found' });
    }
    
    // Convert Map to object for JSON response
    const graphData = {
      cityName: graph.cityName,
      nodes: Object.fromEntries(graph.nodes),
      edges: Object.fromEntries(graph.edges),
      metadata: graph.metadata
    };
    
    console.log('📊 Graph data sent:', {
      cityName: graphData.cityName,
      nodeCount: Object.keys(graphData.nodes).length
    });
    
    res.json(graphData);
  } catch (error) {
    console.error('❌ Error fetching graph:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add node to graph
router.post('/nodes', async (req, res) => {
  try {
    const { nodeId, name, type, coordinates } = req.body;
    
    const graph = await CityGraph.findOne({ cityName: 'Haldwani' });
    
    if (!graph) {
      return res.status(404).json({ error: 'City graph not found' });
    }
    
    graph.nodes.set(nodeId, { name, type, coordinates });
    graph.edges.set(nodeId, []);
    await graph.save();
    
    await dispatchService.initialize();
    
    res.json({ message: 'Node added successfully', nodeId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add edge to graph
router.post('/edges', async (req, res) => {
  try {
    const { from, to, weight } = req.body;
    
    const graph = await CityGraph.findOne({ cityName: 'Haldwani' });
    
    if (!graph) {
      return res.status(404).json({ error: 'City graph not found' });
    }
    
    const fromEdges = graph.edges.get(from) || [];
    const toEdges = graph.edges.get(to) || [];
    
    fromEdges.push({ node: to, weight });
    toEdges.push({ node: from, weight });
    
    graph.edges.set(from, fromEdges);
    graph.edges.set(to, toEdges);
    
    await graph.save();
    await dispatchService.initialize();
    
    res.json({ message: 'Edge added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove edge from graph
router.delete('/edges', async (req, res) => {
  try {
    const { from, to } = req.body;
    
    const graph = await CityGraph.findOne({ cityName: 'Haldwani' });
    
    if (!graph) {
      return res.status(404).json({ error: 'City graph not found' });
    }
    
    const fromEdges = graph.edges.get(from) || [];
    const toEdges = graph.edges.get(to) || [];
    
    graph.edges.set(from, fromEdges.filter(e => e.node !== to));
    graph.edges.set(to, toEdges.filter(e => e.node !== from));
    
    await graph.save();
    await dispatchService.initialize();
    
    res.json({ message: 'Edge removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await dispatchService.getStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
