import { useEffect, useState } from 'react';
import { Users, Pencil, CheckCircle2 } from 'lucide-react';
import api, { errorMessage } from '../../api/client.js';
import { Card, CardBody } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input, Select, Field } from '../../components/ui/Form.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { PageLoader, ErrorState, EmptyState } from '../../components/ui/States.jsx';

const ROLE_BADGE = {
  admin: 'bg-purple-50 text-purple-700',
  manager: 'bg-accent-50 text-accent-700',
  employee: 'bg-brand-50 text-brand-700',
};

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [managers, setManagers] = useState([]);

  const load = () => {
    api
      .get('/users')
      .then((res) => setUsers(res.data.results))
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);
  useEffect(() => {
    api.get('/users/managers').then((res) => setManagers(res.data.results)).catch(() => {});
  }, []);

  const openEdit = (u) => {
    setEditTarget(u);
    setForm({ name: u.name, designation: u.designation, department: u.department, salaryBand: u.salaryBand, role: u.role, status: u.status, manager: u.manager?._id || '' });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/users/${editTarget._id}`, form);
      setNotice(`${res.data.user.name} updated.`);
      setEditTarget(null);
      load();
      setTimeout(() => setNotice(''), 5000);
    } catch (err) {
      setError(errorMessage(err, 'Unable to update user.'));
    } finally {
      setSaving(false);
    }
  };

  if (!users && !error) return <PageLoader message="Loading employees and managers..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const filtered = filter === 'All' ? users : users.filter((u) => u.role === filter);
  const counts = {
    All: users.length,
    employee: users.filter((u) => u.role === 'employee').length,
    manager: users.filter((u) => u.role === 'manager').length,
    admin: users.filter((u) => u.role === 'admin').length,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="section-eyebrow">Administration</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">Employees, managers and account status across the company.</p>
      </div>

      {notice && (
        <div className="flex items-center gap-2.5 rounded-xl border border-sunrise-200 bg-sunrise-50 px-5 py-3.5 text-sm font-bold text-sunrise-800">
          <CheckCircle2 size={17} /> {notice}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
              filter === k ? 'bg-navy-950 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {k} <span className="opacity-60">({v})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" message="Try a different filter." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[860px]">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Band</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email} · {u.employeeId || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600">{u.department || '—'}</td>
                    <td className="text-slate-600">{u.designation || '—'}</td>
                    <td><Badge color="navy">Band {u.salaryBand}</Badge></td>
                    <td><span className={`badge capitalize ${ROLE_BADGE[u.role] || ROLE_BADGE.employee}`}>{u.role}</span></td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'bg-sunrise-50 text-sunrise-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
                        <Pencil size={13} /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit modal */}
      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={`Edit ${editTarget?.name || 'user'}`}
        subtitle="Changes are recorded in the audit log"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save changes</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" className="sm:col-span-2">
            <Input value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Designation">
            <Input value={form.designation || ''} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} />
          </Field>
          <Field label="Department">
            <Input value={form.department || ''} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
          </Field>
          <Field label="Salary band">
            <Select value={form.salaryBand || 'A'} onChange={(e) => setForm((f) => ({ ...f, salaryBand: e.target.value }))}>
              <option value="A">Band A</option>
              <option value="B">Band B</option>
              <option value="C">Band C</option>
              <option value="D">Band D</option>
            </Select>
          </Field>
          <Field label="Role">
            <Select value={form.role || 'employee'} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} disabled={editTarget?.role === 'admin'}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              {editTarget?.role === 'admin' && <option value="admin">Admin</option>}
            </Select>
          </Field>
          <Field label="Account status">
            <Select value={form.status || 'active'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
          {form.role === 'employee' && (
            <Field label="Reporting manager" className="sm:col-span-2">
              <Select value={form.manager || ''} onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))}>
                <option value="">—</option>
                {managers.map((m) => <option key={m._id} value={m._id}>{m.name} · {m.department}</option>)}
              </Select>
            </Field>
          )}
        </div>
        {editTarget?.role === 'admin' && (
          <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Admin accounts are protected — role changes are not allowed here for safety.
          </p>
        )}
      </Modal>
    </div>
  );
}
