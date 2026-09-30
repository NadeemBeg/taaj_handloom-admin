import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { USER_ROLES } from '@taaj/shared';
import { listUsers, createUser, updateUser } from '../api';
import { PageHeader, Button, Spinner, Badge, Modal, Field } from '../components/ui';
import { useAuth } from '../store/auth';
import type { AdminUser } from '../types';

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: AdminUser['role'];
}

const roleLabel = (r: string) => r.replace(/_/g, ' ');
const errMsg = (e: unknown) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong';

export function Users() {
  const qc = useQueryClient();
  const me = useAuth((s) => s.user);
  const { data, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: listUsers });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<UserForm>({
    defaultValues: { role: 'ADMIN' },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-users'] });

  const create = useMutation({
    mutationFn: (v: UserForm) => createUser(v),
    onSuccess: () => { setAdding(false); reset({ name: '', email: '', password: '', role: 'ADMIN' }); invalidate(); },
    onError: (e) => setError(errMsg(e)),
  });

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => updateUser(id, body),
    onSuccess: invalidate,
    onError: (e) => setError(errMsg(e)),
  });

  return (
    <div>
      <PageHeader
        title="Admin Users"
        subtitle="Staff accounts and their roles"
        action={<Button onClick={() => { setError(null); setAdding(true); }}>+ New User</Button>}
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ivory text-left text-charcoal/60">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.map((u) => {
                const isSelf = u._id === me?._id;
                return (
                  <tr key={u._id} className="border-t border-line/70">
                    <td className="px-4 py-3 font-medium text-charcoal">
                      {u.name}{isSelf && <span className="ml-2 text-xs text-charcoal/40">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-charcoal/60">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        className="tf py-1 text-xs"
                        value={u.role}
                        disabled={isSelf || patch.isPending}
                        onChange={(e) => patch.mutate({ id: u._id, body: { role: e.target.value } })}
                      >
                        {USER_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isSelf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={patch.isPending}
                          onClick={() => patch.mutate({ id: u._id, body: { isActive: !u.isActive } })}
                        >
                          {u.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data?.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-charcoal/50">No users.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {adding && (
        <Modal title="New Admin User" onClose={() => setAdding(false)}>
          <form onSubmit={handleSubmit((v) => create.mutate(v))} className="space-y-4">
            <Field label="Name"><input className="tf" {...register('name', { required: true })} /></Field>
            <Field label="Email"><input className="tf" type="email" {...register('email', { required: true })} /></Field>
            <Field label="Temporary password"><input className="tf" type="text" {...register('password', { required: true, minLength: 8 })} /></Field>
            <Field label="Role">
              <select className="tf" {...register('role')}>
                {USER_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setAdding(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create user'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
