import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  adminGetMidweekGroups,
  adminCreateMidweekGroup,
  adminUpdateMidweekGroup,
  adminDeleteMidweekGroup,
} from '../../lib/api.js'
import Spinner from '../../components/Spinner.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../admin/components/Modal.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'
import { Field, Input } from '../../admin/components/FormField.jsx'

const EMPTY_GROUP = {
  host: '',
  initials: '',
  zone: '',
  address: '',
  phone: '',
  lat: '',
  lng: '',
  active: true,
}

function initialsFromHost(host) {
  return host
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function toFormState(group) {
  return {
    host: group.host ?? '',
    initials: group.initials ?? '',
    zone: group.zone ?? '',
    address: group.address ?? '',
    phone: group.phone ?? '',
    lat: group.lat ?? '',
    lng: group.lng ?? '',
    active: group.active ?? true,
  }
}

function toPayload(form) {
  return {
    host: form.host,
    initials: form.initials,
    zone: form.zone,
    address: form.address,
    phone: form.phone,
    lat: form.lat === '' ? null : Number(form.lat),
    lng: form.lng === '' ? null : Number(form.lng),
    active: form.active,
  }
}

function GroupForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const [initialsTouched, setInitialsTouched] = useState(Boolean(initial.initials))

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleHostChange = (value) => {
    if (initialsTouched) {
      update({ host: value })
    } else {
      update({ host: value, initials: initialsFromHost(value) })
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(toPayload(form))
      }}
      className="flex flex-col gap-3"
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Field label="Host name">
            <Input value={form.host} onChange={(e) => handleHostChange(e.target.value)} required />
          </Field>
        </div>
        <Field label="Initials">
          <Input
            value={form.initials}
            maxLength={2}
            onChange={(e) => {
              setInitialsTouched(true)
              update({ initials: e.target.value.toUpperCase() })
            }}
          />
        </Field>
      </div>

      <Field label="Zone / neighborhood">
        <Input value={form.zone} onChange={(e) => update({ zone: e.target.value })} />
      </Field>

      <Field label="Address">
        <Input value={form.address} onChange={(e) => update({ address: e.target.value })} />
      </Field>

      <Field label="Phone">
        <Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="34600000000" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude">
          <Input type="number" step="any" value={form.lat} onChange={(e) => update({ lat: e.target.value })} />
        </Field>
        <Field label="Longitude">
          <Input type="number" step="any" value={form.lng} onChange={(e) => update({ lng: e.target.value })} />
        </Field>
      </div>

      <label className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
        <span className="text-sm text-primary">Active</span>
        <button
          type="button"
          role="switch"
          aria-checked={form.active}
          onClick={() => update({ active: !form.active })}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form.active ? 'bg-primary' : 'bg-[#2a2a2a]'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ${
              form.active ? 'translate-x-5 bg-bg' : 'translate-x-0 bg-zinc-500'
            }`}
          />
        </button>
      </label>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-border py-2.5 text-sm text-primary">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-bg disabled:opacity-60">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function AdminMidweek() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [modalGroup, setModalGroup] = useState(null) // 'new' | group | null
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data, error: apiError } = await adminGetMidweekGroups()
    if (apiError) {
      setError(true)
    } else {
      setGroups(data ?? [])
      setError(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    adminGetMidweekGroups().then(({ data, error: apiError }) => {
      if (cancelled) return
      if (apiError) {
        setError(true)
      } else {
        setGroups(data ?? [])
        setError(false)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async (payload) => {
    setSaving(true)
    const { error: apiError } =
      modalGroup === 'new' ? await adminCreateMidweekGroup(payload) : await adminUpdateMidweekGroup(modalGroup.id, payload)
    setSaving(false)

    if (!apiError) {
      setModalGroup(null)
      load()
    }
  }

  const handleDelete = async () => {
    const { error: apiError } = await adminDeleteMidweekGroup(deleteTarget.id)
    if (!apiError) {
      setDeleteTarget(null)
      load()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-primary">Midweek Groups</h1>
        <button
          type="button"
          onClick={() => setModalGroup('new')}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-bg"
        >
          <Plus size={16} />
          <span>Add Group</span>
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-zinc-500">
                <th className="px-4 py-3 font-normal">Host</th>
                <th className="px-4 py-3 font-normal">Zone</th>
                <th className="px-4 py-3 font-normal">Address</th>
                <th className="px-4 py-3 font-normal">Phone</th>
                <th className="px-4 py-3 font-normal">Confirmed</th>
                <th className="px-4 py-3 font-normal">Active</th>
                <th className="px-4 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                    No groups yet
                  </td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-primary">{group.host}</td>
                    <td className="px-4 py-3 text-zinc-400">{group.zone}</td>
                    <td className="px-4 py-3 text-zinc-400">{group.address}</td>
                    <td className="px-4 py-3 text-zinc-400">{group.phone}</td>
                    <td className="px-4 py-3 text-zinc-400">{group.midweek_rsvps?.[0]?.count ?? 0}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          group.active ? 'bg-accent-green text-bg' : 'bg-[#2a2a2a] text-zinc-400'
                        }`}
                      >
                        {group.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setModalGroup(group)} aria-label="Edit" className="text-zinc-400 transition-colors hover:text-primary">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(group)} aria-label="Delete" className="text-zinc-400 transition-colors hover:text-[#e55555]">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalGroup && (
        <Modal title={modalGroup === 'new' ? 'Add Group' : 'Edit Group'} onClose={() => setModalGroup(null)}>
          <GroupForm
            initial={modalGroup === 'new' ? EMPTY_GROUP : toFormState(modalGroup)}
            onSave={handleSave}
            onCancel={() => setModalGroup(null)}
            saving={saving}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete group"
          message={`Are you sure you want to delete "${deleteTarget.host}"'s group? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
