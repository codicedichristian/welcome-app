import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  adminGetMessages,
  adminCreateMessage,
  adminDeleteMessage,
  adminGetServiceAreas,
  adminGetMidweekGroups,
} from '../../lib/api.js'
import { formatShortDate } from '../../lib/format.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../admin/components/Modal.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'
import { Field, Input, Textarea, Select } from '../../admin/components/FormField.jsx'

const AUDIENCE_TYPE = ['All members', 'Service area', 'Midweek group']
const EMPTY_FORM = { title: '', body: '', audienceType: 'All members', audienceId: '', send_push: true }

function formatAudience(audience, serviceAreas, midweekGroups) {
  if (!audience || audience === 'all_members') return 'All members'
  if (audience.startsWith('area:')) {
    const id = audience.slice(5)
    const area = serviceAreas.find((a) => a.id === id)
    return area ? `${area.name} team` : 'Service area'
  }
  if (audience.startsWith('group:')) {
    const id = audience.slice(6)
    const group = midweekGroups.find((g) => g.id === id)
    return group ? `${group.host ?? group.zone} group` : 'Midweek group'
  }
  return audience
}

function buildAudienceValue(type, id) {
  if (type === 'All members') return 'all_members'
  if (type === 'Service area' && id) return `area:${id}`
  if (type === 'Midweek group' && id) return `group:${id}`
  return 'all_members'
}

export default function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [serviceAreas, setServiceAreas] = useState([])
  const [midweekGroups, setMidweekGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = async () => {
    const { data, error: e } = await adminGetMessages()
    if (e) setError(true)
    else { setMessages(data ?? []); setError(false) }
    setLoading(false)
  }

  useEffect(() => {
    Promise.all([load(), adminGetServiceAreas(), adminGetMidweekGroups()]).then(
      ([, { data: areas }, { data: groups }]) => {
        setServiceAreas(areas ?? [])
        setMidweekGroups(groups ?? [])
      },
    )
  }, [])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    const audience = buildAudienceValue(form.audienceType, form.audienceId)
    await adminCreateMessage({
      title: form.title,
      body: form.body,
      audience,
      send_push: form.send_push,
    })
    setSaving(false)
    setShowModal(false)
    setForm(EMPTY_FORM)
    load()
  }

  const handleDelete = async () => {
    await adminDeleteMessage(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const needsSecondary = form.audienceType !== 'All members'

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-primary">Messages</h1>
        <button
          type="button"
          onClick={() => { setForm(EMPTY_FORM); setShowModal(true) }}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-bg"
        >
          <Plus size={16} />
          <span>New Message</span>
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-zinc-500">
                <th className="px-4 py-3 font-normal">Title</th>
                <th className="px-4 py-3 font-normal">Author</th>
                <th className="px-4 py-3 font-normal">Audience</th>
                <th className="px-4 py-3 font-normal">Push</th>
                <th className="px-4 py-3 font-normal">Date</th>
                <th className="px-4 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                    No messages yet
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-primary">{msg.title}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {msg.author ? `${msg.author.first_name} ${msg.author.last_name}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {formatAudience(msg.audience, serviceAreas, midweekGroups)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{msg.send_push ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-zinc-400">{formatShortDate(msg.created_at?.slice(0, 10))}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(msg)}
                        aria-label="Delete"
                        className="text-zinc-400 transition-colors hover:text-[#e55555]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="New Message" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Field label="Title">
              <Input value={form.title} onChange={(e) => update({ title: e.target.value })} required />
            </Field>
            <Field label="Body">
              <Textarea rows={4} value={form.body} onChange={(e) => update({ body: e.target.value })} required />
            </Field>
            <Field label="Audience">
              <Select
                value={form.audienceType}
                onChange={(e) => update({ audienceType: e.target.value, audienceId: '' })}
              >
                {AUDIENCE_TYPE.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>

            {form.audienceType === 'Service area' && (
              <Field label="Select area">
                <Select value={form.audienceId} onChange={(e) => update({ audienceId: e.target.value })} required>
                  <option value="">Choose…</option>
                  {serviceAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
              </Field>
            )}

            {form.audienceType === 'Midweek group' && (
              <Field label="Select group">
                <Select value={form.audienceId} onChange={(e) => update({ audienceId: e.target.value })} required>
                  <option value="">Choose…</option>
                  {midweekGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.host ?? g.zone}</option>
                  ))}
                </Select>
              </Field>
            )}

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.send_push}
                onChange={(e) => update({ send_push: e.target.checked })}
                className="accent-primary"
              />
              <span className="text-sm text-primary">Send as push notification</span>
            </label>

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || (needsSecondary && !form.audienceId)}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-bg disabled:opacity-60"
              >
                {saving ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete message"
          message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
