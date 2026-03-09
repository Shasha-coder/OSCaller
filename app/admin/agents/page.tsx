'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Phone, Globe, Volume2, Check, X, Loader2, Bot, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RETELL_LANGUAGES, RETELL_VOICES, RETELL_COUNTRIES } from '@/lib/retell-types'

interface Agent {
  id: string
  agent_id: string
  name: string
  country_code: string
  language: string
  phone_number: string
  voice_id: string
  voice_model?: string
  is_active: boolean
  created_at: string
  updated_at: string
}



function getCountryFlag(code: string) {
  return code.toUpperCase().replace(/./g, c => 
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  )
}

export default function AgentsAdminPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    country_code: '',
    language: '',
    phone_number: '',
    agent_id: '',
    voice_id: 'retell-Cimo',
    is_active: false,
  })

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/retell/agents')
      const data = await res.json()
      setAgents(data.agents || [])
    } catch (err) {
      console.error('Failed to fetch agents:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const openCreateDialog = () => {
    setEditingAgent(null)
    setForm({
      name: '',
      country_code: '',
      language: '',
      phone_number: '',
      agent_id: '',
      voice_id: 'retell-Cimo',
      is_active: false,
    })
    setDialogOpen(true)
  }

  const openEditDialog = (agent: Agent) => {
    setEditingAgent(agent)
    setForm({
      name: agent.name,
      country_code: agent.country_code,
      language: agent.language,
      phone_number: agent.phone_number,
      agent_id: agent.agent_id,
      voice_id: agent.voice_id,
      is_active: agent.is_active,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const method = editingAgent ? 'PATCH' : 'POST'
      const body = editingAgent 
        ? { id: editingAgent.id, ...form }
        : form

      const res = await fetch('/api/retell/agents', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to save agent')
        return
      }

      setDialogOpen(false)
      fetchAgents()
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save agent')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/retell/agents?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        alert('Failed to delete agent')
        return
      }
      setDeleteConfirmId(null)
      fetchAgents()
    } catch {
      alert('Failed to delete agent')
    }
  }

  const handleToggleActive = async (agent: Agent) => {
    try {
      await fetch('/api/retell/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agent.id, is_active: !agent.is_active }),
      })
      fetchAgents()
    } catch {
      alert('Failed to update agent')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
          <span className="text-sm text-white/40">Loading agents...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Bot className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Agents</h1>
            <p className="text-sm text-white/40">Manage Aria agents by country</p>
          </div>
        </div>
        <Button 
          onClick={openCreateDialog} 
          className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-xl h-11 px-5 font-semibold shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_24px_rgba(16,185,129,0.4)] transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {/* Agents Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map(agent => (
          <div 
            key={agent.id} 
            className={`group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1] ${
              !agent.is_active ? 'opacity-60' : ''
            }`}
          >
            {/* Status indicator bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${agent.is_active ? 'bg-emerald-500' : 'bg-white/10'}`} />
            
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getCountryFlag(agent.country_code)}</span>
                  <div>
                    <h3 className="text-base font-semibold text-white">{agent.name}</h3>
                    <p className="text-sm text-white/40">
                      {RETELL_COUNTRIES.find(c => c.code === agent.country_code)?.name || agent.country_code}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={agent.is_active}
                  onCheckedChange={() => handleToggleActive(agent)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              {/* Info rows */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                    <Phone className="h-4 w-4 text-white/40" />
                  </div>
                  <span className="font-mono text-white/60">{agent.phone_number}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                    <Globe className="h-4 w-4 text-white/40" />
                  </div>
                  <span className="text-white/60">{RETELL_LANGUAGES.find(l => l.code === agent.language)?.name || agent.language}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                    <Volume2 className="h-4 w-4 text-white/40" />
                  </div>
                  <span className="text-white/60">{RETELL_VOICES.find(v => v.id === agent.voice_id)?.name || agent.voice_id}</span>
                </div>
              </div>

              {/* Agent ID */}
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/30 mb-1">Agent ID</p>
                <p className="text-xs font-mono text-white/50 truncate">{agent.agent_id}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(agent)}
                  className="flex-1 bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.12] rounded-xl h-10"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                {deleteConfirmId === agent.id ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(agent.id)}
                      className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl h-10 px-4"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteConfirmId(null)}
                      className="bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08] rounded-xl h-10 px-4"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(agent.id)}
                    className="bg-white/[0.04] border-white/[0.08] text-red-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 rounded-xl h-10 px-4"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {agents.length === 0 && (
          <div className="col-span-full rounded-2xl bg-white/[0.03] border border-white/[0.06] border-dashed p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 mx-auto mb-4">
              <Sparkles className="h-7 w-7 text-violet-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No agents yet</h3>
            <p className="text-sm text-white/40 mb-5">
              Add an agent to enable AI calls for a country
            </p>
            <Button 
              onClick={openCreateDialog}
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Agent
            </Button>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#0D1220] border-white/[0.08] text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{editingAgent ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
            <DialogDescription className="text-white/40">
              Configure an AI agent for a specific country
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-white/70">Agent Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Aria (Canada)"
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-emerald-500/50 rounded-xl h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Country</Label>
                <Select
                  value={form.country_code}
                  onValueChange={v => setForm(f => ({ ...f, country_code: v }))}
                  disabled={!!editingAgent}
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-11 [&>span]:text-white/60">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D1220] border-white/[0.08]">
                    {RETELL_COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code} className="text-white/70 focus:bg-white/[0.08] focus:text-white">
                        {getCountryFlag(c.code)} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Language</Label>
                <Select
                  value={form.language}
                  onValueChange={v => setForm(f => ({ ...f, language: v }))}
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-11 [&>span]:text-white/60">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D1220] border-white/[0.08]">
                    {RETELL_LANGUAGES.map(l => (
                      <SelectItem key={l.code} value={l.code} className="text-white/70 focus:bg-white/[0.08] focus:text-white">
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Retell Phone Number (E.164)</Label>
              <Input
                value={form.phone_number}
                onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                placeholder="+14155551234"
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-emerald-500/50 rounded-xl h-11 font-mono"
              />
              <p className="text-xs text-white/30">
                The phone number purchased from Retell for this country
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Retell Agent ID</Label>
              <Input
                value={form.agent_id}
                onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))}
                placeholder="oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD"
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-emerald-500/50 rounded-xl h-11 font-mono"
              />
              <p className="text-xs text-white/30">
                Copy from Retell Dashboard - Agents section
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Voice</Label>
              <Select
                value={form.voice_id}
                onValueChange={v => setForm(f => ({ ...f, voice_id: v }))}
              >
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-11 [&>span]:text-white/60">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1220] border-white/[0.08]">
                  {RETELL_VOICES.map(v => (
                    <SelectItem key={v.id} value={v.id} className="text-white/70 focus:bg-white/[0.08] focus:text-white">
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 pt-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <Switch
                checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
                className="data-[state=checked]:bg-emerald-500"
              />
              <div>
                <Label className="text-white/80">Active</Label>
                <p className="text-xs text-white/40">Agent can receive and make calls</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08] hover:text-white rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !form.name || !form.country_code || !form.language || !form.phone_number}
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-xl disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingAgent ? 'Save Changes' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
