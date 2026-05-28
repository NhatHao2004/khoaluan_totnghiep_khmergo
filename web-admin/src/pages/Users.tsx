import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Shield, User } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  points: number;
  avatar?: string;
  email?: string;
}

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const docs = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        name: doc.data().name || doc.data()['tên'] || 'Anonymous'
      } as UserProfile));
      setUsers(docs);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Quản lý Người dùng</h1>
          <p style={{ color: 'var(--text-muted)' }}>Xem danh sách và quản lý điểm số của người dùng.</p>
        </div>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên hoặc ID..." 
            style={{ width: '100%', paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải người dùng...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>AVATAR</th>
                <th>TÊN NGƯỜI DÙNG</th>
                <th>ID</th>
                <th>ĐIỂM SỐ</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <img 
                      src={user.avatar || 'https://i.pravatar.cc/150?u=' + user.id} 
                      alt={user.name} 
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f1f5f9' }} 
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontFamily: 'monospace' }}>{user.id}</td>
                  <td>
                    <span style={{ 
                      background: '#fef3c7', 
                      color: '#92400e', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '99px', 
                      fontSize: '0.875rem', 
                      fontWeight: 600 
                    }}>
                      {user.points || 0} pts
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn-ghost" title="Chặn người dùng">
                        <Shield size={16} color="#ef4444" />
                      </button>
                      <button className="btn-ghost" title="Xem chi tiết">
                        <User size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Users;
