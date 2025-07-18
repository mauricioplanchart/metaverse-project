import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [users, setUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState<string>('');

  useEffect(() => {
    testConnection();
    subscribeToUsers();
  }, []);

  const testConnection = async () => {
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (error) {
        setConnectionStatus(`Error: ${error.message}`);
        console.error('Supabase connection error:', error);
      } else {
        setConnectionStatus('✅ Connected to Supabase!');
        console.log('Supabase connection successful:', data);
      }
    } catch (err) {
      setConnectionStatus(`Error: ${err}`);
      console.error('Connection test failed:', err);
    }
  };

  const subscribeToUsers = () => {
    const subscription = supabase
      .channel('users_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('Real-time update:', payload);
          loadUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const addUser = async () => {
    if (!newUsername.trim()) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username: newUsername,
            email: `${newUsername}@test.com`,
            is_online: true
          }
        ])
        .select();

      if (error) {
        console.error('Error adding user:', error);
      } else {
        console.log('User added:', data);
        setNewUsername('');
        loadUsers();
      }
    } catch (err) {
      console.error('Failed to add user:', err);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="mb-6">
        <div className={`p-3 rounded-lg ${
          connectionStatus.includes('✅') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <strong>Status:</strong> {connectionStatus}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Add Test User</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter username"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addUser}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add User
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Current Users</h3>
        <button
          onClick={loadUsers}
          className="mb-3 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Refresh Users
        </button>
        
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium">{user.username}</div>
              <div className="text-sm text-gray-600">
                Online: {user.is_online ? 'Yes' : 'No'} | 
                Created: {new Date(user.created_at).toLocaleString()}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-gray-500 text-center py-4">
              No users found. Add one above!
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>Environment Variables:</strong></p>
        <p>URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
        <p>Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
      </div>
    </div>
  );
};

export default SupabaseTest; 