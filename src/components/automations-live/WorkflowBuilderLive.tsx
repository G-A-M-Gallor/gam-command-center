'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAutomationsLive, useAutomationLive } from '@/hooks/useAutomationsLive'
import { NodePanel } from '../automations/NodePanel'
import { NodeProperties } from '../automations/NodeProperties'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay'
  title: string
  x: number
  y: number
  width: number
  height: number
  config: Record<string, string | number | boolean>
  inputs: string[]
  outputs: string[]
}

interface WorkflowConnection {
  id: string
  from: string
  to: string
  fromPort: string
  toPort: string
}

interface NodeTemplate {
  id: string
  title: string
  description: string
}

const nodeTypes = {
  trigger: { icon: '⚡', color: 'bg-orange-500', title: 'טריגר' },
  action: { icon: '🎯', color: 'bg-blue-500', title: 'פעולה' },
  condition: { icon: '🔀', color: 'bg-purple-500', title: 'תנאי' },
  delay: { icon: '⏰', color: 'bg-green-500', title: 'השהיה' }
}

export function WorkflowBuilderLive() {
  const [selectedAutomation, setSelectedAutomation] = useState<string>('')
  const [nodes, setNodes] = useState<WorkflowNode[]>([])
  const [connections, setConnections] = useState<WorkflowConnection[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [dragMode, setDragMode] = useState<'select' | 'connect'>('select')
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)

  // Get list of automations
  const { automations } = useAutomationsLive()

  // Get specific automation with workflow
  const {
    automation,
    loading,
    error,
    updateWorkflow
  } = useAutomationLive(selectedAutomation)

  // Load workflow when automation changes
  useEffect(() => {
    if (automation?.workflow) {
      const { nodes: loadedNodes, connections: loadedConnections } = automation.workflow

      // Transform from DB format to component format
      setNodes(loadedNodes.map((node: any) => ({
        id: node.node_id,
        type: node.node_type,
        title: node.title,
        x: node.position_x,
        y: node.position_y,
        width: node.width || 180,
        height: node.height || 80,
        config: node.config || {},
        inputs: node.inputs || [],
        outputs: node.outputs || []
      })))

      setConnections(loadedConnections.map((conn: any) => ({
        id: conn.connection_id,
        from: conn.from_node_id,
        to: conn.to_node_id,
        fromPort: conn.from_port,
        toPort: conn.to_port
      })))
    }
  }, [automation])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!selectedAutomation || nodes.length === 0) return

    const interval = setInterval(async () => {
      await handleSave(true) // Silent save
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedAutomation, nodes, connections])

  const addNode = useCallback((type: keyof typeof nodeTypes, template: NodeTemplate, x: number, y: number) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      title: template.title,
      x,
      y,
      width: 180,
      height: 80,
      config: { template: template.id },
      inputs: type === 'trigger' ? [] : ['input'],
      outputs: ['output']
    }

    setNodes(prev => [...prev, newNode])
  }, [])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId))
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId))
    if (selectedNode === nodeId) {
      setSelectedNode(null)
    }
  }, [selectedNode])

  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, x, y } : node
    ))
  }, [])

  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, string | number | boolean>) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, config: { ...node.config, ...config } } : node
    ))
  }, [])

  const startConnection = useCallback((nodeId: string) => {
    setDragMode('connect')
    setConnectingFrom(nodeId)
  }, [])

  const completeConnection = useCallback((toNodeId: string) => {
    if (connectingFrom && connectingFrom !== toNodeId) {
      const newConnection: WorkflowConnection = {
        id: `conn_${Date.now()}`,
        from: connectingFrom,
        to: toNodeId,
        fromPort: 'output',
        toPort: 'input'
      }
      setConnections(prev => [...prev, newConnection])
    }
    setDragMode('select')
    setConnectingFrom(null)
  }, [connectingFrom])

  const handleSave = async (silent = false) => {
    if (!selectedAutomation) return

    try {
      setSaving(true)

      const workflow = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          title: node.title,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          config: node.config,
          inputs: node.inputs,
          outputs: node.outputs
        })),
        connections: connections.map(conn => ({
          id: conn.id,
          from: conn.from,
          to: conn.to,
          fromPort: conn.fromPort,
          toPort: conn.toPort
        }))
      }

      await updateWorkflow(workflow)
      setLastSaved(new Date())

      if (!silent) {
        // Show success message
        console.log('Workflow saved successfully')
      }
    } catch (error) {
      console.error('Error saving workflow:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!selectedAutomation) return

    try {
      // First save the workflow
      await handleSave(true)

      // Then trigger a test run
      const response = await fetch(`/api/automations-live/${selectedAutomation}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_source: 'Test',
          trigger_data: { test: true }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to trigger test')
      }

      console.log('Test run triggered successfully')
    } catch (error) {
      console.error('Error testing workflow:', error)
    }
  }

  if (!automations.length) {
    return (
      <div className="h-screen bg-[#1A1A1A] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h2 className="text-xl font-medium text-white mb-2">אין אוטומציות</h2>
          <p className="text-[#A1A1AA]">צור אוטומציה כדי לבנות זרימת עבודה</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#1A1A1A] flex" dir="rtl">
      {/* Top Bar */}
      <div className="fixed top-0 right-0 left-64 h-14 bg-[#2A2A2A] border-b border-[#404040] flex items-center px-6 z-20">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#FF6B1A] flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-white">AUTOMATIONS</span>
        </div>

        {/* Automation Selector */}
        <div className="mr-8">
          <select
            value={selectedAutomation}
            onChange={(e) => setSelectedAutomation(e.target.value)}
            className="bg-[#1A1A1A] border border-[#404040] rounded-lg px-3 py-2 text-white font-medium focus:ring-2 focus:ring-[#FF6B1A] focus:border-[#FF6B1A]"
          >
            <option value="">בחר אוטומציה לעריכה</option>
            {automations.map((automation) => (
              <option key={automation.id} value={automation.id}>
                {automation.name}
              </option>
            ))}
          </select>
        </div>

        {/* Save Status */}
        {selectedAutomation && (
          <div className="mr-4 flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${saving ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[#A1A1AA]">
              {saving ? 'שומר...' : lastSaved ? `נשמר ${lastSaved.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}` : 'לא נשמר'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mr-auto flex items-center gap-3">
          <button
            onClick={() => handleSave()}
            disabled={!selectedAutomation || saving}
            className="px-4 py-2 bg-[#404040] text-[#E5E5E5] rounded hover:bg-[#505050] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            📁 שמירה
          </button>
          <button
            onClick={handleTest}
            disabled={!selectedAutomation || loading || nodes.length === 0}
            className="px-4 py-2 bg-[#404040] text-[#E5E5E5] rounded hover:bg-[#505050] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            ▶️ בדיקה
          </button>
          <button
            onClick={() => handleSave()}
            disabled={!selectedAutomation}
            className="px-4 py-2 bg-[#FF6B1A] text-white rounded hover:bg-[#FF8547] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            🚀 פעל
          </button>
        </div>
      </div>

      {/* Left Panel - Node Library */}
      <NodePanel onAddNode={addNode} />

      {/* Main Canvas */}
      <div className="flex-1 pt-14 overflow-hidden">
        {!selectedAutomation ? (
          <div className="w-full h-full bg-[#0F0F0F] flex items-center justify-center">
            <div className="text-center text-[#6B7280]">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-xl font-medium mb-2">בחר אוטומציה לעריכה</h3>
              <p className="text-sm max-w-md">
                בחר אוטומציה מהרשימה העליונה כדי להתחיל לבנות את זרימת העבודה
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="w-full h-full bg-[#0F0F0F] flex items-center justify-center">
            <div className="text-center text-[#6B7280]">
              <div className="w-8 h-8 border-2 border-[#FF6B1A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p>טוען זרימת עבודה...</p>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full bg-[#0F0F0F] flex items-center justify-center">
            <div className="text-center text-red-400">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-medium mb-2">שגיאה בטעינה</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <div
            ref={canvasRef}
            className="w-full h-full bg-[#0F0F0F] relative overflow-auto"
            style={{
              backgroundImage: `radial-gradient(circle, #333333 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedNode(null)
              }
            }}
          >
            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {connections.map(connection => {
                const fromNode = nodes.find(n => n.id === connection.from)
                const toNode = nodes.find(n => n.id === connection.to)

                if (!fromNode || !toNode) return null

                const fromX = fromNode.x + fromNode.width / 2
                const fromY = fromNode.y + fromNode.height
                const toX = toNode.x + toNode.width / 2
                const toY = toNode.y

                const midY = fromY + (toY - fromY) / 2

                return (
                  <g key={connection.id}>
                    <path
                      d={`M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`}
                      stroke="#FF6B1A"
                      strokeWidth="2"
                      fill="none"
                      className="drop-shadow-sm"
                    />
                    <circle cx={toX} cy={toY} r="4" fill="#FF6B1A" />
                  </g>
                )
              })}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const nodeType = nodeTypes[node.type]

              return (
                <div
                  key={node.id}
                  className={`absolute bg-[#2A2A2A] border rounded-lg shadow-lg cursor-pointer transition-all z-20 ${
                    selectedNode === node.id
                      ? 'border-[#FF6B1A] shadow-[#FF6B1A]/20'
                      : 'border-[#404040] hover:border-[#606060]'
                  }`}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: node.width,
                    height: node.height
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (dragMode === 'connect') {
                      completeConnection(node.id)
                    } else {
                      setSelectedNode(node.id)
                    }
                  }}
                  onMouseDown={(e) => {
                    if (dragMode === 'select') {
                      const startX = e.clientX - node.x
                      const startY = e.clientY - node.y

                      const handleMouseMove = (e: MouseEvent) => {
                        updateNodePosition(node.id, e.clientX - startX, e.clientY - startY)
                      }

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove)
                        document.removeEventListener('mouseup', handleMouseUp)
                      }

                      document.addEventListener('mousemove', handleMouseMove)
                      document.addEventListener('mouseup', handleMouseUp)
                    }
                  }}
                >
                  {/* Node Header */}
                  <div className={`h-8 ${nodeType.color} rounded-t-lg flex items-center px-3`}>
                    <span className="text-white text-sm mr-2">{nodeType.icon}</span>
                    <span className="text-white text-sm font-medium truncate flex-1">
                      {node.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNode(node.id)
                      }}
                      className="text-white/70 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  </div>

                  {/* Node Body */}
                  <div className="p-3 h-12 flex items-center justify-between text-xs text-[#A1A1AA]">
                    <span>מוכן</span>
                    {node.config.template && (
                      <span className="bg-[#404040] px-2 py-1 rounded text-xs">
                        {String(node.config.template)}
                      </span>
                    )}
                  </div>

                  {/* Connection Points */}
                  {node.inputs.length > 0 && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-4 h-4 bg-[#404040] border-2 border-[#2A2A2A] rounded-full hover:bg-[#FF6B1A] transition-colors" />
                    </div>
                  )}

                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div
                      className="w-4 h-4 bg-[#404040] border-2 border-[#2A2A2A] rounded-full hover:bg-[#FF6B1A] transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        startConnection(node.id)
                      }}
                    />
                  </div>
                </div>
              )
            })}

            {/* Empty State */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div className="text-[#6B7280]">
                  <div className="text-6xl mb-4">🔧</div>
                  <h3 className="text-xl font-medium mb-2">בונה אוטומציות חי</h3>
                  <p className="text-sm max-w-md">
                    גרור רכיבים מהפאנל השמאלי כדי להתחיל לבנות את האוטומציה שלך.
                    השינויים נשמרים אוטומטית כל 30 שניות.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Properties */}
      {selectedNode && selectedAutomation && (
        <NodeProperties
          node={nodes.find(n => n.id === selectedNode)!}
          onUpdate={updateNodeConfig}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  )
}