import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getRoadmapData } from '../../services/roadmapService';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TicketRoadmapView: React.FC = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState<boolean>(true);

    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    useEffect(() => {
        const fetchGraphData = async () => {
            try {
                setLoading(true);
                const data = await getRoadmapData();
                setNodes(data.nodes || []);
                setEdges(data.edges || []);
            } catch (error) {
                console.error("Failed to fetch roadmap data", error);
                toast.error("Failed to load Roadmap Data");
            } finally {
                setLoading(false);
            }
        };

        fetchGraphData();
    }, [setNodes, setEdges]);

    return (
        <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-900">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center shadow-sm z-10 relative">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-outfit">Ticket Roadmap</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Visual mapping of Circuits, Tickets, and SLAs</p>
                </div>
            </div>

            <div className="flex-grow w-full relative">
                {loading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    </div>
                )}
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    attributionPosition="bottom-right"
                    minZoom={0.1}
                >
                    <Controls />
                    <MiniMap zoomable pannable nodeColor={(n) => {
                        if (n.data?.type === 'circuit') return '#cbd5e1';
                        if (n.data?.type === 'ticket') return '#38bdf8';
                        if (n.data?.type === 'sla') return '#f87171';
                        if (n.data?.type === 'conversation') return '#c084fc';
                        return '#eee';
                    }} />
                    <Background color="#ccc" gap={16} />
                </ReactFlow>
            </div>
        </div>
    );
};

export default TicketRoadmapView;
