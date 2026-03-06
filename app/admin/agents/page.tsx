'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Phone, Globe, Volume2, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { RETELL_LANGUAGES, RETELL_VOICES } from '@/lib/retell-types'

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

const COUNTRIES = [
  { code: 'CA', name: 'Canada', dial: '+1', flag: 'CA' },
  { code: 'US', name: 'United States', dial: '+1', flag: 'US' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: 'GB' },
  { code: 'FR', name: 'France', dial: '+33', flag: 'FR' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: 'DE' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: 'ES' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: 'IT' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: 'AU' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: 'BR' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: 'MX' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: 'JP' },
  { code: 'IN', name: 'India', dial: '+91', flag: 'IN' },
]

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

  // Form state
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#8FB34A]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">AI Agents</h1>
            <p className="text-sm text-[#64748B]">
              Manage Aria AI agents for different countries and languages
            </p>
          </div>
          <Button onClick={openCreateDialog} className="bg-[#8FB34A] hover:bg-[#7A9B3F] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Agent
          </Button>
        </div>

        {/* Agents Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <Card key={agent.id} className={`relative ${!agent.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getCountryFlag(agent.country_code)}</span>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>
                        {COUNTRIES.find(c => c.code === agent.country_code)?.name || agent.country_code}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={agent.is_active}
                    onCheckedChange={() => handleToggleActive(agent)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <Phone className="h-4 w-4" />
                  <span className="font-mono">{agent.phone_number}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <Globe className="h-4 w-4" />
                  <span>{RETELL_LANGUAGES.find(l => l.code === agent.language)?.name || agent.language}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <Volume2 className="h-4 w-4" />
                  <span>{RETELL_VOICES.find(v => v.id === agent.voice_id)?.name || agent.voice_id}</span>
                </div>

                {/* Agent ID */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-[#94A3B8]">Agent ID</p>
                  <p className="text-xs font-mono text-[#64748B] truncate">{agent.agent_id}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(agent)}
                    className="flex-1"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  {deleteConfirmId === agent.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(agent.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmId(agent.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {agents.length === 0 && (
            <Card className="col-span-full p-12 text-center">
              <p className="text-[#64748B]">No agents configured yet.</p>
              <p className="text-sm text-[#94A3B8] mt-1">
                Add an agent to enable AI calls for a country.
              </p>
            </Card>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingAgent ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
              <DialogDescription>
                Configure an AI agent for a specific country. Each country can have one active agent.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Agent Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Aria (Canada)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={form.country_code}
                    onValueChange={v => setForm(f => ({ ...f, country_code: v }))}
                    disabled={!!editingAgent}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {getCountryFlag(c.code)} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={form.language}
                    onValueChange={v => setForm(f => ({ ...f, language: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {RETELL_LANGUAGES.map(l => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Retell Phone Number (E.164)</Label>
                <Input
                  value={form.phone_number}
                  onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                  placeholder="+14155551234"
                />
                <p className="text-xs text-[#94A3B8]">
                  The phone number purchased from Retell for this country
                </p>
              </div>

              <div className="space-y-2">
                <Label>Retell Agent ID</Label>
                <Input
                  value={form.agent_id}
                  onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))}
                  placeholder="oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD"
                />
                <p className="text-xs text-[#94A3B8]">
                  Copy from Retell Dashboard - Agents section
                </p>
              </div>

              <div className="space-y-2">
                <Label>Voice</Label>
                <Select
                  value={form.voice_id}
                  onValueChange={v => setForm(f => ({ ...f, voice_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {RETELL_VOICES.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
                />
                <Label>Active (can receive calls)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving || !form.name || !form.country_code || !form.language || !form.phone_number}
                className="bg-[#8FB34A] hover:bg-[#7A9B3F]"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingAgent ? 'Save Changes' : 'Create Agent'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
