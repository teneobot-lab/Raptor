"use client"
import { useState } from "react";
import { Plus, Users, Edit, UserX, Shield, User } from "lucide-react";
import { createUser, updateUser, deleteUser } from "@/actions/user.actions";
import { toast } from "sonner";
import { format } from "date-fns";

const S = {
  page: { padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  title: { fontSize: '22px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' },
  subtitle: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' },
  btn: (v: 'primary'|'ghost'|'danger') => ({ display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',borderRadius:'8px',fontSize:'13px',fontWeight:600,cursor:'pointer',border:'none',transition:'all 0.15s',background:v==='primary'?'linear-gradient(135deg,#6366f1,#8b5cf6)':v==='danger'?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.06)',color:v==='danger'?'#f87171':'#fff' }),
  card: { background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',overflow:'hidden' },
  th: { padding:'10px 14px',textAlign:'left' as const,fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.35)',letterSpacing:'0.06em',borderBottom:'1px solid rgba(255,255,255,0.06)' },
  td: { padding:'12px 14px',fontSize:'13px',color:'rgba(255,255,255,0.8)',borderBottom:'1px solid rgba(255,255,255,0.04)' },
  badge: (color:string,bg:string) => ({ display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:600,color,background:bg }),
  overlay: { position:'fixed' as const,inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px' },
  modal: { background:'#16161f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'420px' },
  label: { display:'block',fontSize:'12px',fontWeight:500,color:'rgba(255,255,255,0.5)',marginBottom:'6px' },
  input: { width:'100%',padding:'9px 12px',borderRadius:'8px',fontSize:'13px',color:'#fff',outline:'none',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',boxSizing:'border-box' as const },
};

type UserType = { id:string;name:string;email:string;role:string;isActive:boolean;createdAt:string;_count:{transactions:number} };

export function UsersClient({ users: initial }: { users: UserType[] }) {
  const [users, setUsers] = useState(initial);
  const [modal, setModal] = useState<'create'|'edit'|null>(null);
  const [selected, setSelected] = useState<UserType|null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name:'',email:'',password:'',role:'CASHIER' });

  const openCreate = () => { setForm({name:'',email:'',password:'',role:'CASHIER'}); setSelected(null); setModal('create'); };
  const openEdit = (u: UserType) => { setForm({name:u.name,email:u.email,password:'',role:u.role}); setSelected(u); setModal('edit'); };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (modal === 'create') {
        const u = await createUser(form as any);
        setUsers(prev => [u as any, ...prev]);
        toast.success('User created');
      } else if (selected) {
        const u = await updateUser(selected.id, form as any);
        setUsers(prev => prev.map(x => x.id === selected.id ? { ...x, ...u, createdAt: x.createdAt } : x));
        toast.success('User updated');
      }
      setModal(null);
    } catch(e:any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.map(u => u.id === id ? {...u, isActive: false} : u));
      toast.success('User deactivated');
    } catch(e:any) { toast.error(e.message); }
  };

  return (
    <div style={S.page}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div>
          <h1 style={S.title}>Users</h1>
          <p style={S.subtitle}>{users.filter(u=>u.isActive).length} active users</p>
        </div>
        <button style={S.btn('primary')} onClick={openCreate}><Plus size={15}/>Add User</button>
      </div>

      <div style={{ ...S.card, flex:1, overflow:'auto' }}>
        <table style={{ width:'100%',borderCollapse:'collapse' }}>
          <thead><tr>{['User','Role','Transactions','Status','Joined','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.4 }}>
                <td style={S.td}>
                  <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
                    <div style={{ width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0 }}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontWeight:600,color:'#fff' }}>{u.name}</p>
                      <p style={{ fontSize:'11px',color:'rgba(255,255,255,0.35)' }}>{u.email}</p>
                    </div>
                  </div>
                </td>
                <td style={S.td}>
                  <span style={S.badge(u.role==='ADMIN'?'#a5b4fc':'#94a3b8',u.role==='ADMIN'?'rgba(99,102,241,0.15)':'rgba(148,163,184,0.1)')}>
                    {u.role==='ADMIN'?<Shield size={10}/>:<User size={10}/>} {u.role}
                  </span>
                </td>
                <td style={S.td}>{u._count.transactions}</td>
                <td style={S.td}><span style={S.badge(u.isActive?'#34d399':'#f87171',u.isActive?'rgba(52,211,153,0.1)':'rgba(239,68,68,0.1)')}>{u.isActive?'Active':'Inactive'}</span></td>
                <td style={S.td}>{format(new Date(u.createdAt),'MMM dd, yyyy')}</td>
                <td style={S.td}>
                  <div style={{ display:'flex',gap:'6px' }}>
                    <button style={{ ...S.btn('ghost'),padding:'6px 8px' }} onClick={()=>openEdit(u)}><Edit size={13}/></button>
                    <button style={{ ...S.btn('danger'),padding:'6px 8px' }} onClick={()=>handleDeactivate(u.id)}><UserX size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length===0 && (
          <div style={{ textAlign:'center',padding:'48px',color:'rgba(255,255,255,0.25)' }}>
            <Users size={40} style={{ margin:'0 auto 12px',opacity:0.3 }}/>
            <p>No users found</p>
          </div>
        )}
      </div>

      {(modal==='create'||modal==='edit') && (
        <div style={S.overlay} onClick={()=>setModal(null)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <h2 style={{ ...S.title,fontSize:'18px',marginBottom:'20px' }}>{modal==='create'?'Add User':'Edit User'}</h2>
            <div style={{ display:'flex',flexDirection:'column',gap:'14px' }}>
              {[{label:'Full Name',key:'name'},{label:'Email',key:'email',type:'email'},{label:'Password',key:'password',type:'password'}].map(f=>(
                <div key={f.key}>
                  <label style={S.label}>{f.label}{f.key==='password'&&modal==='edit'?' (leave blank to keep)':''}</label>
                  <input style={S.input} type={f.type||'text'} value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                </div>
              ))}
              <div>
                <label style={S.label}>Role</label>
                <select style={S.input} value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                  <option value="CASHIER">Cashier</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex',gap:'10px',marginTop:'20px',justifyContent:'flex-end' }}>
              <button style={S.btn('ghost')} onClick={()=>setModal(null)}>Cancel</button>
              <button style={S.btn('primary')} onClick={handleSave} disabled={loading}>{loading?'Saving...':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
