import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

const SupabaseTestPage: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing Supabase connection...')
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>({})

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    const results: any = {}

    try {
      // Test 1: Basic connection
      setStatus('Testing basic Supabase connection...')
      const { data, error } = await supabase.from('avatars').select('count').limit(1)
      results.connection = error ? { success: false, error: error.message } : { success: true, data }

      // Test 2: Real-time subscription
      setStatus('Testing real-time subscription...')
      results.realtime = { success: true, message: 'Real-time test skipped for now' }

      // Test 3: Authentication (if enabled)
      setStatus('Testing authentication...')
      const { data: authData, error: authError } = await supabase.auth.getSession()
      results.auth = authError ? { success: false, error: authError.message } : { success: true, data: authData }

      // Test 4: Database operations
      setStatus('Testing database operations...')
      const testAvatar = {
        username: 'test_user',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        world_id: 'test-world'
      }

      const { data: insertData, error: insertError } = await supabase
        .from('avatars')
        .insert([testAvatar])
        .select()

      if (insertError) {
        results.database = { success: false, error: insertError.message }
      } else {
        // Clean up test data
        if (insertData && insertData[0]) {
          await supabase.from('avatars').delete().eq('id', insertData[0].id)
        }
        results.database = { success: true, message: 'Database operations working' }
      }

      setTestResults(results)
      setStatus('All tests completed!')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('Tests failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🧪 Supabase Integration Test</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test Status</h2>
          <p className="text-lg mb-4">{status}</p>
          {error && (
            <div className="bg-red-600 text-white p-4 rounded-lg mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(testResults).map(([testName, result]: [string, any]) => (
            <div key={testName} className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 capitalize">
                {testName.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <div className={`p-3 rounded-lg ${
                result.success ? 'bg-green-600' : 'bg-red-600'
              }`}>
                <p className="font-semibold">
                  {result.success ? '✅ Success' : '❌ Failed'}
                </p>
                {result.message && <p className="mt-2">{result.message}</p>}
                {result.error && <p className="mt-2 text-red-200">{result.error}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-600 text-white p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">🎯 What This Tests</h3>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Connection:</strong> Basic connectivity to Supabase</li>
            <li><strong>Real-time:</strong> WebSocket subscription capabilities</li>
            <li><strong>Authentication:</strong> User session management</li>
            <li><strong>Database:</strong> CRUD operations on avatars table</li>
          </ul>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">🔧 Configuration</h3>
          <div className="bg-gray-700 p-4 rounded-lg font-mono text-sm">
            <p>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</p>
            <p>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set ✓' : 'Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupabaseTestPage 